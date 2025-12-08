"use client";
export const dynamic = "force-dynamic";



import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy } from "lucide-react"
import { StudentSidebar } from "@/components/student-sidebar"

interface LeaderboardEntry {
  rank: number
  student_name: string
  total_xp: number
  current_level: number
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from("leaderboard")
          .select("rank, student_name, total_xp, level")
          .order("rank", { ascending: true })
          .limit(100)

        if (fetchError) throw new Error(fetchError.message)
        setEntries(data || [])
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load leaderboard"
        setError(msg)
        console.error("Error fetching leaderboard:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <StudentSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2">Top performers in UPSC Prep</p>
          </div>

          {error && (
            <Card className="border-destructive mb-6">
              <CardContent className="p-6">
                <p className="text-destructive">Error: {error}</p>
              </CardContent>
            </Card>
          )}

          {entries.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No leaderboard data available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center">
                          {entry.rank === 1 && <span className="text-2xl">🥇</span>}
                          {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                          {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                          {entry.rank > 3 && (
                            <span className="text-lg font-bold text-muted-foreground">#{entry.rank}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{entry.student_name}</p>
                          <p className="text-xs text-muted-foreground">Level {entry.current_level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{(entry.total_xp ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
