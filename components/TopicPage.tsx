"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Repeat, ChevronDown, Zap, Loader2, X, AlertCircle, Check } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/components/ui/use-toast"
import { XPPopup } from "@/components/XPPopup"
import { Confetti } from "@/components/Confetti"
import { awardXP, XPEventType } from "@/lib/xp/awardXP"
import { openMaterial } from "@/lib/dojo/dojoSystem"
import { useDojo } from "@/hooks/useDojo"
import { StudentSidebar } from "@/components/student-sidebar"

interface TopicPageProps {
  topicId: string
  studentId: string
  showSidebar?: boolean
}

interface Topic {
  id: string
  name: string
  description: string
  subject_id: string
}

interface StudyMaterial {
  id: string
  topic_id: string
  title: string
  content_type: "video" | "pdf" | "notes" | "slides" | "test" | "test-solution" | "reference" | "extra"
  resource_url: string
  created_at: string
}

interface TopicProgress {
  topic_id: string
  student_id: string
  video_xp: number
  test_xp: number
  revision_xp: number
  total_xp: number
  status: "MASTERED" | "GOOD" | "NEEDS_WORK" | "Not Started"
  progress_percentage: number
  test_score: number
  revision_1_completed: boolean
  revision_2_completed: boolean
  revision_3_completed: boolean
  revision_4_completed: boolean
}

interface Revision {
  topic_id: string
  student_id: string
  revision_number: number
  due_date: string
  is_completed: boolean
  is_overdue: boolean
}

interface GroupedMaterials {
  video: StudyMaterial[]
  notes: StudyMaterial[]
  pdf: StudyMaterial[]
  slides: StudyMaterial[]
  test: StudyMaterial[]
  "test-solution": StudyMaterial[]
  reference: StudyMaterial[]
  extra: StudyMaterial[]
}

interface TestAttempt {
  id: string
  student_id: string
  topic_id: string
  test_material_id: string
  attempt_number: number
  score: number
  max_score: number
  created_at: string
}

