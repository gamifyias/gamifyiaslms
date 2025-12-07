export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StudentSidebar } from "@/components/student-sidebar"
import { StudyMaterialsView } from "@/components/study-materials-view"

export default async function MaterialsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex h-screen bg-background">
      <StudentSidebar />
      <div className="flex-1 overflow-auto">
        <StudyMaterialsView userId={user.id} />
      </div>
    </div>
  )
}
