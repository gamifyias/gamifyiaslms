import { createClient } from "@/lib/supabase/client"

export type XPEventType = 
  | "note_read" 
  | "note_revise" 
  | "video_watch" 
  | "video_rewatch" 
  | "test_score" 
  | "revision_complete"

// XP amounts for each action
const XP_AMOUNTS: Record<XPEventType, (score?: number) => number> = {
  note_read: () => 10,
  note_revise: () => 5,
  video_watch: () => 15,
  video_rewatch: () => 5,
  test_score: (score = 0) => {
    if (score >= 16) return 50
    if (score >= 11) return 25
    if (score >= 7) return 10
    return 0
  },
  revision_complete: () => 10,
}

// Calculate level from total XP
export const calculateLevel = (totalXP: number): number => {
  return Math.floor(totalXP / 1000) + 1
}

// Calculate XP needed to reach next level
export const calculateXPToNext = (totalXP: number): number => {
  const currentLevel = calculateLevel(totalXP)
  const xpNeededForNextLevel = currentLevel * 1000
  return Math.max(0, xpNeededForNextLevel - totalXP)
}

// Check cooldown from localStorage
export const checkCooldown = (
  eventType: XPEventType,
  materialId: string,
  studentId: string
): boolean => {
  try {
    const key = `cooldown_${eventType}_${materialId}_${studentId}`
    const lastTime = localStorage.getItem(key)

    if (!lastTime) return true // No cooldown, allowed

    const elapsed = Date.now() - parseInt(lastTime)
    const COOLDOWN_DURATION = 180000 // 3 minutes
    return elapsed > COOLDOWN_DURATION
  } catch {
    return true // Allow on error
  }
}

// Save cooldown to localStorage
export const saveCooldown = (
  eventType: XPEventType,
  materialId: string,
  studentId: string
): void => {
  try {
    const key = `cooldown_${eventType}_${materialId}_${studentId}`
    localStorage.setItem(key, Date.now().toString())
  } catch {
    console.warn("Failed to save cooldown")
  }
}

// Award XP to student
export const awardXP = async (
  eventType: XPEventType,
  materialId: string,
  studentId: string,
  topicId: string,
  score?: number
): Promise<{
  success: boolean
  newTotalXP: number
  xpEarned: number
  leveledUp: boolean
  oldLevel: number
  newLevel: number
  error?: string
}> => {
  const supabase = createClient()

  try {
    // Check cooldown
    if (!checkCooldown(eventType, materialId, studentId)) {
      return {
        success: false,
        newTotalXP: 0,
        xpEarned: 0,
        leveledUp: false,
        oldLevel: 1,
        newLevel: 1,
        error: "XP cooldown active. Try again in a few minutes.",
      }
    }

    // Calculate XP amount
    const xpEarned = XP_AMOUNTS[eventType](score)

    // If no XP earned (test score too low), return early
    if (xpEarned === 0) {
      return {
        success: true,
        newTotalXP: 0,
        xpEarned: 0,
        leveledUp: false,
        oldLevel: 1,
        newLevel: 1,
      }
    }

    // Fetch or create level system entry
    const { data: levelSystemData, error: fetchError } = await supabase
      .from("level_system")
      .select("total_xp, current_level")
      .eq("student_id", studentId)
      .single()

    let oldTotalXP = 0
    let oldLevel = 1

    if (fetchError && fetchError.code !== "PGRST116") {
      // Error other than "not found"
      throw new Error(`Failed to fetch level system: ${fetchError.message}`)
    }

    if (levelSystemData) {
      oldTotalXP = levelSystemData.total_xp || 0
      oldLevel = levelSystemData.current_level || 1
    }

    // Calculate new totals
    const newTotalXP = oldTotalXP + xpEarned
    const newLevel = calculateLevel(newTotalXP)
    const leveledUp = newLevel > oldLevel

    // Upsert level system entry - only include columns that exist
    const { error: upsertError } = await supabase.from("level_system").upsert(
      {
        student_id: studentId,
        total_xp: newTotalXP,
        current_level: newLevel,
      },
      { onConflict: "student_id" }
    )

    if (upsertError) {
      throw new Error(`Failed to update level system: ${upsertError.message}`)
    }

    // Insert XP event for tracking
    const { error: eventError } = await supabase.from("xp_events").insert({
      student_id: studentId,
      topic_id: topicId,
      material_id: materialId,
      event_type: eventType,
      xp: xpEarned,
      created_at: new Date().toISOString(),
    })

    if (eventError) {
      console.warn("Failed to insert XP event:", eventError)
      // Don't fail the whole operation if event tracking fails
    }

    // Save cooldown
    saveCooldown(eventType, materialId, studentId)

    return {
      success: true,
      newTotalXP,
      xpEarned,
      leveledUp,
      oldLevel,
      newLevel,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to award XP"
    console.error("Error awarding XP:", errorMsg)
    return {
      success: false,
      newTotalXP: 0,
      xpEarned: 0,
      leveledUp: false,
      oldLevel: 1,
      newLevel: 1,
      error: errorMsg,
    }
  }
}
