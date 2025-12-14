"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MentorSidebar } from "@/components/mentor-sidebar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Award, Zap } from "lucide-react"

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

        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) throw new Error("Mentor not logged in")

        const mentorId = user.id

        const { data: assignedStudents } = await supabase
          .from("student_mentor_assignments")
          .select("student_id")
          .eq("mentor_id", mentorId)
          .eq("is_active", true)

        const studentIds = assignedStudents?.map(s => s.student_id) ?? []
        setMentorStudents(studentIds)

        const { data, error: boardError } = await supabase
          .from("leaderboard")
          .select("rank, student_id, student_name, total_xp, level")
          .order("rank", { ascending: true })
          .limit(100)

        if (boardError) throw new Error(boardError.message)

        setEntries(data || [])

        const topThree = data?.slice(0, 3) ?? []
        const topStudent = topThree.find(e => studentIds.includes(e.student_id))

        if (topStudent) {
          setTopMessage(
            `🏆 Your student "${topStudent.student_name}" is ranked #${topStudent.rank}!`
          )
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard")
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F6E7C1]">
        <MentorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23]">
      <MentorSidebar />

      <div className="flex-1 overflow-auto p-8 space-y-8 animate-in fade-in duration-300">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-700" />
              Leaderboard
            </h1>
            <p className="text-sm opacity-80">
              Competitive rankings across all UPSC aspirants
            </p>
          </div>
        </div>

        {/* MENTOR HIGHLIGHT */}
        {topMessage && (
          <Card className="border-2 border-yellow-600 bg-[#FFF2C2] shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <Award className="w-6 h-6 text-yellow-700" />
              <p className="font-semibold">{topMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* ERROR */}
        {error && (
          <Card className="border-red-600 bg-red-50">
            <CardContent className="p-4 text-red-700">
              Error: {error}
            </CardContent>
          </Card>
        )}

        {/* TOP 3 PODIUM */}
        <div className="grid md:grid-cols-3 gap-4">
          {entries.slice(0, 3).map((e) => (
            <Card
              key={e.rank}
              className={`
                border-2 text-center
                ${e.rank === 1 ? "border-yellow-600 bg-[#FFF4CC]" : ""}
                ${e.rank === 2 ? "border-gray-400 bg-[#F3F3F3]" : ""}
                ${e.rank === 3 ? "border-orange-500 bg-[#FFE0C2]" : ""}
              `}
            >
              <CardHeader>
                <div className="text-3xl">
                  {e.rank === 1 && "🥇"}
                  {e.rank === 2 && "🥈"}
                  {e.rank === 3 && "🥉"}
                </div>
                <CardTitle>{e.student_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Level {e.level}</p>
                <p className="text-xl font-bold mt-2 flex items-center justify-center gap-1">
                  <Zap className="w-4 h-4" />
                  {e.total_xp.toLocaleString()} XP
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FULL RANK LIST */}
        <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3]">
          <CardHeader>
            <CardTitle>All Rankings</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {entries.map((entry) => {
              const isMentorStudent = mentorStudents.includes(entry.student_id)

              return (
                <div
                  key={entry.rank}
                  className={`
                    flex items-center justify-between p-4 rounded-md border
                    transition-all duration-200
                    ${isMentorStudent
                      ? "bg-green-100 border-green-600 animate-pulse"
                      : "bg-[#F6E7C1] hover:bg-[#EAD39C]"}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-bold w-8 text-center">
                      #{entry.rank}
                    </span>

                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        {entry.student_name}
                        {isMentorStudent && (
                          <Badge className="bg-green-600 text-white">
                            Your Student
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs opacity-80">
                        Level {entry.level}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      {entry.total_xp.toLocaleString()}
                    </p>
                    <p className="text-xs opacity-80">XP</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
