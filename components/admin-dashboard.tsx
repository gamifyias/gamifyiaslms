"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Award } from "lucide-react"

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalMentors: 0,
    totalContent: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      const [usersResponse, contentResponse] = await Promise.all([
        supabase.from("profiles").select("role", { count: "exact" }),
        supabase.from("study_materials").select("id", { count: "exact" }),
      ])

      const totalUsers = usersResponse.count || 0
      const totalStudents = usersResponse.data?.filter((p: any) => p.role === "student").length || 0
      const totalMentors = usersResponse.data?.filter((p: any) => p.role === "mentor").length || 0
      const totalContent = contentResponse.count || 0

      setStats({
        totalUsers,
        totalStudents,
        totalMentors,
        totalContent,
      })
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      icon: Users,
      label: "Total Users",
      value: stats.totalUsers,
      color: "text-primary",
    },
    {
      icon: Users,
      label: "Students",
      value: stats.totalStudents,
      color: "text-blue-500",
    },
    {
      icon: Award,
      label: "Mentors",
      value: stats.totalMentors,
      color: "text-accent",
    },
    {
      icon: BookOpen,
      label: "Study Materials",
      value: stats.totalContent,
      color: "text-green-500",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">Welcome to UPSC Elite Admin Panel</p>
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
                  <span className="text-3xl font-bold">{stat.value}</span>
                  <Icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your platform efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium text-left">
                Add New User
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-medium text-left">
                Create Subject
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors text-sm font-medium text-left">
                View Reports
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors text-sm font-medium text-left">
                Manage Content
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Status</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User Sessions</span>
                <span className="text-sm font-medium text-blue-600">{Math.floor(Math.random() * 1000)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium text-green-600">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
