import { useState, useCallback } from "react"
import { awardXP, XPEventType } from "@/lib/xp/awardXP"

export interface XPResult {
  success: boolean
  newTotalXP: number
  xpEarned: number
  leveledUp: boolean
  newLevel: number
  error?: string
}

export const useXP = (studentId: string, topicId: string) => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<XPResult | null>(null)

  const giveXP = useCallback(
    async (
      eventType: XPEventType,
      materialId: string,
      score?: number
    ): Promise<XPResult> => {
      setIsLoading(true)
      try {
        const result = await awardXP(
          eventType,
          materialId,
          studentId,
          topicId,
          score
        )
        setLastResult(result)
        return result
      } finally {
        setIsLoading(false)
      }
    },
    [studentId, topicId]
  )

  return {
    giveXP,
    isLoading,
    lastResult,
  }
}
