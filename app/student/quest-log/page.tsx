export const dynamic = "force-dynamic";

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { QuestLog } from "@/components/QuestLog"
import { StudentSidebar } from "@/components/student-sidebar"

export default function QuestLogPage() {
  const [studentId, setStudentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getStudentId = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user?.id) {
          setStudentId(user.id)
        }
      } catch (err) {
        console.error("Error getting student ID:", err)
      } finally {
        setLoading(false)
      }
    }

    getStudentId()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!studentId) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 flex justify-center items-center text-destructive">
          Failed to load student ID
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <StudentSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <QuestLog studentId={studentId} />
        </div>
      </div>
    </div>
  )
}
