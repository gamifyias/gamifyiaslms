import { createClient } from "@/lib/supabase/client"

export type MaterialType = "pdf" | "video" | "test"

export interface TopicProgressData {
  id: string
  student_id: string
  topic_id: string
  video_xp: number
  test_xp: number
  revision_xp: number
  total_xp: number
  video_completed: boolean
  test_score: number
  test_completed: boolean
  revision_1_completed: boolean
  revision_1_date: string | null
  revision_2_completed: boolean
  revision_2_date: string | null
  revision_3_completed: boolean
  revision_3_date: string | null
  revision_4_completed: boolean
  revision_4_date: string | null
  status: "MASTERED" | "GOOD" | "NEEDS_WORK"
  progress_percentage: number
  started_at: string
  last_updated: string
  created_at: string
}

export interface StudyMaterial {
  id: string
  topic_id: string
  title: string
  content_type: "video" | "pdf" | "notes" | "slides" | "test" | "test-solution" | "reference" | "extra"
  resource_url: string
  duration_minutes?: number
}

// =============================
// Utility Functions
// =============================

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// FIX: Adjusted thresholds so 100 XP is now Mastered
export const getStatusFromXP = (totalXP: number): "MASTERED" | "GOOD" | "NEEDS_WORK" => {
  if (totalXP >= 100) return "MASTERED"
  if (totalXP >= 60) return "GOOD"
  return "NEEDS_WORK"
}

// FIX: Updated logic to ensure 100% if Test + 4 Revisions are done
export const recalcProgress = (
  videoCompleted: boolean,
  testCompleted: boolean,
  rev1: boolean,
  rev2: boolean,
  rev3: boolean,
  rev4: boolean
): number => {
  // Primary Logic: If Test is passed and all Revisions are done, it is 100%
  // This fixes the "75% glitch" if they skipped the video or if math was off.
  if (testCompleted && rev1 && rev2 && rev3 && rev4) {
    return 100
  }

  // Standard calculation for partial progress
  let progress = 0
  if (videoCompleted) progress += 10
  if (testCompleted) progress += 50 // Increased weight of test completion
  if (rev1) progress += 10
  if (rev2) progress += 10
  if (rev3) progress += 10
  if (rev4) progress += 10
  
  return Math.min(progress, 100)
}

// FIX: Helper to calculate Total XP with the "Completion Bonus" rule
const calculateSmartTotalXP = (
  currentVideoXP: number,
  currentTestXP: number,
  currentRevisionXP: number,
  isCompleteSet: boolean // (Test + 4 Revisions)
): number => {
  const rawTotal = currentVideoXP + currentTestXP + currentRevisionXP
  
  // If the user completed the main loop (Test + 4 Revisions), force 100 XP
  if (isCompleteSet && rawTotal < 100) {
    return 100
  }
  
  return rawTotal
}

export const getXPFromTestScore = (score: number): number => {
  if (score >= 16) return 40
  if (score >= 11) return 30
  if (score >= 7) return 20
  return 10 // Minimum points for attempting
}

// =============================
// Ensure Topic Progress Exists
// =============================

export const ensureTopicProgress = async (
  studentId: string,
  topicId: string
): Promise<TopicProgressData | null> => {
  const supabase = createClient()

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("topic_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("topic_id", topicId)
      .maybeSingle()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.warn("Error fetching topic progress:", fetchError)
    }

    if (existing) {
      return existing
    }

    const now = new Date().toISOString()
    const { data: newRow, error: insertError } = await supabase
      .from("topic_progress")
      .insert({
        student_id: studentId,
        topic_id: topicId,
        video_xp: 0,
        test_xp: 0,
        revision_xp: 0,
        total_xp: 0,
        video_completed: false,
        test_score: 0,
        test_completed: false,
        revision_1_completed: false,
        revision_2_completed: false,
        revision_3_completed: false,
        revision_4_completed: false,
        status: "NEEDS_WORK",
        progress_percentage: 0,
        started_at: now,
        last_updated: now,
      })
      .select()
      .maybeSingle()

    if (insertError) {
      console.warn("Error creating topic progress:", insertError)
      return null
    }

    return newRow
  } catch (err) {
    console.warn("Exception in ensureTopicProgress:", err)
    return null
  }
}

// =============================
// Handle Video Complete
// =============================

export const handleVideoComplete = async (studentId: string, topicId: string): Promise<TopicProgressData | null> => {
  const supabase = createClient()

  try {
    let progress = await ensureTopicProgress(studentId, topicId)
    if (!progress) return null

    if (progress.video_completed) return progress

    const newVideoXP = 10 // Flat value
    
    // Check if everything else is already done
    const isSetComplete = progress.test_completed && 
      progress.revision_1_completed && 
      progress.revision_2_completed && 
      progress.revision_3_completed && 
      progress.revision_4_completed

    const newTotalXP = calculateSmartTotalXP(newVideoXP, progress.test_xp, progress.revision_xp, isSetComplete)
    const newStatus = getStatusFromXP(newTotalXP)
    
    const newProgressPercentage = recalcProgress(
      true,
      progress.test_completed,
      progress.revision_1_completed,
      progress.revision_2_completed,
      progress.revision_3_completed,
      progress.revision_4_completed
    )

    const { data: updated, error: updateError } = await supabase
      .from("topic_progress")
      .update({
        video_xp: newVideoXP,
        total_xp: newTotalXP,
        video_completed: true,
        status: newStatus,
        progress_percentage: newProgressPercentage,
        last_updated: new Date().toISOString(),
      })
      .eq("id", progress.id)
      .select()
      .maybeSingle()

    if (updateError) return progress
    return updated
  } catch (err) {
    console.warn("Exception in handleVideoComplete:", err)
    return null
  }
}

