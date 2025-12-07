export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MentorSidebar } from "@/components/mentor-sidebar"
import { MentorDashboard } from "@/components/mentor-dashboard"

export default async function MentorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/welcome")
  }

  if (profile.role !== "mentor") {
    const redirectPath = profile.role === "student" ? "/student" : profile.role === "admin" ? "/admin" : "/mentor"
    redirect(redirectPath)
  }

  return (
    <div className="flex h-screen bg-background">
      <MentorSidebar />
      <div className="flex-1 overflow-auto">
        <MentorDashboard mentorId={user.id} />
      </div>
    </div>
  )
}
