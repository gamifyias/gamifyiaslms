"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"
import { useLevelBar } from "@/hooks/useLevelBar"

interface LevelBarProps {
  studentId: string
  refreshTrigger?: number
}

export function LevelBar({ studentId, refreshTrigger = 0 }: LevelBarProps) {
  const { data, loading, showLevelUp } = useLevelBar(studentId, refreshTrigger)

  if (loading || !data) {
    return <div className="h-20 bg-muted rounded-lg animate-pulse" />
  }

  const xpProgress = ((1000 - data.xpToNext) / 1000) * 100

  return (
    <Card className={`transition-all duration-500 ${showLevelUp ? "ring-2 ring-yellow-400" : ""}`}>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className={`text-lg py-2 px-4 gap-2 ${showLevelUp ? "animate-bounce" : ""}`}
              >
                <Zap className="h-4 w-4" />
                Level {data.currentLevel}
              </Badge>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {data.totalPoints.toLocaleString()} points
            </span>
          </div>

          <div className="space-y-1">
            <Progress value={Math.min(xpProgress, 100)} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(xpProgress)}%</span>
              <span>{data.xpToNext} XP to Level {data.nextLevel}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
