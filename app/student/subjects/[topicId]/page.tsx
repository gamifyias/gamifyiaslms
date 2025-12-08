"use client"

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { TopicPage } from "@/components/TopicPage"
import { StudentSidebar } from "@/components/student-sidebar"

export default function TopicDetailPage() {
  const params = useParams()
  const topicId = params?.topicId as string
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

  if (!studentId || !topicId) {
    return (
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 flex justify-center items-center text-destructive">
          Missing required parameters
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <StudentSidebar />
      <TopicPage topicId={topicId} studentId={studentId} showSidebar={false} />
    </div>
  )
}
