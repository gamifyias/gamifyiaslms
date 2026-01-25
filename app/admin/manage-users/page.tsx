"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, UserCog, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type Role = "student" | "mentor" | "admin"

type Profile = {
  id: string
  full_name: string
  email: string
  role: Role
  bio?: string | null
  phone?: string | null
}

export default function AdminUserManagementPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [adminId, setAdminId] = useState<string>("")

  /* ---------------- AUTH & LOAD ---------------- */

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()

      if (!auth.user) {
        location.href = "/auth/login"
        return
      }

      setAdminId(auth.user.id)

      const { data: me } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single()

      if (me?.role !== "admin") {
        location.href = "/no-access"
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, bio, phone")
        .order("created_at")

      setUsers(data || [])
      setLoading(false)
    }

    init()
  }, [])

  /* ---------------- ROLE CHANGE ---------------- */

  const changeRole = async (user: Profile, newRole: Role) => {
    if (user.id === adminId && newRole !== "admin") {
      toast({
        title: "Blocked",
        description: "You cannot remove your own admin role",
        variant: "destructive",
      })
      return
    }

    setWorkingId(user.id)

    // 1️⃣ Update role
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", user.id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setWorkingId(null)
      return
    }

    // 2️⃣ Reset role-linked profiles
    await supabase.from("student_profiles").delete().eq("id", user.id)
    await supabase.from("mentor_profiles").delete().eq("id", user.id)

    // 3️⃣ Recreate role profile safely
    if (newRole === "student") {
      await supabase.from("student_profiles").insert({
        id: user.id,
        profile_id: user.id,
      })
    }

    if (newRole === "mentor") {
      await supabase.from("mentor_profiles").insert({
        id: user.id,
        profile_id: user.id,
        specialization: "General",
      })
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, role: newRole } : u
      )
    )

    toast({
      title: "Role Updated",
      description: `${user.full_name} is now ${newRole}`,
    })

    setWorkingId(null)
  }

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-muted">
      <AdminSidebar />

      <div className="flex-1 p-6 space-y-6 overflow-auto">

        {/* HEADER */}
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">
            Admin – User Management
          </h1>
        </div>

        {/* USER LIST */}
        <div className="grid gap-4">
          {users.map((user) => {
            const incomplete =
              !user.bio || !user.phone

            return (
              <Card key={user.id}>
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      {user.full_name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">
                      {user.role}
                    </Badge>

                    {incomplete && (
                      <Badge variant="destructive">
                        Incomplete Profile
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">

                  {/* PROFILE STATUS */}
                  {incomplete && (
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      Missing bio or phone number
                    </div>
                  )}

                  {/* ROLE CONTROLS */}
                  <div className="flex gap-2 flex-wrap">
                    {(["student", "mentor", "admin"] as Role[]).map(
                      (role) => (
                        <Button
                          key={role}
                          size="sm"
                          variant={
                            user.role === role
                              ? "default"
                              : "outline"
                          }
                          disabled={workingId === user.id}
                          onClick={() =>
                            changeRole(user, role)
                          }
                        >
                          {workingId === user.id &&
                            user.role !== role && (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            )}
                          {role}
                        </Button>
                      )
                    )}
                  </div>

                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
