"use server"

import { createClient } from "@/lib/supabase/server"

export async function recalculateLeaderboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Optional: role check (recommended)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["mentor", "admin"].includes(profile.role)) {
    throw new Error("Not authorized")
  }

  const { error } = await supabase.rpc("update_leaderboard")

  if (error) {
    console.error("Leaderboard recalculation failed:", error)
    throw new Error("Failed to recalculate leaderboard")
  }

  return { success: true }
}