// =============================
// Handle Test Submit
// =============================

export const handleTestSubmit = async (
  studentId: string,
  topicId: string,
  score: number
): Promise<TopicProgressData | null> => {
  const supabase = createClient()

  try {
    let progress = await ensureTopicProgress(studentId, topicId)
    if (!progress) return null

    // Calculate XP from score
    const newTestXP = getXPFromTestScore(score)
    
    // Check if this action completes the set
    const isSetComplete = 
      true && // We are completing test now
      progress.revision_1_completed && 
      progress.revision_2_completed && 
      progress.revision_3_completed && 
      progress.revision_4_completed

    // Calculate total with bonus if complete
    const newTotalXP = calculateSmartTotalXP(progress.video_xp, newTestXP, progress.revision_xp, isSetComplete)
    const newStatus = getStatusFromXP(newTotalXP)
    
    const newProgressPercentage = recalcProgress(
      progress.video_completed,
      true,
      progress.revision_1_completed,
      progress.revision_2_completed,
      progress.revision_3_completed,
      progress.revision_4_completed
    )

    const { data: updated, error: updateError } = await supabase
      .from("topic_progress")
      .update({
        test_xp: newTestXP,
        total_xp: newTotalXP,
        test_score: score,
        test_completed: true,
        status: newStatus,
        progress_percentage: newProgressPercentage,
        last_updated: new Date().toISOString(),
      })
      .eq("id", progress.id)
      .select()
      .maybeSingle()

    if (updateError) return progress
    return updated
  } catch (err) {
    console.warn("Exception in handleTestSubmit:", err)
    return null
  }
}

// =============================
// Handle Revision Complete
// =============================

export const handleRevisionComplete = async (
  studentId: string,
  topicId: string,
  revisionIndex: number
): Promise<TopicProgressData | null> => {
  const supabase = createClient()

  try {
    let progress = await ensureTopicProgress(studentId, topicId)
    if (!progress) return null

    const revisionKey = `revision_${revisionIndex}_completed` as keyof TopicProgressData
    const revisionDateKey = `revision_${revisionIndex}_date` as keyof TopicProgressData

    if (progress[revisionKey]) return progress

    const newRevisionXP = progress.revision_xp + 10
    
    // Check if this revision completes the set
    // We check if Test is done, AND all OTHER revisions are done
    const isRev1Done = revisionIndex === 1 ? true : progress.revision_1_completed
    const isRev2Done = revisionIndex === 2 ? true : progress.revision_2_completed
    const isRev3Done = revisionIndex === 3 ? true : progress.revision_3_completed
    const isRev4Done = revisionIndex === 4 ? true : progress.revision_4_completed
    
    const isSetComplete = progress.test_completed && isRev1Done && isRev2Done && isRev3Done && isRev4Done

    const newTotalXP = calculateSmartTotalXP(progress.video_xp, progress.test_xp, newRevisionXP, isSetComplete)
    const newStatus = getStatusFromXP(newTotalXP)

    const updateData: any = {
      [revisionKey]: true,
      [revisionDateKey]: new Date().toISOString(),
      revision_xp: newRevisionXP,
      total_xp: newTotalXP,
      status: newStatus,
      last_updated: new Date().toISOString(),
    }

    updateData.progress_percentage = recalcProgress(
      progress.video_completed,
      progress.test_completed,
      isRev1Done,
      isRev2Done,
      isRev3Done,
      isRev4Done
    )

    const { data: updated, error: updateError } = await supabase
      .from("topic_progress")
      .update(updateData)
      .eq("id", progress.id)
      .select()
      .maybeSingle()

    if (updateError) return progress
    return updated
  } catch (err) {
    console.warn("Exception in handleRevisionComplete:", err)
    return null
  }
}

// =============================
// Open Material (Revision Schedule)
// =============================

export const openMaterial = async (
  studentId: string,
  topicId: string,
  materialType: MaterialType
): Promise<boolean> => {
  const supabase = createClient()

  try {
    const { data: existing } = await supabase
      .from("revision_schedule")
      .select("*")
      .eq("student_id", studentId)
      .eq("topic_id", topicId)
      .eq("material_type", materialType)
      .maybeSingle()

    const now = new Date().toISOString()

    if (existing) {
      const { error: updateError } = await supabase
        .from("revision_schedule")
        .update({
          last_opened_at: now,
        })
        .eq("id", existing.id)

      if (updateError) console.warn("Error updating last_opened_at:", updateError)
    } else {
      const dueDate = addDays(new Date(), 1).toISOString()

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
        console.warn("Error creating revision schedule:", insertError)
        return false
      }
    }

    return true
  } catch (err) {
    console.warn("Exception in openMaterial:", err)
    return false
  }
}

// =============================
// Fetch Study Materials
// =============================

export const fetchStudyMaterials = async (topicIds: string[]): Promise<Map<string, StudyMaterial[]>> => {
  const supabase = createClient()

  try {
    if (topicIds.length === 0) return new Map()

    const { data: materials, error } = await supabase
      .from("study_materials")
      .select("id, topic_id, title, content_type, resource_url, duration_minutes")
      .in("topic_id", topicIds)

    if (error) {
      console.warn("Error fetching study materials:", error)
      return new Map()
    }

    const materialsByTopic = new Map<string, StudyMaterial[]>()
    
    materials?.forEach((material) => {
      if (!materialsByTopic.has(material.topic_id)) {
        materialsByTopic.set(material.topic_id, [])
      }
      materialsByTopic.get(material.topic_id)!.push(material)
    })

    return materialsByTopic
  } catch (err) {
    console.warn("Exception fetching study materials:", err)
    return new Map()
  }
}