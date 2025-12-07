"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flame, TrendingUp, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"

interface StudentStats {
  currentLevel: number
  totalXP: number
  currentStreak: number
  averageAccuracy: number
  boardRank: number
}

interface TodayQuest {
  topicId: string
  topicName: string
  progress: number
  xpPotential: number
}

interface LeaderboardEntry {
  rank: number
  name: string
  xp: number
  avatar: string
}

export function StudentHomeDashboard({ studentId }: { studentId: string }) {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [todayQuests, setTodayQuests] = useState<TodayQuest[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient()

      try {
        // =============================
        // 1. Fetch Student Stats from level_system
        // =============================
        const { data: levelData, error: levelError } = await supabase
          .from("level_system")
          .select("total_xp, current_level")
          .eq("student_id", studentId)
          .single()

        if (levelError && levelError.code !== "PGRST116") {
          console.error("Level data error:", levelError)
        }

        let boardRank = 999
        let totalXP = 0
        let currentLevel = 1

        if (levelData) {
          totalXP = levelData.total_xp || 0
          currentLevel = levelData.current_level || 1
        }

        // Get rank from leaderboard (non-blocking)
        try {
          const { data: rankRow, error: rankError } = await supabase
            .from("leaderboard")
            .select("rank")
            .eq("student_id", studentId)
            .single()

          if (rankError) {
            console.warn("Rank query error:", {
              code: rankError.code,
              message: rankError.message,
            })
          }

          if (rankRow?.rank) {
            boardRank = rankRow.rank
          }
        } catch (rankErr) {
          console.warn("Exception getting rank:", rankErr)
          // Continue with default rank
        }

        setStats({
          currentLevel,
          totalXP,
          currentStreak: 0,
          averageAccuracy: 0,
          boardRank,
        })

        // =============================
        // 2. Today's Quests - Fetch recent topics
        // =============================
        try {
          const { data: topicProgressData, error: progressError } = await supabase
            .from("topic_progress")
            .select(`
              topic_id,
              progress_percentage,
              total_xp,
              topics(id, name)
            `)
            .eq("student_id", studentId)
            .order("progress_percentage", { ascending: false })
            .limit(3)

          if (progressError) {
            console.warn("Progress error:", progressError)
          }

          if (topicProgressData) {
            setTodayQuests(
              topicProgressData.map((tp: any) => ({
                topicId: tp.topic_id,
                topicName: tp.topics?.name || "Unknown Topic",
                progress: tp.progress_percentage || 0,
                xpPotential: tp.total_xp || 0,
              }))
            )
          }
        } catch (questErr) {
          console.warn("Exception fetching quests:", questErr)
        }

        // =============================
        // 3. LEADERBOARD - TOP 3 (Non-blocking)
        // =============================
        try {
          const { data: leaderboardData, error: leaderboardError } = await supabase
            .from("leaderboard")
            .select("rank, student_name, total_xp")
            .order("rank", { ascending: true })
            .limit(3)

          if (leaderboardError) {
            console.warn("Leaderboard query error:", {
              code: leaderboardError.code,
              message: leaderboardError.message,
            })
          }

          if (leaderboardData && leaderboardData.length > 0) {
            setLeaderboard(
              leaderboardData.map((entry: any) => ({
                rank: entry.rank,
                name: entry.student_name || "Unknown",
                xp: entry.total_xp ?? 0,
                avatar: "👤",
              }))
            )
          }
        } catch (lbErr) {
          console.warn("Exception fetching leaderboard:", lbErr)
          // Continue without leaderboard data
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [studentId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>
  }

  if (!stats) {
    return <div className="p-8 text-center text-muted-foreground">No profile data found</div>
  }

  const xpToNextLevel = (stats.currentLevel + 1) * 1000 - stats.totalXP
  const progressToNextLevel = Math.min((stats.totalXP % 1000) / 10, 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/5 to-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">Level Up Your UPSC Prep</h1>
              <p className="text-muted-foreground">Welcome back! {todayQuests.length} topics available today.</p>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-5xl font-bold text-primary">#{stats.boardRank}</span>
                <span className="text-xl font-semibold text-muted-foreground">on Leaderboard</span>
              </div>
              <div className="text-sm text-muted-foreground">Current Rank</div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Level {stats.currentLevel}</span>
              <span className="text-sm text-muted-foreground">{Math.max(0, xpToNextLevel)} XP to next level</span>
            </div>
            <Progress value={progressToNextLevel} className="h-3 bg-muted" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Today's Quests */}
          <Card className="border-2 border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Today's Topics
                </CardTitle>
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30">{todayQuests.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayQuests.length === 0 ? (
                <p className="text-muted-foreground text-sm">No topics available</p>
              ) : (
                todayQuests.map((quest) => (
                  <Link key={quest.topicId} href={`/student/subjects/${quest.topicId}`}>
                    <div className="p-3 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{quest.topicName}</span>
                        <Badge variant="outline" className="text-xs">
                          +{quest.xpPotential} XP
                        </Badge>
                      </div>
                      <Progress value={quest.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">{quest.progress}% Complete</div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Card 2: Your Stats */}
          <Card className="border-2 border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/40 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.currentLevel}</div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
                <div className="text-center p-3 bg-muted/40 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{stats.totalXP.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                </div>
                <div className="text-center p-3 bg-muted/40 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold text-warning">
                    <Flame className="w-4 h-4" />
                    {stats.currentStreak}
                  </div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Leaderboard Snapshot */}
          <Card className="border-2 border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-muted-foreground text-sm">Loading leaderboard...</p>
              ) : (
                leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center justify-between p-2 hover:bg-muted/40 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">#{entry.rank}</span>
                      <span className="text-xl">{entry.avatar}</span>
                      <span className="font-medium text-sm">{entry.name}</span>
                    </div>
                    <span className="font-bold text-accent">{entry.xp.toLocaleString()}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <Link href="/student/subjects" className="flex-1">
            <Button className="w-full" size="lg">
              📚 Browse Subjects
            </Button>
          </Link>
          <Link href="/student/training-dojo" className="flex-1">
            <Button className="w-full" size="lg" variant="outline">
              ⚔️ Training Dojo
            </Button>
          </Link>
          <Link href="/student/leaderboard" className="flex-1">
            <Button className="w-full" size="lg" variant="outline">
              🏆 Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
