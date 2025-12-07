export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StudentSidebar } from "@/components/student-sidebar"
import { CharacterSheet } from "@/components/character-sheet"

export default async function CharacterSheetPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "student") {
    redirect("/student")
  }

  return (
    <div className="flex h-screen bg-background">
      <StudentSidebar />
      <div className="flex-1 overflow-auto">
        <CharacterSheet studentId={user.id} />
      </div>
    </div>
  )
}
