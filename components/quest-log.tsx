"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

interface QuestRow {
  topicId: string
  topicName: string
  videoXP: number
  videoCompleted: boolean
  testScore: number | null
  testCompleted: boolean
  rev1: boolean
  rev2: boolean
  rev3: boolean
  rev4: boolean
  totalXP: number
  status: "MASTERED" | "GOOD" | "NEEDS_WORK"
  progress: number
  isOverdue: boolean
}

const statusColors = {
  MASTERED: "bg-status-mastered/20 text-status-mastered",
  GOOD: "bg-status-good/20 text-status-good",
  NEEDS_WORK: "bg-status-needs-work/20 text-status-needs-work",
}

export function QuestLog({ studentId }: { studentId: string }) {
  const [quests, setQuests] = useState<QuestRow[]>([])
  const [filteredQuests, setFilteredQuests] = useState<QuestRow[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuests = async () => {
      const supabase = createClient()

      try {
        const { data: topicProgressData, error: progressError } = await supabase
          .from("topic_progress")
          .select(
            `
            id,
            topic_id,
            progress_percentage,
            video_completed,
            video_xp,
            test_completed,
            test_score,
            test_xp,
            revision_1_completed,
            revision_2_completed,
            revision_3_completed,
            revision_4_completed,
            total_xp,
            status,
            topics(name)
          `,
          )
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })

        if (progressError) throw progressError

        const { data: revisionData, error: revisionError } = await supabase
          .from("revision_schedule")
          .select("topic_id, is_overdue, is_completed")
          .eq("student_id", studentId)

        if (revisionError) throw revisionError

        const revisionMap = new Map()
        revisionData?.forEach((r: any) => {
          revisionMap.set(r.topic_id, r.is_overdue)
        })

        if (topicProgressData) {
          const questData = topicProgressData.map((tp: any) => ({
            topicId: tp.topic_id,
            topicName: tp.topics?.name || "Unknown Topic",
            videoXP: tp.video_xp || 40,
            videoCompleted: tp.video_completed || false,
            testScore: tp.test_score ? Math.round(tp.test_score) : null,
            testCompleted: tp.test_completed || false,
            rev1: tp.revision_1_completed || false,
            rev2: tp.revision_2_completed || false,
            rev3: tp.revision_3_completed || false,
            rev4: tp.revision_4_completed || false,
            totalXP: tp.total_xp || 0,
            status: tp.status || "NEEDS_WORK",
            progress: tp.progress_percentage || 0,
            isOverdue: revisionMap.get(tp.topic_id) || false,
          }))

          setQuests(questData)
          setFilteredQuests(questData)
        }
      } catch (error) {
        console.error("[v0] Error fetching quests:", error)
        setError("Failed to load quests")
      } finally {
        setLoading(false)
      }
    }

    fetchQuests()
  }, [studentId])

  useEffect(() => {
    const filtered = quests.filter((q) => q.topicName.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredQuests(filtered)
  }, [searchTerm, quests])

  if (loading) {
    return <div className="p-8 text-center">Loading quests...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">📜 Quest Log</h1>
              <p className="text-muted-foreground">Track your {quests.length} study topics</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search quests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Quest Table */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Quest Name</th>
                    <th className="text-center py-3 px-4 font-semibold">Video</th>
                    <th className="text-center py-3 px-4 font-semibold">Test Score</th>
                    <th className="text-center py-3 px-4 font-semibold">Rev1</th>
                    <th className="text-center py-3 px-4 font-semibold">Rev2</th>
                    <th className="text-center py-3 px-4 font-semibold">Rev3</th>
                    <th className="text-center py-3 px-4 font-semibold">Rev4</th>
                    <th className="text-center py-3 px-4 font-semibold">XP</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuests.map((quest) => (
                    <tr key={quest.topicId} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 font-medium">{quest.topicName}</td>
                      <td className="py-4 px-4 text-center">
                        {quest.videoCompleted ? (
                          <Badge className="bg-status-mastered/20 text-status-mastered">✓ {quest.videoXP}</Badge>
                        ) : (
                          <Badge variant="outline">☐</Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {quest.testCompleted ? (
                          <Badge className="bg-primary/20 text-primary">{quest.testScore}/20</Badge>
                        ) : (
                          <Badge variant="outline">-</Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">{quest.rev1 ? "✓" : "☐"}</td>
                      <td className="py-4 px-4 text-center">{quest.rev2 ? "✓" : "☐"}</td>
                      <td className="py-4 px-4 text-center">{quest.rev3 ? "✓" : "☐"}</td>
                      <td className="py-4 px-4 text-center">{quest.rev4 ? "✓" : "☐"}</td>
                      <td className="py-4 px-4 text-center font-bold text-primary">{quest.totalXP}</td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={statusColors[quest.status as keyof typeof statusColors]}>
                          {quest.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredQuests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No quests found. Try adjusting your search.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
