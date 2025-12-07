"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, TrendingUp, Users, BarChart3, AlertCircle } from "lucide-react"

interface StudentMetrics {
  totalStudents: number
  averageXP: number
  completionPercentage: number
  topPerformers: Array<{ name: string; xp: number }>
  strugglingSidents: Array<{ name: string; xp: number }>
  overdueTrainings: number
  subjectProgress: Record<string, number>
}

export function CommandCenter({ mentorId }: { mentorId: string }) {
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      const supabase = createClient()

      try {
        // Get student profiles
        const { data: studentProfiles } = await supabase
          .from("student_profiles")
          .select("profile_id, total_points, current_level")
          .order("total_points", { ascending: false })

        if (studentProfiles) {
          const allXP = studentProfiles.map((s) => s.total_points || 0)
          const avgXP = Math.round(allXP.reduce((a, b) => a + b, 0) / allXP.length)

          setMetrics({
            totalStudents: studentProfiles.length,
            averageXP: avgXP,
            completionPercentage: 12,
            topPerformers: studentProfiles.slice(0, 2).map((s, idx) => ({
              name: idx === 0 ? "Rahul" : "Priya",
              xp: s.total_points || 0,
            })),
            strugglingSidents: studentProfiles.slice(-3).map((s, idx) => ({
              name: `Student ${idx + 1}`,
              xp: s.total_points || 0,
            })),
            overdueTrainings: 8,
            subjectProgress: {
              Polity: 25,
              History: 8,
              Geography: 3,
              Economics: 1,
            },
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching mentor metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [mentorId])

  if (loading || !metrics) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">🎮 Command Center</h1>
            <p className="text-muted-foreground">Mentor Admin Dashboard | {metrics.totalStudents} Students Active</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 4 Widget Cards - 2x2 Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Class Overview */}
          <Card className="border-2 border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Class Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/40 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{metrics.totalStudents}</div>
                  <div className="text-xs text-muted-foreground">Total Students</div>
                </div>
                <div className="text-center p-3 bg-muted/40 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{metrics.averageXP}</div>
                  <div className="text-xs text-muted-foreground">Avg XP</div>
                </div>
                <div className="text-center p-3 bg-muted/40 rounded-lg">
                  <div className="text-2xl font-bold text-warning">{metrics.completionPercentage}%</div>
                  <div className="text-xs text-muted-foreground">Completion</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Top Performers */}
          <Card className="border-2 border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.topPerformers.map((performer, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-muted/40 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{idx === 0 ? "👑" : "⭐"}</span>
                    <span className="font-medium">{performer.name}</span>
                  </div>
                  <span className="font-bold text-primary">{performer.xp} pts</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Card 3: Needs Attention */}
          <Card className="border-2 border-warning/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-sm font-medium">3 students with {`<`} 500 XP</p>
              </div>
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm font-medium">{metrics.overdueTrainings} overdue trainings</p>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Subject Progress */}
          <Card className="border-2 border-info/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-info" />
                Subject Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(metrics.subjectProgress).map(([subject, progress]) => (
                <div key={subject} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{subject}</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Urgent Nudges Section */}
        <Card className="mb-8 border-2 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Urgent Nudges Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-destructive/10 border-destructive/30">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                3 students have 3+ overdue trainings. Consider sending gentle nudges.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="p-4 bg-muted/40 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Arjun</span>
                  <Badge className="bg-destructive/20 text-destructive">5 overdue</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Haven't studied in 7 days. Test average: 8/20</p>
                <Button size="sm" className="w-full">
                  Send WhatsApp Nudge
                </Button>
              </div>

              <div className="p-4 bg-muted/40 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">StudentX</span>
                  <Badge className="bg-warning/20 text-warning">3 overdue</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Inconsistent progress. Focus on fundamentals.</p>
                <Button size="sm" className="w-full bg-transparent" variant="outline">
                  Schedule Check-in
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-center py-3 px-4 font-semibold">Level</th>
                    <th className="text-right py-3 px-4 font-semibold">XP</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-center py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 font-bold text-primary">#{idx}</td>
                      <td className="py-4 px-4 font-medium">Student {idx}</td>
                      <td className="py-4 px-4 text-center">{7 - idx}</td>
                      <td className="py-4 px-4 text-right font-bold">{1650 - idx * 200}</td>
                      <td className="py-4 px-4 text-center">
                        {idx <= 2 ? (
                          <Badge className="bg-status-good/20 text-status-good">On Track</Badge>
                        ) : (
                          <Badge className="bg-warning/20 text-warning">Needs Help</Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
