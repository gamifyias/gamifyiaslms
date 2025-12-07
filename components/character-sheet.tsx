"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Zap, Target, Clock } from "lucide-react"

interface CharacterStats {
  level: number
  totalXP: number
  accuracyPercentage: number
  totalVideosWatched: number
  totalTestsTaken: number
  totalRevisionsCompleted: number
  currentStreak: number
  nextLevelXP: number
}

interface Activity {
  id: string
  activityType: string
  activityDescription: string
  xpEarned: number
  createdAt: string
}

export function CharacterSheet({ studentId }: { studentId: string }) {
  const [stats, setStats] = useState<CharacterStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      try {
        const { data: studentProfile, error: profileError } = await supabase
          .from("student_profiles")
          .select("current_level, total_points, overall_accuracy, current_streak")
          .eq("profile_id", studentId)
          .single()

        if (profileError) throw profileError

        const { data: activityFeed, error: activityError } = await supabase
          .from("student_activity_feed")
          .select("id, activity_type, activity_description, xp_earned, created_at")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(10)

        if (activityError) throw activityError

        const { data: topicProgress, error: topicError } = await supabase
          .from("topic_progress")
          .select(
            "video_completed, test_completed, revision_1_completed, revision_2_completed, revision_3_completed, revision_4_completed",
          )
          .eq("student_id", studentId)

        if (topicError) throw topicError

        let totalVideos = 0
        let totalTests = 0
        let totalRevisions = 0

        topicProgress?.forEach((tp: any) => {
          if (tp.video_completed) totalVideos++
          if (tp.test_completed) totalTests++
          if (tp.revision_1_completed) totalRevisions++
          if (tp.revision_2_completed) totalRevisions++
          if (tp.revision_3_completed) totalRevisions++
          if (tp.revision_4_completed) totalRevisions++
        })

        if (studentProfile) {
          const currentLevel = studentProfile.current_level || 1
          const totalXP = studentProfile.total_points || 0
          const nextLevelXP = (currentLevel + 1) * 1000

          setStats({
            level: currentLevel,
            totalXP: totalXP,
            accuracyPercentage: Math.round(studentProfile.overall_accuracy || 0),
            totalVideosWatched: totalVideos,
            totalTestsTaken: totalTests,
            totalRevisionsCompleted: totalRevisions,
            currentStreak: studentProfile.current_streak || 0,
            nextLevelXP: nextLevelXP,
          })
        }

        setActivities(
          activityFeed?.map((a: any) => ({
            id: a.id,
            activityType: a.activity_type,
            activityDescription: a.activity_description,
            xpEarned: a.xp_earned || 0,
            createdAt: a.created_at,
          })) || [],
        )
      } catch (error) {
        console.error("[v0] Error fetching character data:", error)
        setError("Failed to load character data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [studentId])

  if (loading) {
    return <div className="p-8 text-center">Loading character sheet...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>
  }

  if (!stats) {
    return <div className="p-8 text-center text-muted-foreground">No character data found</div>
  }

  const knowledgeProgress = (stats.totalVideosWatched / 50) * 100
  const battleSkillProgress = stats.accuracyPercentage
  const disciplineProgress = (stats.totalRevisionsCompleted / 200) * 100

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">🛡️ Your Character Sheet</h1>
              <p className="text-muted-foreground">
                Level {stats.level} | Total XP: {stats.totalXP} | Streak: {stats.currentStreak} days
              </p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards - 3 Columns */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Knowledge Card */}
          <Card className="border-2 border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Knowledge
              </CardTitle>
              <p className="text-sm text-muted-foreground">Videos Complete</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center items-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${(Math.min(knowledgeProgress, 100) / 100) * 339.3} 339.3`}
                        className="text-primary transition-all"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-primary">
                        {Math.min(Math.round(knowledgeProgress), 100)}%
                      </span>
                      <span className="text-xs text-muted-foreground">{stats.totalVideosWatched}/50</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {Math.max(0, 50 - stats.totalVideosWatched)} videos remaining
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Battle Skill Card */}
          <Card className="border-2 border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Battle Skill
              </CardTitle>
              <p className="text-sm text-muted-foreground">Test Accuracy</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center items-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${(battleSkillProgress / 100) * 339.3} 339.3`}
                        className="text-accent transition-all"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-accent">{stats.accuracyPercentage}%</span>
                      <span className="text-xs text-muted-foreground">Accuracy</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">Tests: {stats.totalTestsTaken}</p>
              </div>
            </CardContent>
          </Card>

          {/* Discipline Card */}
          <Card className="border-2 border-warning/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Discipline
              </CardTitle>
              <p className="text-sm text-muted-foreground">Revisions Complete</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center items-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${(Math.min(disciplineProgress, 100) / 100) * 339.3} 339.3`}
                        className="text-warning transition-all"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-warning">
                        {Math.min(Math.round(disciplineProgress), 100)}%
                      </span>
                      <span className="text-xs text-muted-foreground">{stats.totalRevisionsCompleted}/200</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {Math.max(0, 200 - stats.totalRevisionsCompleted)} revisions remaining
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
                  >
                    <div className="text-sm font-medium text-muted-foreground min-w-12">
                      {formatDate(activity.createdAt)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.activityDescription}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.activityType}</p>
                    </div>
                    <div className="font-bold text-primary">+{activity.xpEarned} XP</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
