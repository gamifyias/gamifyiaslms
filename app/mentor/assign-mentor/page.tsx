"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MentorSidebar } from "@/components/mentor-sidebar"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Users, Repeat } from "lucide-react"

/* ---------------- TYPES ---------------- */

type Student = {
  id: string
  full_name: string
  email: string
}

type Mentor = {
  mentor_profile_id: string
  full_name: string
}

type AssignedStudent = {
  student_id: string
  student_name: string
  mentor_name: string
  mentor_profile_id: string
}

/* ---------------- PAGE ---------------- */

export default function AssignMentorPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)

  const [students, setStudents] = useState<Student[]>([])
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [assigned, setAssigned] = useState<AssignedStudent[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedMentorId, setSelectedMentorId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return (location.href = "/auth/login")

      const { data: me } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single()

      if (me?.role !== "mentor") return (location.href = "/auth/login")

      // All mentors
      const { data: mentorRows } = await supabase
        .from("mentor_profiles")
        .select("id, profiles(full_name)")

      setMentors(
        (mentorRows || []).map((m: any) => ({
          mentor_profile_id: m.id,
          full_name: m.profiles.full_name,
        })),
      )

      // Assigned students
      const { data: assignedRows } = await supabase
        .from("student_mentor_assignments")
        .select(
          `
          student_id,
          mentor_id,
          profiles!student_id(full_name),
          mentor_profiles!mentor_id(
            profiles(full_name)
          )
        `,
        )
        .eq("is_active", true)

      setAssigned(
        (assignedRows || []).map((r: any) => ({
          student_id: r.student_id,
          student_name: r.profiles.full_name,
          mentor_name: r.mentor_profiles.profiles.full_name,
          mentor_profile_id: r.mentor_id,
        })),
      )

      // Unassigned students
      const assignedIds = (assignedRows || []).map((r: any) => r.student_id)

      const { data: studentRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "student")
        .not("id", "in", `(${assignedIds.join(",") || "null"})`)
        .order("full_name")

      setStudents(studentRows || [])
      setLoading(false)
    }

    load()
  }, [])

  /* ---------------- ASSIGN / CHANGE ---------------- */

  const openDialog = (studentId: string, mentorId?: string) => {
    setSelectedStudentId(studentId)
    setSelectedMentorId(mentorId || "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedStudentId || !selectedMentorId) return

    setSaving(true)

    try {
      await supabase
        .from("student_mentor_assignments")
        .update({
          is_active: false,
          removed_at: new Date().toISOString(),
        })
        .eq("student_id", selectedStudentId)
        .eq("is_active", true)

      const { error } = await supabase
        .from("student_mentor_assignments")
        .insert({
          student_id: selectedStudentId,
          mentor_id: selectedMentorId,
          is_active: true,
        })

      if (error) throw error

      toast({
        title: "Mentor Updated",
        description: "Mentor assignment saved successfully.",
      })

      location.reload()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  /* ---------------- RENDER ---------------- */

  if (loading) {
    return (
      <div className="flex h-screen">
        <MentorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <MentorSidebar />

      <div className="flex-1 p-8 max-w-5xl mx-auto space-y-8">
        {/* ASSIGNED */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Students with Assigned Mentors
          </h2>

          <div className="space-y-3">
            {assigned.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No students assigned yet.
              </p>
            )}

            {assigned.map((s) => (
              <Card key={s.student_id}>
                <CardContent className="flex justify-between items-center py-4">
                  <div>
                    <p className="font-medium">{s.student_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Mentor: {s.mentor_name}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openDialog(s.student_id, s.mentor_profile_id)
                    }
                  >
                    <Repeat className="w-4 h-4 mr-1" />
                    Change Mentor
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* UNASSIGNED */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Assign Mentor to Student
          </h2>

          <div className="space-y-2">
            {students.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex justify-between items-center py-4">
                  <div>
                    <p className="font-medium">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => openDialog(s.id)}
                  >
                    Assign Mentor
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Mentor</DialogTitle>
          </DialogHeader>

          <Select
            value={selectedMentorId}
            onValueChange={setSelectedMentorId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose mentor" />
            </SelectTrigger>
            <SelectContent>
              {mentors.map((m) => (
                <SelectItem
                  key={m.mentor_profile_id}
                  value={m.mentor_profile_id}
                >
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="w-full mt-4"
            disabled={saving}
            onClick={handleSave}
          >
            {saving && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save Assignment
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
