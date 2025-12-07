import { createClient } from "@/lib/supabase/client"

export type MaterialType = "pdf" | "video" | "test"

export interface RevisionScheduleEntry {
  id: string
  student_id: string
  topic_id: string
  material_type: MaterialType
  revision_number: number
  first_opened_at: string
  last_opened_at: string
  due_date: string
  completed_date: string | null
  is_completed: boolean
  created_at: string
}

export interface DojoTabs {
  overdue: RevisionScheduleEntry[]
  today: RevisionScheduleEntry[]
  upcoming: RevisionScheduleEntry[]
}

const REVISION_INTERVALS = [1, 7, 14, 30]

// =============================
// Utility Functions
// =============================

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const isToday = (date: string): boolean => {
  const revDate = new Date(date)
  const today = new Date()
  return (
    revDate.getFullYear() === today.getFullYear() &&
    revDate.getMonth() === today.getMonth() &&
    revDate.getDate() === today.getDate()
  )
}

export const isOverdue = (date: string, isCompleted: boolean): boolean => {
  if (isCompleted) return false
  const revDate = new Date(date)
  const now = new Date()
  return revDate < now
}

export const isUpcoming = (date: string, isCompleted: boolean): boolean => {
  if (isCompleted) return false
  const revDate = new Date(date)
  const now = new Date()
  return revDate > now && !isToday(date)
}

// =============================
// FIXED: Open Material Function
// =============================

/**
 * Open a material and manage revision_schedule entry.
 *
 * Logic:
 * 1. Check if revision_schedule entry exists for this material
 * 2. If EXISTS: Update last_opened_at only
 * 3. If NOT EXISTS: Create new first revision entry
 *
 * This prevents duplicate entries when user opens same material multiple times.
 */
export const openMaterial = async (
  topicId: string,
  studentId: string,
  materialType: MaterialType
): Promise<RevisionScheduleEntry | null> => {
  const supabase = createClient()

  try {
    // Step 1: Check if entry already exists
    const { data: existing, error: fetchError } = await supabase
      .from("revision_schedule")
      .select("*")
      .eq("student_id", studentId)
      .eq("topic_id", topicId)
      .eq("material_type", materialType)
      .maybeSingle()

    if (fetchError) {
      console.warn("Warning fetching revision_schedule:", fetchError.message)
    }

    const now = new Date().toISOString()

    if (existing) {
      // Step 2: Entry EXISTS → Update last_opened_at ONLY
      const { error: updateError } = await supabase
        .from("revision_schedule")
        .update({
          last_opened_at: now,
        })
        .eq("id", existing.id)

      if (updateError) {
        console.warn("Warning updating last_opened_at:", updateError.message)
        return existing
      }

      // Also update topic_progress.last_updated
      await supabase
        .from("topic_progress")
        .update({
          last_updated: now,
        })
        .eq("topic_id", topicId)
        .eq("student_id", studentId)

      return existing
    } else {
      // Step 3: Entry DOES NOT EXIST → Create new first revision entry
      const dueDate = addDays(new Date(), REVISION_INTERVALS[0]).toISOString()

      const { data: inserted, error: insertError } = await supabase
        .from("revision_schedule")
        .insert({
          student_id: studentId,
          topic_id: topicId,
          material_type: materialType,
          revision_number: 1,
          first_opened_at: now,
          last_opened_at: now,
          due_date: dueDate,
          is_completed: false,
        })
        .select()
        .maybeSingle()

      if (insertError) {
        console.warn("Warning creating revision entry:", insertError.message)
        return null
      }

      // Also update topic_progress.last_updated
      await supabase
        .from("topic_progress")
        .update({
          last_updated: now,
        })
        .eq("topic_id", topicId)
        .eq("student_id", studentId)

      return inserted
    }
  } catch (err) {
    console.warn("Exception in openMaterial:", err)
    return null
  }
}

// =============================
// Start Topic Progress
// =============================

export const startTopicProgress = async (
  topicId: string,
  studentId: string,
  materialTypes: MaterialType[] = ["pdf", "video", "test"]
): Promise<void> => {
  const supabase = createClient()

  try {
    for (const materialType of materialTypes) {
      try {
        // Check if entry already exists
        const { data: existing } = await supabase
          .from("revision_schedule")
          .select("id")
          .eq("student_id", studentId)
          .eq("topic_id", topicId)
          .eq("material_type", materialType)
          .maybeSingle()

        // Skip if already exists
        if (existing) continue

        const now = new Date().toISOString()
        const dueDate = addDays(new Date(), REVISION_INTERVALS[0]).toISOString()

        // Create first revision entry
        const { error: insertError } = await supabase.from("revision_schedule").insert({
          student_id: studentId,
          topic_id: topicId,
          material_type: materialType,
          revision_number: 1,
          first_opened_at: now,
          last_opened_at: now,
          due_date: dueDate,
          is_completed: false,
        })

        if (insertError) {
          console.warn(`Warning creating revision for ${materialType}:`, insertError.message)
        }
      } catch (err) {
        console.warn(`Exception creating revision for ${materialType}:`, err)
      }
    }
  } catch (err) {
    console.warn("Warning in startTopicProgress:", err)
  }
}

