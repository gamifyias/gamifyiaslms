export const dynamic = "force-dynamic";

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, BookOpen, ChevronRight } from "lucide-react"
import Link from "next/link"
import { StudentSidebar } from "@/components/student-sidebar"

interface Subject {
  id: string
  name: string
  description: string
}

interface TopicStats {
  topicId: string
  topicName: string
  progress: number
  status: "MASTERED" | "GOOD" | "NEEDS_WORK" | "Not Started"
  revisionsCompleted: number
  totalRevisions: number
  materialsCompleted: number
  totalMaterials: number
  hasStarted: boolean
  testScore: number
  totalXP: number
  lastRevisionDate: string | null
}

interface SubjectWithTopics {
  subject: Subject
  topics: TopicStats[]
  completedTopics: number
  totalTopics: number
  averageProgress: number
}

// =============================
// Utility Functions
// =============================

const getStatusFromXP = (totalXP: number): "MASTERED" | "GOOD" | "NEEDS_WORK" => {
  if (totalXP >= 180) return "MASTERED"
  if (totalXP >= 120) return "GOOD"
  return "NEEDS_WORK"
}

const isRevisionAllowedToday = (lastRevisionDate: string | null): boolean => {
  if (!lastRevisionDate) return true
  
  const lastDate = new Date(lastRevisionDate)
  const today = new Date()
  
  // Reset time to compare only dates
  lastDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  // Allow if last revision was on a different day
  return lastDate.getTime() !== today.getTime()
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user?.id) {
          setError("User not authenticated")
          return
        }

        // Fetch all subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*")
          .order("name", { ascending: true })

        if (subjectsError) throw new Error(`Failed to fetch subjects: ${subjectsError.message}`)

        if (!subjectsData || subjectsData.length === 0) {
          setSubjects([])
          setLoading(false)
          return
        }

        // For each subject, fetch topics, progress, revisions, and materials
        const subjectsWithTopics: SubjectWithTopics[] = await Promise.all(
          subjectsData.map(async (subject) => {
            try {
              // Fetch topics for this subject
              const { data: topicsData, error: topicsError } = await supabase
                .from("topics")
                .select("id, name, description")
                .eq("subject_id", subject.id)
                .order("name", { ascending: true })

              if (topicsError) {
                console.warn(`Error fetching topics for subject ${subject.id}:`, topicsError)
                return {
                  subject,
                  topics: [],
                  completedTopics: 0,
                  totalTopics: 0,
                  averageProgress: 0,
                }
              }

              if (!topicsData || topicsData.length === 0) {
                return {
                  subject,
                  topics: [],
                  completedTopics: 0,
                  totalTopics: 0,
                  averageProgress: 0,
                }
              }

              const topicIds = topicsData.map((t) => t.id)

              // Fetch progress for all topics
              const { data: progressData } = await supabase
                .from("topic_progress")
                .select("topic_id, progress_percentage, status, total_xp, test_score")
                .eq("student_id", user.id)
                .in("topic_id", topicIds)

              // Fetch revision schedule for all topics
              const { data: revisionData } = await supabase
                .from("revision_schedule")
                .select("topic_id, is_completed, completed_date")
                .eq("student_id", user.id)
                .in("topic_id", topicIds)

              // Fetch study materials for all topics
              const { data: materialsData } = await supabase
                .from("study_materials")
                .select("id, topic_id, content_type")
                .in("topic_id", topicIds)

              // Fetch XP events to check if materials have been accessed/completed
              const { data: xpEventsData } = await supabase
                .from("xp_events")
                .select("material_id, event_type")
                .eq("student_id", user.id)
                .in("material_id", (materialsData || []).map((m) => m.id))

              // FIXED: Fetch ALL test attempts and map latest by material
              const { data: testAttemptsData } = await supabase
                .from("tests")
                .select("test_material_id, score, max_score, created_at")
                .eq("student_id", user.id)
                .in("test_material_id", (materialsData || []).filter((m) => m.content_type === "test").map((m) => m.id))
                .order("created_at", { ascending: false })

              // FIXED: Create a map of latest test score per material
              const latestTestByMaterial = new Map<string, any>()
              testAttemptsData?.forEach((attempt) => {
                if (!latestTestByMaterial.has(attempt.test_material_id)) {
                  latestTestByMaterial.set(attempt.test_material_id, attempt)
                }
              })

              // Map topics with their complete stats
              const topicsWithStats: TopicStats[] = topicsData.map((topic) => {
                const progress = progressData?.find((p) => p.topic_id === topic.id)
                const topicRevisions = revisionData?.filter((r) => r.topic_id === topic.id) || []
                const completedRevisions = topicRevisions.filter((r) => r.is_completed).length

                // Check if topic has been started (has entries in revision_schedule)
                const hasStarted = topicRevisions.length > 0

                // Get latest revision date
                const latestRevision = topicRevisions
                  .filter((r) => r.completed_date)
                  .sort((a, b) => new Date(b.completed_date!).getTime() - new Date(a.completed_date!).getTime())
                  .at(0)
                const lastRevisionDate = latestRevision?.completed_date || null

                // Get materials for this topic
                const topicMaterials = materialsData?.filter((m) => m.topic_id === topic.id) || []
                let materialsCompleted = 0
                let totalMaterials = topicMaterials.length

                // Check completion for each material type
                topicMaterials.forEach((material) => {
                  if (material.content_type === "video" || material.content_type === "notes") {
                    // Video or notes completed if accessed (XP event exists)
                    const hasAccessed = xpEventsData?.some(
                      (e) => e.material_id === material.id && 
                      (e.event_type === "video_watch" || e.event_type === "note_read")
                    )
                    if (hasAccessed) materialsCompleted++
                  } else if (material.content_type === "test") {
                    // Test completed if passed (score >= 12)
                    const testResult = latestTestByMaterial.get(material.id)
                    if (testResult && testResult.score >= 12) {
                      materialsCompleted++
                    }
                  } else {
                    // Other materials (pdf, slides, etc.) completed if accessed
                    const hasAccessed = xpEventsData?.some((e) => e.material_id === material.id)
                    if (hasAccessed) materialsCompleted++
                  }
                })

                // Calculate progress based on whether topic has started
                let calculatedProgress = 0

                if (!hasStarted) {
                  // Topic not started yet
                  calculatedProgress = 0
                } else {
                  // Topic has started - calculate progress
                  // Materials progress (50%)
                  const materialsProgress = totalMaterials > 0 ? (materialsCompleted / totalMaterials) * 100 : 0
                  calculatedProgress += materialsProgress * 0.5

                  // Revision progress (30%)
                  const revisionProgress = topicRevisions.length > 0 ? (completedRevisions / topicRevisions.length) * 100 : 0
                  calculatedProgress += revisionProgress * 0.3

                  // Topic progress (20%)
                  const topicProgress = progress?.progress_percentage || 0
                  calculatedProgress += topicProgress * 0.2

                  calculatedProgress = Math.round(calculatedProgress)
                }

                // Ensure minimum 1% if started but no progress
                if (hasStarted && calculatedProgress === 0) {
                  calculatedProgress = 1
                }

                // FIXED: Get latest test score for this topic (from topic_progress which stores it)
                const testScore = progress?.test_score || 0

                // FIXED: Get total XP from topic_progress
                const totalXP = progress?.total_xp || 0

                // FIXED: Calculate status based on actual totalXP value
                let calculatedStatus: "MASTERED" | "GOOD" | "NEEDS_WORK"
                if (totalXP >= 180) {
                  calculatedStatus = "MASTERED"
                } else if (totalXP >= 120) {
                  calculatedStatus = "GOOD"
                } else {
                  calculatedStatus = "NEEDS_WORK"
                }

                // Topic is complete only if all materials are completed and all revisions are done
                const isTopicComplete = 
                  hasStarted &&
                  materialsCompleted === totalMaterials && 
                  completedRevisions === topicRevisions.length &&
                  totalMaterials > 0

                return {
                  topicId: topic.id,
                  topicName: topic.name,
                  progress: isTopicComplete ? 100 : calculatedProgress,
                  status: isTopicComplete ? "MASTERED" : calculatedStatus,
                  revisionsCompleted: completedRevisions,
                  totalRevisions: topicRevisions.length,
                  materialsCompleted,
                  totalMaterials,
                  hasStarted,
                  testScore,
                  totalXP,
                  lastRevisionDate,
                }
              })

              // Subject is complete only if all topics are 100%
              const completedTopics = topicsWithStats.filter((t) => t.progress === 100).length
              const averageProgress =
                topicsWithStats.length > 0
                  ? Math.round(topicsWithStats.reduce((sum, t) => sum + t.progress, 0) / topicsWithStats.length)
                  : 0

              return {
                subject,
                topics: topicsWithStats,
                completedTopics,
                totalTopics: topicsWithStats.length,
                averageProgress,
              }
            } catch (err) {
              console.error(`Error processing subject ${subject.id}:`, err)
              return {
                subject,
                topics: [],
                completedTopics: 0,
                totalTopics: 0,
                averageProgress: 0,
              }
            }
          })
        )

        setSubjects(subjectsWithTopics)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load subjects"
        setError(errorMsg)
        console.error("Error fetching subjects:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 overflow-auto p-6">
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">Error: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">No Subjects Available</h1>
            <p className="text-muted-foreground">Subjects will appear here once your instructor creates them.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <StudentSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">📚 Subjects</h1>
            <p className="text-muted-foreground mt-2">Explore and master your subjects</p>
          </div>

          <div className="grid gap-6">
            {subjects.map((subjectData) => (
              <Card key={subjectData.subject.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{subjectData.subject.name}</CardTitle>
                      <CardDescription className="mt-2">{subjectData.subject.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant={subjectData.averageProgress === 100 ? "default" : "outline"}>
                        {subjectData.completedTopics}/{subjectData.totalTopics} completed
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Subject Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Subject Progress</span>
                      <span className="text-sm font-bold">{subjectData.averageProgress}%</span>
                    </div>
                    <Progress value={subjectData.averageProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      Complete all topics to reach 100%
                    </p>
                  </div>

                  {/* Topics List */}
                  {subjectData.totalTopics > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold mb-3">Topics</h4>
                      {subjectData.topics.map((topic) => {
                        const canReviseToday = isRevisionAllowedToday(topic.lastRevisionDate)

                        return (
                          <Link
                            key={topic.topicId}
                            href={`/student/subjects/${topic.topicId}`}
                          >
                            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                    {topic.topicName}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {topic.hasStarted 
                                      ? `${topic.materialsCompleted}/${topic.totalMaterials} materials • ${topic.revisionsCompleted}/${topic.totalRevisions} revisions`
                                      : "Not started yet"
                                    }
                                  </span>
                                </div>

                                {/* Test Score and XP */}
                                {topic.hasStarted && (
                                  <div className="flex items-center gap-3 mb-2 text-xs">
                                    {topic.testScore > 0 && (
                                      <span className="font-semibold text-green-700">
                                        Test: {topic.testScore}/20
                                      </span>
                                    )}
                                    <span className="font-semibold text-blue-700">
                                      {topic.totalXP} XP
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <Progress value={topic.progress} className="h-2 flex-1" />
                                  <span className="text-xs font-bold text-muted-foreground">{topic.progress}%</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {topic.progress === 100 && (
                                  <Badge className="bg-green-100 text-green-800">✓ MASTERED</Badge>
                                )}
                                {topic.status === "GOOD" && topic.progress < 100 && (
                                  <Badge className="bg-blue-100 text-blue-800">🟡 GOOD</Badge>
                                )}
                                {topic.status === "NEEDS_WORK" && topic.progress > 0 && topic.progress < 100 && (
                                  <Badge className="bg-yellow-100 text-yellow-800">📈 NEEDS_WORK</Badge>
                                )}
                                {topic.progress === 0 && (
                                  <Badge variant="outline">Not Started</Badge>
                                )}
                                {topic.totalRevisions > topic.revisionsCompleted && !canReviseToday && (
                                  <Badge className="bg-red-100 text-red-800 text-xs">⏳ 1/day</Badge>
                                )}
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No topics available for this subject yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
