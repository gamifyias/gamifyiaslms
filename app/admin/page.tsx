"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, User, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type Role = "student" | "mentor" | "admin"

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: Role
  bio: string | null
  phone: string | null
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [workingUser, setWorkingUser] = useState<string | null>(null)
  const [adminId, setAdminId] = useState<string>("")

  /* ---------------- AUTH + LOAD USERS ---------------- */

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

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, bio, phone")
        .order("created_at")

      if (error) {
        toast({
          title: "Failed to load users",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setUsers(data || [])
      }

      setLoading(false)
    }

    init()
  }, [])

  /* ---------------- ROLE CHANGE ---------------- */

  const updateRole = async (
    user: UserProfile,
    newRole: Role
  ) => {
    if (user.id === adminId && newRole !== "admin") {
      toast({
        title: "Blocked",
        description: "You cannot remove your own admin role",
        variant: "destructive",
      })
      return
    }

    setWorkingUser(user.id)

    try {
      // 1️⃣ Update main profile
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id)

      if (error) throw error

      // 2️⃣ Clean old role tables
      await supabase.from("student_profiles").delete().eq("id", user.id)
      await supabase.from("mentor_profiles").delete().eq("id", user.id)

      // 3️⃣ Create role-specific row
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
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setWorkingUser(null)
    }
  }

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-muted">
      <AdminSidebar />

      <div className="flex-1 p-6 overflow-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-bold">
              User Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Full control over platform users and roles
            </p>
          </div>
        </div>

        {/* USERS */}
        <div className="grid gap-4">
          {users.map((user) => {
            const incomplete = !user.bio || !user.phone

            return (
              <Card key={user.id}>
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {user.full_name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Badge>{user.role}</Badge>
                    {incomplete && (
                      <Badge variant="destructive">
                        Incomplete
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">

                  {/* PROFILE WARNINGS */}
                  {incomplete && (
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      Profile missing bio or phone
                    </div>
                  )}

                  {/* ROLE ACTIONS */}
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
                          disabled={workingUser === user.id}
                          onClick={() =>
                            updateRole(user, role)
                          }
                        >
                          {workingUser === user.id &&
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
