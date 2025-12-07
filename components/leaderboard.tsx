"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  student_id: string
  student_name: string
  total_xp: number
  current_streak: number
  overall_accuracy: number
  dojo: string
  isCurrentUser?: boolean
}

export function Leaderboard({ studentId }: { studentId: string }) {
  const [topThree, setTopThree] = useState<LeaderboardEntry[]>([])
  const [fullLeaderboard, setFullLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserRank, setCurrentUserRank] = useState<number>(0)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const supabase = createClient()

      try {
        // Load cached leaderboard table (VERY FAST)
        const { data, error: leaderboardError } = await supabase
          .from("leaderboard")
          .select("*")
          .order("rank", { ascending: true })

        if (leaderboardError) throw leaderboardError

        if (data) {
          const formatted = data.map((entry: any) => {
            const isCurrentUser = entry.student_id === studentId
            if (isCurrentUser) setCurrentUserRank(entry.rank)

            return {
              rank: entry.rank,
              student_id: entry.student_id,
              student_name: entry.student_name,
              total_xp: entry.total_xp,
              current_streak: entry.current_streak,
              overall_accuracy: entry.overall_accuracy,
              dojo: entry.dojo,
              isCurrentUser,
            }
          })

          setTopThree(formatted.slice(0, 3))
          setFullLeaderboard(formatted)
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err)
        setError("Failed to load leaderboard")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [studentId])

  if (loading) {
    return <div className="p-8 text-center">Loading leaderboard...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>
  }

  const medalIcons = ["👑", "🥈", "🥉"]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">🏆 Hall of Heroes</h1>
              <p className="text-muted-foreground">
                Your rank: #{currentUserRank} of {fullLeaderboard.length}
              </p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Top 3 Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {topThree.map((entry, i) => (
            <Card
              key={entry.rank}
              className={`relative border-2 hover:shadow-lg transition-shadow ${
                entry.rank === 1
                  ? "border-primary/40 bg-gradient-to-br from-primary/10 to-transparent"
                  : entry.rank === 2
                    ? "border-accent/40 bg-gradient-to-br from-accent/10 to-transparent"
                    : "border-yellow-500/40 bg-gradient-to-br from-yellow-200/10 to-transparent"
              }`}
            >
              <CardContent className="pt-8 text-center">
                <div className="text-6xl mb-2">{medalIcons[i]}</div>
                <div className="text-3xl font-bold mb-2">#{entry.rank}</div>
                <h3 className="text-2xl font-bold mb-1">{entry.student_name}</h3>

                <p className="text-sm text-muted-foreground mb-4">{entry.dojo} Dojo</p>

                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Streak</span>
                    <span className="font-bold text-lg">{entry.current_streak}🔥</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">XP</span>
                    <span className="font-bold text-lg text-primary">{entry.total_xp}</span>
                  </div>
                </div>

                {entry.isCurrentUser && (
                  <Badge className="mt-4 bg-accent text-accent-foreground animate-pulse">YOU</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Full Leaderboard ({fullLeaderboard.length} students)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">#</th>
                    <th className="text-left py-3 px-4 font-semibold">Badge</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-center py-3 px-4 font-semibold">Dojo</th>
                    <th className="text-right py-3 px-4 font-semibold">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {fullLeaderboard.map((entry, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-border hover:bg-muted/30 transition-colors ${
                        entry.isCurrentUser ? "bg-primary/5 font-semibold" : ""
                      }`}
                    >
                      <td className="py-4 px-4 font-bold text-primary">{entry.rank}</td>
                      <td className="py-4 px-4 text-xl">
                        {entry.rank <= 3 ? medalIcons[entry.rank - 1] : "⭐"}
                      </td>
                      <td className="py-4 px-4 font-medium">{entry.student_name}</td>
                      <td className="py-4 px-4 text-center">{entry.dojo}</td>
                      <td className="py-4 px-4 text-right font-bold text-primary">
                        {entry.total_xp}
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
