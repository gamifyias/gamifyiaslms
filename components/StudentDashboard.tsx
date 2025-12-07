"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { LevelBar } from "@/components/LevelBar"

interface StudentDashboardProps {
  studentId: string
}

interface LevelSystemData {
  student_id: string
  total_xp: number
  current_level: number
}

export function StudentDashboard({ studentId }: StudentDashboardProps) {
  const [levelData, setLevelData] = useState<LevelSystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLevelData = async () => {
      setLoading(true)
      try {
        const { data: level, error: levelError } = await supabase
          .from("level_system")
          .select("*")
          .eq("student_id", studentId)
          .single()

        if (levelError && levelError.code !== "PGRST116") {
          console.error("Error fetching level data:", levelError)
        }

        if (level) {
          setLevelData(level)
        } else {
          setLevelData({
            student_id: studentId,
            total_xp: 0,
            current_level: 1,
          })
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setLevelData({
          student_id: studentId,
          total_xp: 0,
          current_level: 1,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLevelData()
  }, [studentId, supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const calculateXPToNext = (totalXP: number): number => {
    const currentLevel = Math.floor(totalXP / 1000) + 1
    const xpNeededForNextLevel = currentLevel * 1000
    return Math.max(0, xpNeededForNextLevel - totalXP)
  }

  return (
    <div className="space-y-6">
      {/* Level Bar */}
      <LevelBar studentId={studentId} refreshTrigger={0} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{levelData?.total_xp.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {calculateXPToNext(levelData?.total_xp || 0)} XP to Level {(levelData?.current_level || 1) + 1}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{levelData?.current_level || 1}</div>
            <p className="text-xs text-muted-foreground mt-2">Keep studying to level up!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {levelData?.total_xp && levelData.current_level
                ? Math.round(((levelData.total_xp % 1000) / 1000) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-2">To next level</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
