import { useState, useCallback, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { calculateLevel, calculateXPToNext } from "@/lib/xp/awardXP"

export interface LevelBarData {
  totalPoints: number
  currentLevel: number
  xpToNext: number
  nextLevel: number
}

export const useLevelBar = (studentId: string, refreshTrigger: number) => {
  const [data, setData] = useState<LevelBarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const supabase = createClient()
  const prevLevelRef = useRef<number>(0)

  const fetchLevelData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch from level_system table
      const { data: levelData, error } = await supabase
        .from("level_system")
        .select("total_xp, current_level")
        .eq("student_id", studentId)
        .single()

      if (error && error.code !== "PGRST116") {
        // Error other than "not found"
        throw error
      }

      if (!levelData) {
        // No level system entry yet, set defaults
        const defaultData: LevelBarData = {
          totalPoints: 0,
          currentLevel: 1,
          xpToNext: 1000,
          nextLevel: 2,
        }
        setData(defaultData)
        setLoading(false)
        return
      }

      const totalPoints = levelData.total_xp || 0
      const currentLevel = calculateLevel(totalPoints)
      const xpToNext = calculateXPToNext(totalPoints)
      const nextLevel = currentLevel + 1

      // Check for level up
      if (prevLevelRef.current > 0 && currentLevel > prevLevelRef.current) {
        setShowLevelUp(true)
        setTimeout(() => setShowLevelUp(false), 2000)
      }

      prevLevelRef.current = currentLevel

      setData({
        totalPoints,
        currentLevel,
        xpToNext,
        nextLevel,
      })
    } catch (err) {
      console.error("Error fetching level data:", err)
      const defaultData: LevelBarData = {
        totalPoints: 0,
        currentLevel: 1,
        xpToNext: 1000,
        nextLevel: 2,
      }
      setData(defaultData)
    } finally {
      setLoading(false)
    }
  }, [studentId, supabase])

  useEffect(() => {
    fetchLevelData()
  }, [fetchLevelData, refreshTrigger])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchLevelData, 5000)
    return () => clearInterval(interval)
  }, [fetchLevelData])

  return {
    data,
    loading,
    showLevelUp,
  }
}
