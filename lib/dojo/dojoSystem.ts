import { createClient } from "@/lib/supabase/client"

export type MaterialType = "pdf" | "video" | "test"

// Updated Interface to include the nested Topic data
export interface DojoRevision {
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
  // This is critical for the UI to show names
  topics?: {
    name: string
    description: string
  }
}

export interface DojoTabs {
  overdue: DojoRevision[]
  today: DojoRevision[]
  upcoming: DojoRevision[]
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
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return revDate < todayStart
}

export const isUpcoming = (date: string, isCompleted: boolean): boolean => {
  if (isCompleted) return false
  const revDate = new Date(date)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  return revDate > todayEnd
}

// =============================
// 1. Fetch Dojo Tabs (The Main Data Function)
// =============================

export const getDojoRevisions = async (studentId: string): Promise<DojoTabs> => {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("revision_schedule")
      .select(`
        *,
        topics (
          name,
          description
        )
      `)
      .eq("student_id", studentId)
      .eq("is_completed", false)
      .order("due_date", { ascending: true })

    if (error) {
      console.warn("Error fetching dojo revisions:", error)
      return { overdue: [], today: [], upcoming: [] }
    }

    const revisions = (data as unknown as DojoRevision[]) || []

    const overdue: DojoRevision[] = []
    const today: DojoRevision[] = []
    const upcoming: DojoRevision[] = []

    revisions.forEach((rev) => {
      if (isToday(rev.due_date)) {
        today.push(rev)
      } else if (isUpcoming(rev.due_date, rev.is_completed)) {
        upcoming.push(rev)
      } else {
        overdue.push(rev)
      }
    })

    return { overdue, today, upcoming }
  } catch (err) {
    console.warn("Exception in getDojoRevisions:", err)
    return { overdue: [], today: [], upcoming: [] }
  }
}

// =============================
// IMPORTANT: Alias for compatibility with useDojo hook
// =============================
export const fetchDojoTabs = getDojoRevisions; 

// =============================
// Helper: Award XP
// =============================

const awardRevisionXP = async (studentId: string): Promise<void> => {
  const supabase = createClient()
  try {
    const { data: levelData } = await supabase
      .from("level_system")
      .select("total_xp")
      .eq("student_id", studentId)
      .maybeSingle()

    const currentXP = levelData?.total_xp || 0
    
    await supabase.from("level_system").upsert(
      { student_id: studentId, total_xp: currentXP + 10, last_updated: new Date().toISOString() },
      { onConflict: "student_id" }
    )
  } catch (err) {
    console.warn("Warning in awardRevisionXP:", err)
  }
}

// =============================
// 2. Complete Revision (With LOCK Logic)
// =============================

// UPDATED: Now accepts optional 'studentId' as second argument to fix hook error
export const completeRevision = async (revisionId: string, studentId?: string): Promise<boolean> => {
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

    if (isUpcoming(revision.due_date, false)) {
      console.warn("Attempted to complete an upcoming revision early.")
      return false 
    }

    const now = new Date().toISOString()

    const { error: completeError } = await supabase
      .from("revision_schedule")
      .update({
        completed_date: now,
        is_completed: true,
        last_opened_at: now
      })
      .eq("id", revisionId)

    if (completeError) {
      console.warn("Warning completing revision:", completeError)
      return false
    }

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

    await awardRevisionXP(revision.student_id)
    
    return true
  } catch (err) {
    console.error("Error in completeRevision:", err)
    return false
  }
}

// =============================
// 3. Open Material (Preserved)
// =============================

export const openMaterial = async (
  studentId: string,
  topicId: string,
  materialType: MaterialType
): Promise<DojoRevision | null> => {
  const supabase = createClient()

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("revision_schedule")
      .select("*")
      .eq("student_id", studentId)
      .eq("topic_id", topicId)
      .eq("material_type", materialType)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.warn("Warning fetching revision_schedule:", fetchError.message)
    }

    const now = new Date().toISOString()

    if (existing) {
      await supabase
        .from("revision_schedule")
        .update({ last_opened_at: now })
        .eq("id", existing.id)

      return existing
    } else {
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
      return inserted
    }
  } catch (err) {
    console.warn("Exception in openMaterial:", err)
    return null
  }
}

// =============================
// 4. Start Topic Progress (Preserved)
// =============================

export const startTopicProgress = async (
  topicId: string,
  studentId: string,
  materialTypes: MaterialType[] = ["pdf", "video", "test"]
): Promise<void> => {
  const supabase = createClient()

  try {
    for (const materialType of materialTypes) {
      const { data: existing } = await supabase
        .from("revision_schedule")
        .select("id")
        .eq("student_id", studentId)
        .eq("topic_id", topicId)
        .eq("material_type", materialType)
        .maybeSingle()

      if (existing) continue

      const now = new Date().toISOString()
      const dueDate = addDays(new Date(), REVISION_INTERVALS[0]).toISOString()

      await supabase.from("revision_schedule").insert({
        student_id: studentId,
        topic_id: topicId,
        material_type: materialType,
        revision_number: 1,
        first_opened_at: now,
        last_opened_at: now,
        due_date: dueDate,
        is_completed: false,
      })
    }
  } catch (err) {
    console.warn("Warning in startTopicProgress:", err)
  }
}
