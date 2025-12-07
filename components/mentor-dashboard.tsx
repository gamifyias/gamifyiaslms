"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BarChart3, Award, Clock } from "lucide-react"

interface MentorStats {
  totalStudents: number
  assignedStudents: number
  totalContentCreated: number
  averageRating: number
}

export function MentorDashboard({ mentorId }: { mentorId: string }) {
  const [stats, setStats] = useState<MentorStats>({
    totalStudents: 0,
    assignedStudents: 0,
    totalContentCreated: 0,
    averageRating: 0,
  })

  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    const fetchMentorStats = async () => {
      const supabase = createClient()

      // ---------------------- 1️⃣ TOTAL STUDENTS COUNT -----------------------
// TOTAL STUDENT COUNT (WORKS 100%)
    const { count: totalStudentCount, error: totalErr } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("role", "student")

    if (totalErr) console.error("Total student count error:", totalErr)


      // ---------------------- 2️⃣ ASSIGNED STUDENTS COUNT -----------------------
      const { count: assignedCount } = await supabase
        .from("student_mentor_assignments")
        .select("student_id", { count: "exact" })
        .eq("mentor_id", mentorId)
        .eq("is_active", true)

      // ---------------------- 3️⃣ MENTOR RATING -----------------------
      const { data: mentorProfile } = await supabase
        .from("mentor_profiles")
        .select("rating")
        .eq("id", mentorId)
        .single()

      // ---------------------- 4️⃣ CONTENT CREATED COUNT -----------------------
      const { count: contentCount } = await supabase
        .from("study_materials")
        .select("id", { count: "exact" })
        .eq("created_by", mentorId)

      // SET FINAL STATS
      setStats({
        totalStudents: totalStudentCount || 0,
        assignedStudents: assignedCount || 0,
        totalContentCreated: contentCount || 0,
        averageRating: mentorProfile?.rating || 5,
      })

      // ---------------------- 5️⃣ LAST 5 STUDY ACTIVITIES -----------------------
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(5)

      setRecentActivities(sessions || [])
    }

    fetchMentorStats()
  }, [mentorId])

  const statCards = [
    {
      icon: Users,
      label: "Total Students",
      value: stats.totalStudents,
      color: "text-primary",
    },
    {
      icon: Users,
      label: "Assigned Students",
      value: stats.assignedStudents,
      color: "text-blue-500",
    },
    {
      icon: Award,
      label: "Rating",
      value: stats.averageRating.toFixed(1),
      color: "text-accent",
      suffix: "⭐",
    },
    {
      icon: BarChart3,
      label: "Content Created",
      value: stats.totalContentCreated,
      color: "text-green-500",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome Back!</h2>
        <p className="text-muted-foreground mt-2">Here's your mentoring dashboard overview</p>
      </div>

      {/* Stats Cards */}
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
                    {stat.suffix && <span className="ml-1">{stat.suffix}</span>}
                  </span>
                  <Icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your mentoring activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium text-left">
                Create New Content
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium text-left">
                View Student Progress
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-sm font-medium text-left">
                Send Feedback
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm font-medium text-left">
                Update Profile
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Student Activity</CardTitle>
            <CardDescription>Latest study sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activities</p>
              ) : (
                recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-2 border-b border-border last:border-0">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Study Session</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.duration_minutes} min • {activity.questions_answered} questions
                      </p>
                    </div>
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
