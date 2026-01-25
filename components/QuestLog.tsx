"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, Circle, Zap, ExternalLink, FileText, Video } from "lucide-react"
import {
  ensureTopicProgress,
  handleVideoComplete,
  handleTestSubmit,
  handleRevisionComplete,
  openMaterial,
  fetchStudyMaterials,
  type TopicProgressData,
  type StudyMaterial,
} from "@/lib/questLog/questLogSystem"

interface Topic {
  id: string
  name: string
  description: string
}

interface QuestData {
  topic: Topic
  progress: TopicProgressData | null
  materials: StudyMaterial[]
}

interface QuestLogProps {
  studentId: string
}

export function QuestLog({ studentId }: QuestLogProps) {
  const [quests, setQuests] = useState<QuestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testScores, setTestScores] = useState<Record<string, number>>({})
  const [submittingTest, setSubmittingTest] = useState<Record<string, boolean>>({})
  const [completingRevision, setCompletingRevision] = useState<Record<string, boolean>>({})
  const [expandedMaterials, setExpandedMaterials] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  useEffect(() => {
    fetchQuests()
  }, [studentId])

  const fetchQuests = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: topics, error: topicsError } = await supabase
        .from("topics")
        .select("id, name, description")
        .order("created_at", { ascending: true })

      if (topicsError) throw new Error(topicsError.message)

      const { data: progressData } = await supabase
        .from("topic_progress")
        .select("*")
        .eq("student_id", studentId)

      const progressMap = new Map((progressData || []).map((p) => [p.topic_id, p]))
      const topicIds = (topics || []).map((t) => t.id)
      const materialsMap = await fetchStudyMaterials(topicIds)

      const questData: QuestData[] = (topics || []).map((topic) => ({
        topic,
        progress: progressMap.get(topic.id) || null,
        materials: materialsMap.get(topic.id) || [],
      }))

      setQuests(questData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load quests"
      setError(msg)
      console.error("Error fetching quests:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- Helper to fix the Progress Bar Glitch locally ---
  const calculateDisplayProgress = (p: TopicProgressData | null) => {
    if (!p) return 0
    
    // Logic: If all revisions are done, force 100% regardless of backend calculation glitch
    const allRevisionsDone = 
      p.revision_1_completed && 
      p.revision_2_completed && 
      p.revision_3_completed && 
      p.revision_4_completed

    // You can add "&& p.test_completed" here if passing test is required for 100%
    if (allRevisionsDone) return 100

    return p.progress_percentage
  }

  // --- Helper to fix XP Glitch locally ---
  const calculateDisplayXP = (p: TopicProgressData | null) => {
    if (!p) return 0
    
    const allRevisionsDone = 
      p.revision_1_completed && 
      p.revision_2_completed && 
      p.revision_3_completed && 
      p.revision_4_completed

    // If backend returns < 100 but we know they finished, show 100 (or add the bonus)
    if (allRevisionsDone && p.total_xp < 100) return 100

    return p.total_xp
  }

  const handleVideoClick = async (topicId: string, material: StudyMaterial) => {
    try {
      // Open immediately for better UX
      window.open(material.resource_url, "_blank")

      const updated = await handleVideoComplete(studentId, topicId)
      if (updated) {
        setQuests((prev) =>
          prev.map((q) =>
            q.topic.id === topicId ? { ...q, progress: updated } : q
          )
        )
        await openMaterial(studentId, topicId, "video")
      }
    } catch (err) {
      console.error("Error handling video:", err)
    }
  }

  const handlePDFClick = async (topicId: string, material: StudyMaterial) => {
    try {
      window.open(material.resource_url, "_blank")
      await openMaterial(studentId, topicId, "pdf")
    } catch (err) {
      console.error("Error opening PDF:", err)
    }
  }

  const handleTestClick = async (topicId: string, material: StudyMaterial) => {
    try {
      window.open(material.resource_url, "_blank")
      await openMaterial(studentId, topicId, "test")
    } catch (err) {
      console.error("Error opening test:", err)
    }
  }

  const handleTestScoreChange = (topicId: string, value: string) => {
    const score = Math.min(Math.max(parseInt(value) || 0, 0), 20)
    setTestScores((prev) => ({ ...prev, [topicId]: score }))
  }

  const handleTestSave = async (topicId: string) => {
    const score = testScores[topicId] || 0
    try {
      setSubmittingTest((prev) => ({ ...prev, [topicId]: true }))

      const updated = await handleTestSubmit(studentId, topicId, score)
      if (updated) {
        setQuests((prev) =>
          prev.map((q) =>
            q.topic.id === topicId ? { ...q, progress: updated } : q
          )
        )
        // FIX: Removed the code that opened the test material window here.
        // Just submitting the score now.
      }
    } catch (err) {
      console.error("Error saving test score:", err)
    } finally {
      setSubmittingTest((prev) => ({ ...prev, [topicId]: false }))
    }
  }

  const handleRevisionClick = async (topicId: string, revisionIndex: number) => {
    const key = `${topicId}-${revisionIndex}`
    
    // FIX: 1. Find and open material IMMEDIATELY (don't wait for DB)
    const quest = quests.find((q) => q.topic.id === topicId)
    let materialToOpen: StudyMaterial | undefined

    if (revisionIndex === 1) {
      materialToOpen = quest?.materials.find((m) => m.content_type === "video")
    } else if (revisionIndex === 2) {
      materialToOpen = quest?.materials.find((m) => m.content_type === "pdf" || m.content_type === "notes")
    } else if (revisionIndex === 3) {
      materialToOpen = quest?.materials.find((m) => m.content_type === "test")
    } else if (revisionIndex === 4) {
      materialToOpen = quest?.materials.find((m) => m.content_type === "slides" || m.content_type === "reference")
    }

    if (materialToOpen) {
      window.open(materialToOpen.resource_url, "_blank")
    }
    
    // FIX: 2. Then do the background update
    try {
      setCompletingRevision((prev) => ({ ...prev, [key]: true }))
      
      // Update DB in background
      const updated = await handleRevisionComplete(studentId, topicId, revisionIndex)
      
      if (updated) {
        setQuests((prev) =>
          prev.map((q) =>
            q.topic.id === topicId ? { ...q, progress: updated } : q
          )
        )
        // Log the view in background
        if (revisionIndex === 1) await openMaterial(studentId, topicId, "video")
        else if (revisionIndex === 2) await openMaterial(studentId, topicId, "pdf")
        else if (revisionIndex === 3) await openMaterial(studentId, topicId, "test")
        else if (revisionIndex === 4) await openMaterial(studentId, topicId, "pdf")
      }
    } catch (err) {
      console.error("Error completing revision:", err)
    } finally {
      setCompletingRevision((prev) => ({ ...prev, [key]: false }))
    }
  }

  const getMaterialIcon = (contentType: string) => {
    if (contentType === "video") return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const completedQuests = quests.filter(
    (q) => calculateDisplayProgress(q.progress) === 100
  ).length

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📜 Quest Log</h1>
        <p className="text-muted-foreground mt-2">
          {completedQuests}/{quests.length} Quests Complete
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Quests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Quests</CardTitle>
          <CardDescription>Track your progress on each topic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quests.map((quest) => {
            const p = quest.progress
            
            // USE NEW HELPERS FOR DISPLAY
            const progressPercent = calculateDisplayProgress(p)
            const currentXP = calculateDisplayXP(p)

            let displayStatus = "NEEDS_WORK"
            let statusBadgeText = "Not Started"

            if (p) {
              if (progressPercent === 100) {
                displayStatus = "MASTERED"
                statusBadgeText = "✓ MASTERED"
              } else if (currentXP >= 180) {
                displayStatus = "MASTERED"
                statusBadgeText = "🟢 MASTERED"
              } else if (currentXP >= 120) {
                displayStatus = "GOOD"
                statusBadgeText = "🟡 GOOD"
              } else if (currentXP > 0) {
                displayStatus = "NEEDS_WORK"
                statusBadgeText = "📈 NEEDS_WORK"
              }
            }

            return (
              <div key={quest.topic.id} className="border rounded-lg p-4 space-y-3">
                {/* Quest Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{quest.topic.name}</h3>
                    <p className="text-sm text-muted-foreground">{quest.topic.description}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-bold">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>

                {/* XP Display */}
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">{currentXP} XP</span>
                  {p && (
                    <span className="text-xs text-muted-foreground">
                      {currentXP >= 180 ? "(Master Level)" : currentXP >= 120 ? "(Good Progress)" : "(Keep Going)"}
                    </span>
                  )}
                </div>

                {/* Study Materials Section */}
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setExpandedMaterials((prev) => ({
                        ...prev,
                        [quest.topic.id]: !prev[quest.topic.id],
                      }))
                    }
                    className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {expandedMaterials[quest.topic.id] ? "Hide" : "Show"} Study Materials ({quest.materials.length})
                  </button>

                  {expandedMaterials[quest.topic.id] && (
                    <div className="grid grid-cols-2 gap-2 ml-4">
                      {quest.materials.map((material) => (
                        <Button
                          key={material.id}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => {
                            if (material.content_type === "video") {
                              handleVideoClick(quest.topic.id, material)
                            } else if (material.content_type === "test") {
                              handleTestClick(quest.topic.id, material)
                            } else {
                              handlePDFClick(quest.topic.id, material)
                            }
                          }}
                        >
                          {getMaterialIcon(material.content_type)}
                          <span className="ml-2 truncate">{material.title}</span>
                          <ExternalLink className="w-3 h-3 ml-auto" />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quest Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {/* Test */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Test Score</p>
                    {p?.test_completed ? (
                      <div className="text-green-700 text-sm font-semibold">{p.test_score}/20</div>
                    ) : (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          placeholder="0"
                          value={testScores[quest.topic.id] ?? ""}
                          onChange={(e) => handleTestScoreChange(quest.topic.id, e.target.value)}
                          className="h-8 text-xs p-1"
                        />
                        <Button
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTestSave(quest.topic.id)}
                          disabled={submittingTest[quest.topic.id]}
                        >
                          {submittingTest[quest.topic.id] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Revisions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Revisions</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((rev) => {
                        const isCompleted = p?.[`revision_${rev}_completed` as keyof typeof p]
                        const key = `${quest.topic.id}-${rev}`

                        return (
                          <Button
                            key={rev}
                            size="sm"
                            variant={isCompleted ? "default" : "outline"}
                            className="h-8 w-8 p-0"
                            onClick={() => handleRevisionClick(quest.topic.id, rev)}
                            disabled={completingRevision[key]}
                            title={`Revision ${rev}`}
                          >
                            {completingRevision[key] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              rev
                            )}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}