// =============================
// Complete Revision
// =============================

export const completeRevision = async (revisionId: string, studentId: string): Promise<boolean> => {
  const supabase = createClient()

  try {
    const { data: revision } = await supabase
      .from("revision_schedule")
      .select("*")
      .eq("id", revisionId)
      .single()

    if (!revision) {
      console.warn("Revision not found")
      return false
    }

    const now = new Date().toISOString()

    // Mark as completed
    const { error: completeError } = await supabase
      .from("revision_schedule")
      .update({
        completed_date: now,
        is_completed: true,
      })
      .eq("id", revisionId)

    if (completeError) {
      console.warn("Warning completing revision:", completeError)
      return false
    }

    // Create next revision if not the last one
    if (revision.revision_number < 4) {
      const nextRevNumber = revision.revision_number + 1
      const nextDueDate = addDays(new Date(), REVISION_INTERVALS[nextRevNumber - 1]).toISOString()

      const { error: nextError } = await supabase.from("revision_schedule").insert({
        student_id: revision.student_id,
        topic_id: revision.topic_id,
        material_type: revision.material_type,
        revision_number: nextRevNumber,
        first_opened_at: revision.first_opened_at,
        last_opened_at: now,
        due_date: nextDueDate,
        is_completed: false,
      })

      if (nextError) {
        console.warn("Warning creating next revision:", nextError)
      }
    }

    await awardRevisionXP(studentId)
    return true
  } catch (err) {
    console.error("Error in completeRevision:", err)
    return false
  }
}

// =============================
// Award XP for Revision
// =============================

const awardRevisionXP = async (studentId: string): Promise<void> => {
  const supabase = createClient()

  try {
    const { data: levelData } = await supabase
      .from("level_system")
      .select("total_xp, current_level")
      .eq("student_id", studentId)
      .maybeSingle()

    const oldTotalXP = levelData?.total_xp || 0
    const newTotalXP = oldTotalXP + 10
    const newLevel = Math.floor(newTotalXP / 1000) + 1

    const { error: updateError } = await supabase.from("level_system").upsert(
      {
        student_id: studentId,
        total_xp: newTotalXP,
        current_level: newLevel,
      },
      { onConflict: "student_id" }
    )

    if (updateError) {
      console.warn("Warning updating level system:", updateError)
    }

    await supabase.from("xp_events").insert({
      student_id: studentId,
      topic_id: "",
      material_id: "",
      event_type: "revision_complete",
      xp: 10,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn("Warning in awardRevisionXP:", err)
  }
}

// =============================
// 4. Fetch Dojo Tabs
// =============================

export const fetchDojoTabs = async (studentId: string): Promise<DojoTabs> => {
  const supabase = createClient()

  try {
    const { data: revisions } = await supabase
      .from("revision_schedule")
      .select("*")
      .eq("student_id", studentId)
      .eq("is_completed", false)
      .order("due_date", { ascending: true })

    if (!revisions || revisions.length === 0) {
      return { overdue: [], today: [], upcoming: [] }
    }

    const overdue: RevisionScheduleEntry[] = []
    const today: RevisionScheduleEntry[] = []
    const upcoming: RevisionScheduleEntry[] = []

    revisions.forEach((rev: RevisionScheduleEntry) => {
      if (isOverdue(rev.due_date, rev.is_completed)) {
        overdue.push(rev)
      } else if (isToday(rev.due_date)) {
        today.push(rev)
      } else if (isUpcoming(rev.due_date, rev.is_completed)) {
        upcoming.push(rev)
      }
    })

    return { overdue, today, upcoming }
  } catch (err) {
    console.warn("Warning in fetchDojoTabs:", err)
    return { overdue: [], today: [], upcoming: [] }
  }
}

// =============================
// Fetch All Revisions for Student
// =============================

export const fetchAllRevisions = async (studentId: string): Promise<RevisionScheduleEntry[]> => {
  const supabase = createClient()

  try {
    const { data: revisions } = await supabase
      .from("revision_schedule")
      .select("*")
      .eq("student_id", studentId)
      .order("due_date", { ascending: true })

    return revisions || []
  } catch (err) {
    console.warn("Warning in fetchAllRevisions:", err)
    return []
  }
}
