"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Flame,
  TrendingUp,
  BookOpen,
  Loader2,
  Bell,
  X,
} from "lucide-react"
import Link from "next/link"

type Priority = "high" | "medium" | "low"

interface Notification {
  id: string
  priority: Priority
  message: string
  link?: string
}

interface StudentStats {
  currentLevel: number
  totalXP: number
  boardRank: number
}

interface TodayQuest {
  topicId: string
  topicName: string
  progress: number
  xpPotential: number
}

interface LeaderboardRow {
  student_id: string
  name: string
  total_xp: number
  level: number
  rank: number
}

export function StudentHomeDashboard({ studentId }: { studentId: string }) {
  const supabase = createClient()

  const [stats, setStats] = useState<StudentStats | null>(null)
  const [todayQuests, setTodayQuests] = useState<TodayQuest[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const dismiss = (id: string) =>
    setNotifications((n) => n.filter((x) => x.id !== id))

  useEffect(() => {
    const load = async () => {
      const notifs: Notification[] = []

      /* ================= PROFILE ================= */
      const { data: profile } = await supabase
        .from("profiles")
        .select("bio, phone")
        .eq("id", studentId)
        .single()

      if (!profile?.bio || !profile?.phone) {
        notifs.push({
          id: "profile",
          priority: "high",
          message: "Complete your profile to unlock full analytics.",
          link: "/student/profile",
        })
      }

      /* ================= LEVEL SYSTEM ================= */
      const { data: myLevel } = await supabase
        .from("level_system")
        .select("total_xp, current_level")
        .eq("student_id", studentId)
        .single()

      const myXP = myLevel?.total_xp ?? 0
      const myLevelNo = myLevel?.current_level ?? 1

      /* ================= ALL STUDENTS ================= */
      const { data: students } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "student")

      const { data: levels } = await supabase
        .from("level_system")
        .select("student_id, total_xp, current_level")

      const merged: LeaderboardRow[] =
        students?.map((s) => {
          const lv = levels?.find((l) => l.student_id === s.id)
          return {
            student_id: s.id,
            name: s.full_name,
            total_xp: lv?.total_xp ?? 0,
            level: lv?.current_level ?? 1,
            rank: 0,
          }
        }) ?? []

      merged
        .sort(
          (a, b) =>
            b.total_xp - a.total_xp ||
            b.level - a.level
        )
        .forEach((s, i) => (s.rank = i + 1))

      setLeaderboard(merged)

      const myRank =
        merged.find((s) => s.student_id === studentId)?.rank ?? 999

      if (myRank <= 10) {
        notifs.push({
          id: "top10",
          priority: "low",
          message: "🏆 You are in Top 10!",
          link: "/student/leaderboard",
        })
      }

      /* ================= ACTIVITY ================= */
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("start_time")
        .eq("student_id", studentId)
        .order("start_time", { ascending: false })
        .limit(1)

      if (!sessions || sessions.length === 0) {
        notifs.push({
          id: "nostudy",
          priority: "medium",
          message: "You haven’t started studying yet.",
          link: "/student/subjects",
        })
      } else {
        const days =
          (Date.now() - new Date(sessions[0].start_time).getTime()) /
          (1000 * 60 * 60 * 24)

        if (days > 7)
          notifs.push({
            id: "inactive7",
            priority: "high",
            message: "Inactive for 7+ days. Streak lost!",
            link: "/student/training-dojo",
          })
        else if (days > 3)
          notifs.push({
            id: "inactive3",
            priority: "medium",
            message: "Inactive for 3+ days.",
            link: "/student/training-dojo",
          })
      }

      /* ================= TODAY QUESTS ================= */
      const { data: quests } = await supabase
        .from("topic_progress")
        .select("topic_id, progress_percentage, total_xp, topics(name)")
        .eq("student_id", studentId)
        .order("progress_percentage", { ascending: false })
        .limit(3)

      setTodayQuests(
        quests?.map((q: any) => ({
          topicId: q.topic_id,
          topicName: q.topics?.name ?? "Unknown",
          progress: q.progress_percentage ?? 0,
          xpPotential: q.total_xp ?? 0,
        })) ?? []
      )

      /* ================= WEEKLY SUMMARY ================= */
      const weekKey = `student_week_${studentId}`
      const week = Math.floor(Date.now() / (7 * 86400000))
      if (localStorage.getItem(weekKey) !== String(week)) {
        localStorage.setItem(weekKey, String(week))
        notifs.push({
          id: "weekly",
          priority: "low",
          message: "📊 Weekly summary available.",
        })
      }

      setStats({
        currentLevel: myLevelNo,
        totalXP: myXP,
        boardRank: myRank,
      })

      setNotifications(notifs)
      setLoading(false)
    }

    load()
  }, [studentId, supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!stats) return null

  const xpToNext = (stats.currentLevel + 1) * 1000 - stats.totalXP
  const progress = Math.min((stats.totalXP % 1000) / 10, 100)

  const style = {
    high: "bg-red-100 border-red-600",
    medium: "bg-yellow-100 border-yellow-600",
    low: "bg-blue-100 border-blue-600",
  }

  return (
    <div className="p-8 space-y-6 bg-[#F6E7C1] text-[#3B2A23] min-h-screen">



      {/* HEADER */}
      <div className="border-b border-[#8B5A2B] bg-[#F2DEB3] p-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-sm">Welcome back</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">#{stats.boardRank}</div>
            <div className="text-sm">Leaderboard Rank</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Level {stats.currentLevel}</span>
            <span>{Math.max(0, xpToNext)} XP to next level</span>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* TODAY QUESTS */}
        <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3]">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <BookOpen className="w-5 h-5" /> Today’s Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayQuests.length === 0 && <p>No topics today</p>}
            {todayQuests.map((q) => (
              <Link key={q.topicId} href={`/student/subjects/${q.topicId}`}>
                <div className="p-3 bg-[#EAD39C] border cursor-pointer">
                  <div className="flex justify-between mb-1">
                    <span>{q.topicName}</span>
                    <Badge>+{q.xpPotential} XP</Badge>
                  </div>
                  <Progress value={q.progress} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* STATS */}
        <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3]">
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.currentLevel}</div>
              <div className="text-xs">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalXP}</div>
              <div className="text-xs">XP</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center items-center gap-1 text-xl">
                <Flame className="w-4 h-4" /> 0
              </div>
              <div className="text-xs">Streak</div>
            </div>
          </CardContent>
        </Card>

        {/* LEADERBOARD */}
        <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3] md:col-span-2">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <TrendingUp className="w-5 h-5" /> Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard.slice(0, 5).map((e) => (
              <div key={e.rank} className="flex justify-between border p-2">
                <span>#{e.rank} {e.name}</span>
                <span>Level {e.level}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
                {/* 🔔 NOTIFICATIONS */}
      <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3]">
        <CardHeader className="flex flex-row gap-2 items-center">
          <Bell className="w-5 h-5" />
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 && (
            <p className="text-sm">No alerts. You’re doing great 🚀</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 border rounded-md flex justify-between ${style[n.priority]}`}
            >
              <span
                className="cursor-pointer"
                onClick={() => n.link && (window.location.href = n.link)}
              >
                {n.message}
              </span>
              <X className="w-4 h-4 cursor-pointer" onClick={() => dismiss(n.id)} />
            </div>
          ))}
        </CardContent>
      </Card>
      {/* FOOTER */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <Link href="/student/subjects" className="flex-1">
          <Button className="w-full">📚 Browse Subjects</Button>
        </Link>
        <Link href="/student/training-dojo" className="flex-1">
          <Button variant="outline" className="w-full">⚔️ Training Dojo</Button>
        </Link>
        <Link href="/student/leaderboard" className="flex-1">
          <Button variant="outline" className="w-full">🏆 Leaderboard</Button>
        </Link>
      </div>
    </div>
  )
}
