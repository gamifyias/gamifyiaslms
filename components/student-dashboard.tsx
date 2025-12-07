"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Trophy, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"

interface StudentStats {
  totalPoints: number
  currentLevel: number
  totalHoursStudied: number
  currentStreak: number
  overallAccuracy: number
  badgesEarned: number
}

export function StudentDashboard({ studentId }: { studentId: string }) {
  const [stats, setStats] = useState<StudentStats>({
    totalPoints: 0,
    currentLevel: 1,
    totalHoursStudied: 0,
    currentStreak: 0,
    overallAccuracy: 0,
    badgesEarned: 0,
  })

  const [recentBadges, setRecentBadges] = useState<any[]>([])
  const [nextMilestone, setNextMilestone] = useState(0)

  useEffect(() => {
    const fetchStudentStats = async () => {
      const supabase = createClient()

      // Fetch student profile
      const { data: studentData } = await supabase
        .from("student_profiles")
        .select("total_points, current_level, total_hours_studied, current_streak, overall_accuracy")
        .eq("id", studentId)
        .single()

      // Fetch badges
      const { data: badgesData, count: badgesCount } = await supabase
        .from("student_badges")
        .select("badge_id", { count: "exact" })
        .eq("student_id", studentId)

      setStats({
        totalPoints: studentData?.total_points || 0,
        currentLevel: studentData?.current_level || 1,
        totalHoursStudied: studentData?.total_hours_studied || 0,
        currentStreak: studentData?.current_streak || 0,
        overallAccuracy: studentData?.overall_accuracy || 0,
        badgesEarned: badgesCount || 0,
      })

      setNextMilestone((studentData?.total_points || 0) + 1000)

      // Fetch recent badges
      const { data: recentBadgesData } = await supabase
        .from("student_badges")
        .select("*, badges(*)")
        .eq("student_id", studentId)
        .order("earned_at", { ascending: false })
        .limit(3)

      setRecentBadges(recentBadgesData || [])
    }

    fetchStudentStats()
  }, [studentId])

  const statCards = [
    {
      icon: Zap,
      label: "Total Points",
      value: stats.totalPoints,
      color: "text-accent",
      suffix: "XP",
    },
    {
      icon: Trophy,
      label: "Current Level",
      value: stats.currentLevel,
      color: "text-primary",
      suffix: "",
    },
    {
      icon: Clock,
      label: "Hours Studied",
      value: stats.totalHoursStudied,
      color: "text-blue-500",
      suffix: "h",
    },
    {
      icon: TrendingUp,
      label: "Current Streak",
      value: stats.currentStreak,
      color: "text-green-500",
      suffix: "days",
    },
  ]

  const progressToNextLevel = ((stats.totalPoints % 1000) / 1000) * 100

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Your Learning Journey</h2>
        <p className="text-muted-foreground mt-2">Track your UPSC preparation progress and achievements</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">
                    {stat.value}
                    <span className="text-lg text-muted-foreground ml-1">{stat.suffix}</span>
                  </span>
                  <Icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Progress to Next Level</CardTitle>
          <CardDescription>
            {stats.totalPoints} / {nextMilestone} XP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${Math.min(progressToNextLevel, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round(100 - progressToNextLevel)}% remaining to reach Level {stats.currentLevel + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Continue your learning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/student/tests" className="block">
              <Button className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20">
                Start Practice Test
              </Button>
            </Link>
            <Link href="/student/materials" className="block">
              <Button className="w-full justify-start bg-accent/10 text-accent hover:bg-accent/20" variant="ghost">
                Browse Study Materials
              </Button>
            </Link>
            <Link href="/student/mentors" className="block">
              <Button
                className="w-full justify-start bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                variant="ghost"
              >
                Connect with Mentor
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>Total badges: {stats.badgesEarned}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBadges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No badges earned yet. Keep practicing!</p>
              ) : (
                recentBadges.map((badge, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-2 border-b border-border last:border-0">
                    <div className="text-2xl">
                      {badge.badges?.category === "streak" && "🔥"}
                      {badge.badges?.category === "accuracy" && "🎯"}
                      {badge.badges?.category === "speed" && "⚡"}
                      {badge.badges?.category === "achievement" && "🏆"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{badge.badges?.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(badge.earned_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-4xl font-bold text-primary">{stats.overallAccuracy.toFixed(1)}%</div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(stats.overallAccuracy, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Keep improving your accuracy!</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Study Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-4xl font-bold text-accent">{stats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">
                Day streak of daily study sessions. Great consistency!
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < Math.min(stats.currentStreak, 7) ? "bg-accent" : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Accuracy Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-4xl font-bold text-green-500">85%</div>
              <div className="text-sm text-muted-foreground">Your target accuracy for UPSC preparation</div>
              <div className="text-xs text-accent font-medium">
                {(85 - stats.overallAccuracy).toFixed(1)}% more to reach target
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
