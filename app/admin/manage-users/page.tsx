"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type Role = "student" | "mentor" | "admin"

type Profile = {
  id: string
  full_name: string
  email: string
  role: Role
}

export default function AdminRolePage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [adminId, setAdminId] = useState<string>("")

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        location.href = "/auth/login"
        return
      }

      setAdminId(user.id)

      const { data: me } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (me?.role !== "admin") {
        location.href = "/auth/login"
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .order("created_at")

      setUsers(data || [])
      setLoading(false)
    }

    init()
  }, [])

  const changeRole = async (user: Profile, newRole: Role) => {
    if (user.id === adminId && newRole !== "admin") {
      toast({
        title: "Action blocked",
        description: "You cannot remove your own admin role",
        variant: "destructive",
      })
      return
    }

    setWorkingId(user.id)

    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", user.id)

    if (roleError) {
      toast({
        title: "Error",
        description: roleError.message,
        variant: "destructive",
      })
      setWorkingId(null)
      return
    }

    await supabase.from("student_profiles").delete().eq("id", user.id)
    await supabase.from("mentor_profiles").delete().eq("id", user.id)

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
      description: `User is now ${newRole}`,
    })

    setWorkingId(null)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6" />
        Admin Role Control
      </h1>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle>{user.full_name}</CardTitle>
            </CardHeader>

            <CardContent className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>

              <div className="flex gap-2">
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
        ))}
      </div>
    </div>
  )
}
