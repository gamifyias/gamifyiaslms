export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
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

  if (profile.role !== "admin") {
    const redirectPath = profile.role === "student" ? "/student" : profile.role === "mentor" ? "/mentor" : "/admin"
    redirect(redirectPath)
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <AdminDashboard />
      </div>
    </div>
  )
}
