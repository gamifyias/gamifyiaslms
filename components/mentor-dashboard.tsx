"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Users,
  BarChart3,
  Award,
  Bell,
  AlertTriangle,
  Trophy,
  X,
  Info,
} from "lucide-react"

type Priority = "high" | "medium" | "low"

interface Notification {
  id: string
  priority: Priority
  message: string
  link?: string
}

export function MentorDashboard({ mentorId }: { mentorId: string }) {
  const supabase = createClient()

  const [stats, setStats] = useState({
    totalStudents: 0,
    assignedStudents: 0,
    totalContentCreated: 0,
    averageRating: 0,
  })

  const [notifications, setNotifications] = useState<Notification[]>([])

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  useEffect(() => {
    const loadDashboard = async () => {
      const notifs: Notification[] = []

      /* ================= MENTOR PROFILE ================= */
      const { data: mentor } = await supabase
        .from("mentor_profiles")
        .select("specialization, years_of_experience, rating")
        .eq("id", mentorId)
        .single()

      if (!mentor?.specialization || !mentor?.years_of_experience) {
        notifs.push({
          id: "profile-incomplete",
          priority: "high",
          message:
            "Your mentor profile is incomplete. Complete it to unlock better student matching.",
          link: "/mentor/profile",
        })
      }

      /* ================= STUDENT ASSIGNMENTS ================= */
      const { data: assignments } = await supabase
        .from("student_mentor_assignments")
        .select("student_id")
        .eq("mentor_id", mentorId)
        .eq("is_active", true)

      const studentIds = assignments?.map(a => a.student_id) || []

      /* ================= LEADERBOARD CHECK ================= */
      const { data: levels } = await supabase
        .from("level_system")
        .select("student_id, total_xp, current_level")

      const leaderboard = (levels || []).sort((a, b) => {
        if (b.total_xp !== a.total_xp) return b.total_xp - a.total_xp
        return b.current_level - a.current_level
      })

      const top10 = leaderboard.slice(0, 10).map(l => l.student_id)

      if (studentIds.some(id => top10.includes(id))) {
        notifs.push({
          id: "student-top10",
          priority: "success" as any,
          message:
            "🎉 One of your students is in the Top 10 leaderboard!",
          link: "/mentor/leaderboard",
        })
      }

      /* ================= STUDENT INACTIVITY ================= */
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("student_id, start_time")

      const now = Date.now()

      const inactive = sessions?.some(s =>
        studentIds.includes(s.student_id) &&
        now - new Date(s.start_time).getTime() >
          7 * 24 * 60 * 60 * 1000
      )

      if (inactive) {
        notifs.push({
          id: "student-inactive",
          priority: "medium",
          message:
            "One or more students have been inactive for 7+ days.",
          link: "/mentor/command-center",
        })
      }

      /* ================= WEEKLY SUMMARY ================= */
      const lastSummary = localStorage.getItem("mentor_weekly_summary")
      const weekNow = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))

      if (lastSummary !== String(weekNow)) {
        localStorage.setItem("mentor_weekly_summary", String(weekNow))

        notifs.push({
          id: "weekly-summary",
          priority: "low",
          message:
            "📊 Weekly Summary: Review student progress, leaderboard movement, and content engagement.",
          link: "/mentor/command-center",
        })
      }

      /* ================= STATS ================= */
      const { count: totalStudents } = await supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("role", "student")

      const { count: contentCount } = await supabase
        .from("study_materials")
        .select("id", { count: "exact" })
        .eq("created_by", mentorId)

      setStats({
        totalStudents: totalStudents || 0,
        assignedStudents: studentIds.length,
        totalContentCreated: contentCount || 0,
        averageRating: mentor?.rating || 5,
      })

      setNotifications(notifs)
    }

    loadDashboard()
  }, [mentorId, supabase])

  const priorityStyles = {
    high: "bg-red-100 border-red-600",
    medium: "bg-yellow-100 border-yellow-600",
    low: "bg-blue-100 border-blue-600",
  }

  const priorityIcon = {
    high: <AlertTriangle className="w-4 h-4" />,
    medium: <Bell className="w-4 h-4" />,
    low: <Info className="w-4 h-4" />,
  }

  return (
    <div className="p-8 space-y-10 bg-[#F6E7C1] text-[#3B2A23] min-h-screen">

      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold">Mentor Dashboard</h2>
        <p className="text-sm">Your command center</p>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Students", value: stats.totalStudents },
          { icon: Users, label: "Assigned Students", value: stats.assignedStudents },
          { icon: Award, label: "Rating", value: `${stats.averageRating.toFixed(1)} ⭐` },
          { icon: BarChart3, label: "Content Created", value: stats.totalContentCreated },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <Card key={i} className="border-2 bg-[#F2DEB3]">
              <CardContent className="flex justify-between items-center p-6">
                <div>
                  <p className="text-sm">{s.label}</p>
                  <p className="text-3xl font-bold">{s.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-30" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ACTIONS + NOTIFICATIONS */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* QUICK ACTIONS (UNCHANGED) */}
        <Card className="border-2 bg-[#F2DEB3]">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/mentor/subjects"><button className="w-full border-2 bg-[#EAD39C] px-4 py-2 text-left">Create Study Content</button></a>
            <a href="/mentor/command-center"><button className="w-full border-2 bg-[#EAD39C] px-4 py-2 text-left">View Student Progress</button></a>
            <a href="/mentor/profile"><button className="w-full border-2 bg-[#EAD39C] px-4 py-2 text-left">Update Profile</button></a>
          </CardContent>
        </Card>

        {/* 🔔 NOTIFICATIONS */}
        <Card className="border-2 bg-[#F2DEB3]">
          <CardHeader className="flex flex-row items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Notifications</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {notifications.length === 0 && (
              <p className="text-sm">No alerts. Everything is stable.</p>
            )}

            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-md border flex justify-between items-start ${priorityStyles[n.priority]}`}
              >
                <div
                  className="flex gap-2 cursor-pointer"
                  onClick={() => n.link && (window.location.href = n.link)}
                >
                  {priorityIcon[n.priority]}
                  <p className="text-sm">{n.message}</p>
                </div>

                <button onClick={() => dismissNotification(n.id)}>
                  <X className="w-4 h-4 opacity-70 hover:opacity-100" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
