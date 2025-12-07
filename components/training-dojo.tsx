"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface TrainingSession {
  id: string
  topicName: string
  revisionNumber: number
  dueDate: string
  daysOverdue: number
}

export function TrainingDojo({ studentId }: { studentId: string }) {
  const [activeTab, setActiveTab] = useState("overdue")
  const [overdueSessions, setOverdueSessions] = useState<TrainingSession[]>([])
  const [todaySessions, setTodaySessions] = useState<TrainingSession[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrainingSessions = async () => {
      const supabase = createClient()

      try {
        const { data: revisionData, error: revisionError } = await supabase
          .from("revision_schedule")
          .select(
            `
            id,
            topic_id,
            revision_number,
            due_date,
            is_overdue,
            is_completed,
            topics(name)
          `,
          )
          .eq("student_id", studentId)
          .eq("is_completed", false)
          .order("due_date", { ascending: true })

        if (revisionError) throw revisionError

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const overdue: TrainingSession[] = []
        const today_sessions: TrainingSession[] = []
        const upcoming: TrainingSession[] = []

        revisionData?.forEach((session: any) => {
          const dueDate = new Date(session.due_date)
          dueDate.setHours(0, 0, 0, 0)
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

          const trainingSession: TrainingSession = {
            id: session.id,
            topicName: session.topics?.name || "Unknown Topic",
            revisionNumber: session.revision_number,
            dueDate: session.due_date,
            daysOverdue: daysOverdue,
          }

          if (daysOverdue > 0) {
            overdue.push(trainingSession)
          } else if (daysOverdue === 0) {
            today_sessions.push(trainingSession)
          } else {
            upcoming.push(trainingSession)
          }
        })

        setOverdueSessions(overdue)
        setTodaySessions(today_sessions)
        setUpcomingSessions(upcoming)
      } catch (error) {
        console.error("[v0] Error fetching training sessions:", error)
        setError("Failed to load training sessions")
      } finally {
        setLoading(false)
      }
    }

    fetchTrainingSessions()
  }, [studentId])

  const renderSessions = (sessions: TrainingSession[], tabType: string) => {
    const getBgColor = () => {
      switch (tabType) {
        case "overdue":
          return "bg-destructive/10 border-destructive/30"
        case "today":
          return "bg-warning/10 border-warning/30"
        default:
          return "bg-success/10 border-success/30"
      }
    }

    const handleTrainNow = async (sessionId: string) => {
      const supabase = createClient()
      try {
        await supabase
          .from("revision_schedule")
          .update({
            is_completed: true,
            completed_date: new Date().toISOString().split("T")[0],
          })
          .eq("id", sessionId)

        // Refresh sessions
        window.location.reload()
      } catch (error) {
        console.error("[v0] Error completing training:", error)
      }
    }

    return (
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No sessions in this category</p>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className={`p-4 rounded-lg border ${getBgColor()} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{session.topicName}</h3>
                  <p className="text-sm text-muted-foreground">Revision {session.revisionNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tabType === "overdue" &&
                      `🔴 Due ${session.daysOverdue} day${session.daysOverdue > 1 ? "s" : ""} ago`}
                    {tabType === "today" && "🟠 Due Today"}
                    {tabType === "upcoming" && `⏳ Due ${new Date(session.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <Button className="ml-4" size="sm" onClick={() => handleTrainNow(session.id)}>
                  Train Now
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="p-8 text-center">Loading training sessions...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">⚔️ Training Dojo</h1>
              <p className="text-muted-foreground">Complete your revision sessions and earn XP</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-destructive">{overdueSessions.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Overdue</div>
            </div>
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-warning">{todaySessions.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Due Today</div>
            </div>
            <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-success">{upcomingSessions.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Upcoming</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Training Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overdue" className="flex items-center gap-2">
                  <span className="text-lg">🔴</span>
                  Overdue ({overdueSessions.length})
                </TabsTrigger>
                <TabsTrigger value="today" className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  Today ({todaySessions.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="flex items-center gap-2">
                  <span className="text-lg">⏳</span>
                  Upcoming ({upcomingSessions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overdue">{renderSessions(overdueSessions, "overdue")}</TabsContent>
              <TabsContent value="today">{renderSessions(todaySessions, "today")}</TabsContent>
              <TabsContent value="upcoming">{renderSessions(upcomingSessions, "upcoming")}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
