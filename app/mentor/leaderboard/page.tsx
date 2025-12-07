export const dynamic = "force-dynamic";

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Award } from "lucide-react"
import { MentorSidebar } from "@/components/mentor-sidebar"

interface LeaderboardEntry {
  rank: number
  student_id: string
  student_name: string
  total_xp: number
  level: number
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [mentorStudents, setMentorStudents] = useState<string[]>([])
  const [topMessage, setTopMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true)

        // 1. Load mentor ID
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) throw new Error("Mentor not logged in")

        const mentorId = user.id

        // 2. Load mentor's active students
        const { data: assignedStudents } = await supabase
          .from("student_mentor_assignments")
          .select("student_id")
          .eq("mentor_id", mentorId)
          .eq("is_active", true)

        const studentIds = assignedStudents?.map(s => s.student_id) ?? []
        setMentorStudents(studentIds)

        // 3. Load leaderboard data
        const { data, error: boardError } = await supabase
          .from("leaderboard")
          .select("rank, student_id, student_name, total_xp, level")
          .order("rank", { ascending: true })
          .limit(100)

        if (boardError) throw new Error(boardError.message)

        setEntries(data || [])

        // 4. Check if mentor’s student is top 3
        const topThree = data?.slice(0, 3) ?? []

        const topStudent = topThree.find(e =>
          studentIds.includes(e.student_id)
        )

        if (topStudent) {
          setTopMessage(
            `🎉 Your student "${topStudent.student_name}" is in the Top ${topStudent.rank}!`
          )
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load leaderboard"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <MentorSidebar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <MentorSidebar />

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">

          {/* PAGE HEADER */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2">Top performers in UPSC Prep</p>
          </div>

          {/* TOP ALERT FOR MENTOR */}
          {topMessage && (
            <div className="mb-6">
              <Card className="border-green-600 bg-green-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Award className="w-6 h-6 text-green-700" />
                  <p className="text-green-800 font-medium">{topMessage}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <Card className="border-destructive mb-6">
              <CardContent className="p-6">
                <p className="text-destructive">Error: {error}</p>
              </CardContent>
            </Card>
          )}

          {/* LEADERBOARD */}
          <Card>
            <CardHeader>
              <CardTitle>Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {entries.map((entry) => {
                  const isMentorStudent = mentorStudents.includes(entry.student_id)

                  return (
                    <div
                      key={entry.rank}
                      className={`
                        flex items-center justify-between p-4 rounded-lg border transition-colors 
                        ${isMentorStudent ? "bg-green-100 border-green-400" : "hover:bg-muted/50"}
                      `}
                    >
                      {/* LEFT SIDE */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center">
                          {entry.rank === 1 && <span className="text-2xl">🥇</span>}
                          {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                          {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                          {entry.rank > 3 && (
                            <span className="text-lg font-bold text-muted-foreground">
                              #{entry.rank}
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {entry.student_name}

                            {isMentorStudent && (
                              <Badge variant="default" className="bg-green-600 text-white">
                                Your Student
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                        </div>
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="text-right">
                        <p className="font-bold text-lg">{entry.total_xp.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
