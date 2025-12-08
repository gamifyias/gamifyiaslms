"use client";
export const dynamic = "force-dynamic";



import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AssignedMentor } from "@/components/AssignedMentor"
import { Loader2 } from "lucide-react"
import { StudentSidebar } from "@/components/student-sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function AssignedMentorPage() {
  const [studentId, setStudentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setStudentId(data?.user?.id ?? null)
      } catch (err) {
        console.error("Error getting user", err)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!studentId) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">Failed to load student</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <StudentSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Your Mentor</h1>
              <p className="text-sm text-muted-foreground">Contact and manage your assigned mentor</p>
            </div>
            <Link href="/student">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
          </div>

          <AssignedMentor studentId={studentId} />
        </div>
      </div>
    </div>
  )
}
