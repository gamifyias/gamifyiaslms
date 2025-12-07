"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, UserCheck } from "lucide-react"

interface StatsCardProps {
  studentProfile: {
    current_level: number
    total_points: number
    board_rank: number
    current_streak: number
    overall_accuracy: number
  }
}

export function StatsCard({ studentProfile }: StatsCardProps) {
  const {
    current_level = 1,
    total_points = 0,
    board_rank = 0,
    current_streak = 0,
    overall_accuracy = 0,
  } = studentProfile || {}

  // Calculate XP to next level
  const xpForCurrentLevel = (current_level - 1) * 1000
  const xpForNextLevel = current_level * 1000
  const xpInCurrentLevel = total_points - xpForCurrentLevel
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel
  const progressPercentage = (xpInCurrentLevel / xpNeededForNext) * 100

}
