export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MentorSidebar } from "@/components/mentor-sidebar"
import { StudentsList } from "@/components/students-list"

export default async function StudentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "mentor") {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-screen bg-background">
      <MentorSidebar />
      <div className="flex-1 overflow-auto">
        <StudentsList />
      </div>
    </div>
  )
}
