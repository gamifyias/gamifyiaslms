"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

      // 1️⃣ Total students
      const { count: totalStudentCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("role", "student")

      // 2️⃣ Assigned students
      const { count: assignedCount } = await supabase
        .from("student_mentor_assignments")
        .select("student_id", { count: "exact" })
        .eq("mentor_id", mentorId)
        .eq("is_active", true)

      // 3️⃣ Mentor rating
      const { data: mentorProfile } = await supabase
        .from("mentor_profiles")
        .select("rating")
        .eq("id", mentorId)
        .single()

      // 4️⃣ Content created
      const { count: contentCount } = await supabase
        .from("study_materials")
        .select("id", { count: "exact" })
        .eq("created_by", mentorId)

      setStats({
        totalStudents: totalStudentCount || 0,
        assignedStudents: assignedCount || 0,
        totalContentCreated: contentCount || 0,
        averageRating: mentorProfile?.rating || 5,
      })

      // 5️⃣ Recent activity
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
    },
    {
      icon: Users,
      label: "Assigned Students",
      value: stats.assignedStudents,
    },
    {
      icon: Award,
      label: "Average Rating",
      value: `${stats.averageRating.toFixed(1)} ⭐`,
    },
    {
      icon: BarChart3,
      label: "Content Created",
      value: stats.totalContentCreated,
    },
  ]

  return (
    <div className="p-8 space-y-10 bg-[#F6E7C1] text-[#3B2A23] min-h-screen">
      {/* HEADER */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">
          Mentor Dashboard
        </h2>
        <p className="text-sm">
          Overview of your mentoring activity
        </p>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card
              key={idx}
              className="border-2 border-[#8B5A2B] bg-[#F2DEB3]"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">
                    {stat.value}
                  </span>
                  <Icon className="w-8 h-8 opacity-30" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ACTIONS & ACTIVITY */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* QUICK ACTIONS */}
        <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3]">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/mentor/subjects">
              <button className="w-full border-2 border-[#3B2A23] bg-[#EAD39C] px-4 py-2 text-left">
                Create Study Content
              </button>
            </a>
            <a href="/mentor/command-center">
              <button className="w-full border-2 border-[#3B2A23] bg-[#EAD39C] px-4 py-2 text-left">
                View Student Progress
              </button>
            </a>
            <a
              href="https://contactgamifyias.web.app/contact-admin.html"
              target="_blank"
            >
              <button className="w-full border-2 border-[#3B2A23] bg-[#EAD39C] px-4 py-2 text-left">
                Send Feedback
              </button>
            </a>
            <a href="/mentor/profile">
              <button className="w-full border-2 border-[#3B2A23] bg-[#EAD39C] px-4 py-2 text-left">
                Update Profile
              </button>
            </a>
          </CardContent>
        </Card>

        {/* RECENT ACTIVITY */}
        <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3]">
          <CardHeader>
            <CardTitle>Recent Student Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm">
                No recent activity found.
              </p>
            ) : (
              recentActivities.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 border-b border-[#8B5A2B] pb-2 last:border-0"
                >
                  <Clock className="w-4 h-4 mt-1 opacity-70" />
                  <div>
                    <p className="text-sm font-medium">
                      Study Session
                    </p>
                    <p className="text-xs">
                      {activity.duration_minutes} min •{" "}
                      {activity.questions_answered} questions
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
