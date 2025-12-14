"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MentorSidebar } from "@/components/mentor-sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, MessageSquare } from "lucide-react"

interface Student {
  id: string
  full_name: string
  email: string
  phone: string | null
  current_level: number
}

export default function AssignedStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user?.id) return
        const mentorId = user.id

        const { data: assignments, error: assignErr } = await supabase
          .from("student_mentor_assignments")
          .select("student_id")
          .eq("mentor_id", mentorId)
          .eq("is_active", true)

        if (assignErr) throw assignErr

        const studentIds = assignments.map((a) => a.student_id)

        if (studentIds.length === 0) {
          setStudents([])
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            phone,
            student_profiles (
              current_level
            )
          `)
          .in("id", studentIds)
          .order("full_name", { ascending: true })

        if (error) throw error

        const formatted = data.map((item: any) => ({
          id: item.id,
          full_name: item.full_name,
          email: item.email,
          phone: item.phone || null,
          current_level: item.student_profiles?.current_level ?? 1,
        }))

        setStudents(formatted)
      } catch (error) {
        console.error("Error loading assigned students:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignedStudents()
  }, [])

  return (
    <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23]">
      <MentorSidebar />

      <div className="flex-1 overflow-auto p-8 space-y-6 animate-in fade-in duration-300">
        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7" />
            Assigned Students
          </h2>
          <p className="text-sm opacity-80 mt-1">
            Students currently assigned under your mentorship
          </p>
        </div>

        {/* TABLE CARD */}
        <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3]">
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription className="opacity-80">
              Total: {students.length} students
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-10 opacity-70">
                Loading assigned students...
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-10 opacity-70">
                You have no assigned students yet.
              </div>
            ) : (
              <div className="border-2 border-[#8B5A2B] rounded-md overflow-hidden bg-[#F6E7C1]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#EAD39C]">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {students.map((student) => (
                      <TableRow
                        key={student.id}
                        className="transition-colors hover:bg-[#EAD39C]"
                      >
                        <TableCell className="font-medium">
                          {student.full_name}
                        </TableCell>

                        <TableCell className="text-sm opacity-80">
                          {student.email}
                        </TableCell>

                        <TableCell className="text-sm">
                          {student.phone ?? "Not provided"}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border border-[#3B2A23] bg-[#F2DEB3]">
                            Level {student.current_level}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          {student.phone ? (
                            <a
                              href={`https://wa.me/${student.phone}`}
                              target="_blank"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="
                                  gap-1 border-[#3B2A23]
                                  hover:bg-[#EAD39C]
                                  transition-all duration-200
                                "
                              >
                                <MessageSquare className="w-4 h-4" />
                                Message
                              </Button>
                            </a>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              No Phone
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
