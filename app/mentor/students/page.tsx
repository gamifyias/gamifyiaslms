export const dynamic = "force-dynamic"

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "mentor") {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23]">
      <MentorSidebar />

      <div className="flex-1 overflow-auto p-8 animate-in fade-in duration-300">
        {/* STUDENT LIST CONTENT */}
        <StudentsList />
      </div>
    </div>
  )
}
