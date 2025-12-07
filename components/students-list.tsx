"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users } from "lucide-react"
import Link from "next/link"

interface Student {
  id: string
  full_name: string
  email: string
  phone: string | null
  current_level: number
}

export function StudentsList() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

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
          .eq("role", "student")
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
        console.error("Error loading students:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="w-8 h-8" />
          All Students
        </h2>
        <p className="text-muted-foreground mt-2">
          View all students enrolled in the academy
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Total: {students.length} students enrolled</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading students...</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Level</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={student.id} className="hover:bg-secondary/50 transition-colors">
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                        <TableCell className="text-sm">{student.phone ?? "Not provided"}</TableCell>

                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                            Level {student.current_level}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