// Study Materials Component with XP System
function StudyMaterials({ materials, studentId, topicId, onXPAward, onOpenMaterial }: { 
  materials: StudyMaterial[]
  studentId: string
  topicId: string
  onXPAward: (eventType: any, materialId: string, score?: number) => Promise<void>
  onOpenMaterial: (materialId: string, contentType: string) => void
}) {
  const [testAttempts, setTestAttempts] = useState<Record<string, TestAttempt[]>>({})
  const [testInputs, setTestInputs] = useState<Record<string, number | undefined>>({})
  const [submittingTests, setSubmittingTests] = useState<Record<string, boolean>>({})
  const [retestingTests, setRetestingTests] = useState<Record<string, boolean>>({})
  const [loadingScores, setLoadingScores] = useState(true)
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({})
  const supabase = createClient()
  const { toast } = useToast()

  const groupMaterials = (items: StudyMaterial[]): GroupedMaterials => {
    const grouped: GroupedMaterials = {
      video: [],
      notes: [],
      pdf: [],
      slides: [],
      test: [],
      "test-solution": [],
      reference: [],
      extra: [],
    }

    items.forEach((item) => {
      if (item.content_type in grouped) {
        grouped[item.content_type as keyof GroupedMaterials].push(item)
      }
    })

    return grouped
  }

  // Fetch all test attempts
  useEffect(() => {
    const fetchTestAttempts = async () => {
      setLoadingScores(true)
      try {
        const testMaterials = materials.filter((m) => m.content_type === "test")
        
        const attempts: Record<string, TestAttempt[]> = {}
        
        for (const material of testMaterials) {
          const { data, error } = await supabase
            .from("tests")
            .select("*")
            .eq("student_id", studentId)
            .eq("test_material_id", material.id)
            .order("attempt_number", { ascending: false })

          if (!error && data) {
            attempts[material.id] = data
          } else {
            attempts[material.id] = []
          }
        }
        
        setTestAttempts(attempts)
      } catch (err) {
        console.error("Error fetching test attempts:", err)
      } finally {
        setLoadingScores(false)
      }
    }

    if (materials.length > 0) {
      fetchTestAttempts()
    }
  }, [materials, studentId, topicId, supabase])

  const handleOpenMaterialLocal = async (materialId: string, contentType: string) => {
    const eventTypeMap: Record<string, any> = {
      video: "video_watch",
      notes: "note_read",
      pdf: "note_read",
      slides: "note_read",
      "test-solution": "note_read",
      reference: "note_read",
      extra: "note_read",
    }

    const eventType = eventTypeMap[contentType] || "note_read"
    
    const materialTypeMap: Record<string, "pdf" | "video" | "test"> = {
      video: "video",
      notes: "pdf",
      pdf: "pdf",
      slides: "pdf",
      "test-solution": "pdf",
      reference: "pdf",
      extra: "pdf",
    }

    const materialType = materialTypeMap[contentType] || "pdf"

    try {
      await openMaterial(topicId, studentId, materialType)
      
      await onXPAward(eventType, materialId)
      
      onOpenMaterial(materialId, contentType)
      
      const material = materials.find(m => m.id === materialId)
      if (material) {
        window.open(material.resource_url, "_blank")
      }
    } catch (err) {
      console.error("Error opening material:", err)
    }
  }

  const handleTestScoreSubmitWithXP = async (materialId: string, score: number, isRetest: boolean = false) => {
    const stateKey = isRetest ? `retest-${materialId}` : materialId
    setSubmittingTests((prev) => ({
      ...prev,
      [stateKey]: true,
    }))

    try {
      const currentAttempts = testAttempts[materialId] || []
      const nextAttemptNumber = currentAttempts.length > 0 
        ? Math.max(...currentAttempts.map(a => a.attempt_number)) + 1
        : 1

      const { data, error } = await supabase.from("tests").insert({
        student_id: studentId,
        topic_id: topicId,
        test_material_id: materialId,
        attempt_number: nextAttemptNumber,
        score,
        max_score: 20,
      }).select()

      if (error) throw new Error(`Failed to submit score: ${error.message}`)

      await onXPAward("test_score", materialId, score)

      if (data && data.length > 0) {
        setTestAttempts((prev) => ({
          ...prev,
          [materialId]: [data[0], ...currentAttempts],
        }))
      }

      setTestInputs((prev) => ({
        ...prev,
        [materialId]: undefined,
      }))

      setRetestingTests((prev) => ({
        ...prev,
        [materialId]: false,
      }))
    } catch (err) {
      console.error("Error submitting test score:", err)
      toast({
        title: "Error",
        description: "Failed to submit test score.",
        variant: "destructive",
      })
    } finally {
      setSubmittingTests((prev) => ({
        ...prev,
        [stateKey]: false,
      }))
    }
  }

  const handleTestScoreChange = (materialId: string, value: string) => {
    const numValue = value === "" ? undefined : Math.min(Math.max(parseInt(value) || 0, 0), 20)
    setTestInputs((prev) => ({
      ...prev,
      [materialId]: numValue,
    }))
  }

  const grouped = groupMaterials(materials)
  const hasAnyMaterials = Object.values(grouped).some((arr) => arr.length > 0)

  if (!hasAnyMaterials) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground">No study materials available for this topic yet.</p>
        </CardContent>
      </Card>
    )
  }

  const getAttemptStatus = (score: number) => {
    return score >= 12 ? { label: "PASSED", color: "bg-green-100 text-green-800" } : { label: "FAILED", color: "bg-red-100 text-red-800" }
  }

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: StudyMaterial[],
    buttonLabel: string,
    isTestSection: boolean = false
  ) => {
    if (items.length === 0) return null

    return (
      <div key={title}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {icon} {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => {
                const attempts = testAttempts[item.id] || []
                const latestAttempt = attempts.length > 0 ? attempts[0] : null
                const isShowingRetest = retestingTests[item.id]
                const currentInput = testInputs[item.id]
                const isSubmitting = submittingTests[isShowingRetest ? `retest-${item.id}` : item.id]

                return (
                  <div key={item.id} className="rounded-lg border p-4 hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <Badge variant="secondary" className="mt-2">
                          {item.content_type}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleOpenMaterialLocal(item.id, item.content_type)}
                          size="sm"
                          variant="outline"
                          className="gap-1"
                        >
                          <Zap className="h-3 w-3" />
                          {buttonLabel}
                        </Button>
                      </div>
                    </div>

                    {isTestSection && (
                      <div className="space-y-4 border-t pt-4">
                        {latestAttempt && !isShowingRetest && (
                          <div className="rounded-lg bg-muted p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-semibold">
                                  Latest Score: {latestAttempt.score} / {latestAttempt.max_score}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Attempt #{latestAttempt.attempt_number}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Taken on: {new Date(latestAttempt.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className={getAttemptStatus(latestAttempt.score).color}>
                                {getAttemptStatus(latestAttempt.score).label}
                              </Badge>
                            </div>
                          </div>
                        )}

                        {!latestAttempt || isShowingRetest ? (
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Score (out of 20)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                placeholder="Enter your score"
                                value={currentInput ?? ""}
                                onChange={(e) => handleTestScoreChange(item.id, e.target.value)}
                                disabled={isSubmitting}
                              />
                            </div>
                            <Button
                              onClick={() => handleTestScoreSubmitWithXP(item.id, currentInput || 0, isShowingRetest)}
                              disabled={currentInput === undefined || isSubmitting}
                              size="sm"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Submitting
                                </>
                              ) : isShowingRetest ? (
                                "Resubmit"
                              ) : (
                                "Submit"
                              )}
                            </Button>
                            {isShowingRetest && (
                              <Button
                                onClick={() => {
                                  setRetestingTests((prev) => ({ ...prev, [item.id]: false }))
                                  setTestInputs((prev) => ({ ...prev, [item.id]: undefined }))
                                }}
                                variant="outline"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button
                            onClick={() => setRetestingTests((prev) => ({ ...prev, [item.id]: true }))}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Repeat className="h-3 w-3 mr-2" />
                            Retest
                          </Button>
                        )}

                        {attempts.length > 1 && (
                          <Collapsible
                            open={expandedHistory[item.id] || false}
                            onOpenChange={(open) => setExpandedHistory((prev) => ({ ...prev, [item.id]: open }))}
                          >
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full h-8">
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Attempt History ({attempts.length})
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-2 mt-2">
                              {attempts.map((attempt) => (
                                <div
                                  key={attempt.id}
                                  className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm"
                                >
                                  <div>
                                    <p className="font-medium">Attempt #{attempt.attempt_number}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(attempt.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                      {attempt.score}/{attempt.max_score}
                                    </span>
                                    <Badge className={getAttemptStatus(attempt.score).color}>
                                      {getAttemptStatus(attempt.score).label}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { video, notes, pdf, slides, test, "test-solution": testSolution, reference, extra } = grouped

  return (
    <div className="space-y-6">
      {renderSection("🎬 Videos", <Zap className="h-4 w-4" />, video, "Watch")}
      {renderSection("📝 Notes", <Zap className="h-4 w-4" />, notes, "Read")}
      {renderSection("📄 PDFs", <Zap className="h-4 w-4" />, pdf, "Read")}
      {renderSection("🖼️ Slides", <Zap className="h-4 w-4" />, slides, "Read")}
      {renderSection("✍️ Tests", <Zap className="h-4 w-4" />, test, "Start", true)}
    </div>
  )
}

export const TopicPage = ({ topicId, studentId, showSidebar = true }: TopicPageProps) => {
  const supabase = createClient()
  const { toast } = useToast()

  const [topic, setTopic] = useState<Topic | null>(null)
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showXPPopup, setShowXPPopup] = useState({ show: false, xp: 0 })
  const [showConfetti, setShowConfetti] = useState(false)

  const { tabs: allDojoTabs, refetchTabs, handleCompleteRevision: dojoHandleCompleteRevision } = useDojo(studentId)

  const dojoTabs = {
    overdue: allDojoTabs.overdue.filter(t => t.topic_id === topicId),
    today: allDojoTabs.today.filter(t => t.topic_id === topicId),
    upcoming: allDojoTabs.upcoming.filter(t => t.topic_id === topicId),
  }

  const fetchTopicData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select("*")
        .eq("id", topicId)
        .single()

      if (topicError || !topicData) throw new Error(topicError?.message || "Topic not found")
      setTopic(topicData)

      const { data: materialsData, error: materialsError } = await supabase
        .from("study_materials")
        .select("*")
        .eq("topic_id", topicId)
        .order("created_at", { ascending: true })

      if (materialsError) throw new Error(materialsError.message)
      setStudyMaterials(materialsData || [])

    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching topic data:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, topicId])

  useEffect(() => {
    if (topicId && studentId) {
      fetchTopicData()
    }
  }, [topicId, studentId, fetchTopicData])

  const handleXPAward = async (eventType: XPEventType, materialId: string, score?: number) => {
    try {
      const { xpEarned, leveledUp } = await awardXP(eventType, materialId, studentId, topicId, score)

      if (xpEarned > 0) {
        setShowXPPopup({ show: true, xp: xpEarned })
        setTimeout(() => setShowXPPopup({ show: false, xp: 0 }), 3000)
      }
      if(leveledUp) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)
      }
    } catch (err) {
      console.error("Error awarding XP:", err)
      toast({
        title: "XP Award Failed",
        description: "Could not award XP for this action.",
        variant: "destructive",
      })
    }
  }

  const handleOpenMaterial = (materialId: string, contentType: string) => {
    refetchTabs()
  }

  const handleCompleteRevision = async (revisionId: string) => {
    const success = await dojoHandleCompleteRevision(revisionId);
    if (success) {
        toast({
            title: "Revision Complete!",
            description: "Great job! Keep up the momentum.",
        });
    } else {
        toast({
            title: "Error",
            description: "Could not complete revision. Please try again.",
            variant: "destructive",
        });
    }
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Card className="w-96 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle>Oops! Something went wrong.</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={fetchTopicData} className="mt-4">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p>Topic not found.</p>
      </div>
    )
  }

  const pageContent = (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Confetti trigger={showConfetti} />
      <XPPopup show={showXPPopup.show} xp={showXPPopup.xp} />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{topic.name}</CardTitle>
              <CardDescription className="mt-2">{topic.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <StudyMaterials
            materials={studyMaterials}
            studentId={studentId}
            topicId={topicId}
            onXPAward={handleXPAward}
            onOpenMaterial={handleOpenMaterial}
          />

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Study all available materials above. Click any "Open" button to earn XP!</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🏛️ Training Dojo</CardTitle>
            <CardDescription>Revision schedule - {dojoTabs.overdue.length + dojoTabs.today.length + dojoTabs.upcoming.length} total for this topic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dojoTabs.overdue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <h4 className="font-semibold text-sm">🔴 Overdue ({dojoTabs.overdue.length})</h4>
                </div>
                {dojoTabs.overdue.map((rev) => (
                  <Card key={rev.id} className="p-3 bg-red-50 border-red-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{rev.material_type.toUpperCase()} - Rev {rev.revision_number}</p>
                        <p className="text-xs text-muted-foreground">Due: {new Date(rev.due_date).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" onClick={() => handleCompleteRevision(rev.id)}>
                        <Check className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {dojoTabs.today.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <h4 className="font-semibold text-sm">🟠 Today ({dojoTabs.today.length})</h4>
                </div>
                {dojoTabs.today.map((rev) => (
                  <Card key={rev.id} className="p-3 bg-yellow-50 border-yellow-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{rev.material_type.toUpperCase()} - Rev {rev.revision_number}</p>
                        <p className="text-xs text-muted-foreground">Due today</p>
                      </div>
                      <Button size="sm" onClick={() => handleCompleteRevision(rev.id)}>
                        <Check className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {dojoTabs.upcoming.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <h4 className="font-semibold text-sm">🟢 Upcoming ({dojoTabs.upcoming.length})</h4>
                </div>
                {dojoTabs.upcoming.slice(0, 3).map((rev) => (
                  <Card key={rev.id} className="p-3 bg-green-50 border-green-200">
                    <div>
                      <p className="text-sm font-medium">{rev.material_type.toUpperCase()} - Rev {rev.revision_number}</p>
                      <p className="text-xs text-muted-foreground">Due: {new Date(rev.due_date).toLocaleDateString()}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {dojoTabs.overdue.length === 0 && dojoTabs.today.length === 0 && dojoTabs.upcoming.length === 0 && (
              <p className="text-muted-foreground text-center text-sm py-4">No revisions scheduled for this topic yet. Open materials to start!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  if (showSidebar) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 overflow-auto">
          {pageContent}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
        {pageContent}
    </div>
  )
}
