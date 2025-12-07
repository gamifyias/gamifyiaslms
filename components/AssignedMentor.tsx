"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, PhoneCall, User } from "lucide-react"

interface MentorInfo {
  mentor_id: string
  full_name: string
  avatar_url?: string
  specialization?: string
  years_of_experience?: number
  contact_whatsapp?: string
  email?: string
}

export function AssignedMentor({ studentId }: { studentId: string }) {
  const supabase = createClient()
  const [mentor, setMentor] = useState<MentorInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadMentor = async () => {
      setLoading(true)
      setError(null)
      try {
        // 1) find active assignment
        const { data: assign, error: assignErr } = await supabase
          .from("student_mentor_assignments")
          .select("mentor_id")
          .eq("student_id", studentId)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle()

        if (assignErr) {
          console.warn("mentor assignment error", assignErr)
          if (!mounted) return
          setMentor(null)
          return
        }

        if (!assign?.mentor_id) {
          if (!mounted) return
          setMentor(null)
          return
        }

        const mentorId = assign.mentor_id

        // 2) fetch mentor_profiles and profiles
        const [{ data: mentorRow, error: mentorErr }, { data: profileRow, error: profileErr }] = await Promise.all([
          supabase
            .from("mentor_profiles")
            .select("mentor_id, specialization, years_of_experience, contact_whatsapp, email")
            .eq("mentor_id", mentorId)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", mentorId)
            .maybeSingle(),
        ])

        if (mentorErr) console.warn("mentor_profiles error", mentorErr)
        if (profileErr) console.warn("profiles error", profileErr)

        if (!mounted) return

        setMentor({
          mentor_id: mentorId,
          full_name: profileRow?.full_name ?? "Mentor",
          avatar_url: profileRow?.avatar_url,
          specialization: mentorRow?.specialization,
          years_of_experience: mentorRow?.years_of_experience,
          contact_whatsapp: mentorRow?.contact_whatsapp,
          email: mentorRow?.email,
        })
      } catch (err) {
        console.error("Error loading mentor", err)
        if (!mounted) return
        setError("Failed to load mentor")
        setMentor(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (studentId) loadMentor()
    return () => {
      mounted = false
    }
  }, [studentId, supabase])

  const messageMentor = () => {
    if (!mentor?.contact_whatsapp) return
    const phone = mentor.contact_whatsapp.replace(/\D/g, "")
    const url = `https://wa.me/${phone}`
    window.open(url, "_blank")
  }

  const requestCallback = async () => {
    if (!mentor) return
    setRequesting(true)
    try {
      const { error } = await supabase.from("mentor_requests").insert({
        student_id: studentId,
        mentor_id: mentor.mentor_id,
        requested_at: new Date().toISOString(),
        status: "pending",
      })
      if (error) throw error
      alert("Callback requested — mentor will contact you.")
    } catch (err) {
      console.error("Error requesting callback", err)
      alert("Failed to request callback.")
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Mentor</CardTitle>
      </CardHeader>
      <CardContent>
        {!mentor ? (
          <div className="text-sm text-muted-foreground">
            No mentor assigned yet.
            <div className="mt-3">
              <Badge variant="outline">No Mentor</Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {mentor.avatar_url ? (
                <img src={mentor.avatar_url} alt={mentor.full_name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><User className="w-6 h-6" /></div>
              )}
              <div>
                <div className="font-semibold">{mentor.full_name}</div>
                <div className="text-xs text-muted-foreground">{mentor.specialization ?? "General Mentor"}</div>
                <div className="text-xs text-muted-foreground">Experience: {mentor.years_of_experience ?? "—"} yrs</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="default" size="sm" onClick={messageMentor} disabled={!mentor.contact_whatsapp}>
                <MessageSquare className="w-4 h-4 mr-2" /> Message Mentor
              </Button>
              <Button variant="outline" size="sm" onClick={requestCallback} disabled={requesting}>
                <PhoneCall className="w-4 h-4 mr-2" /> Request Callback
              </Button>
              {mentor.email && (
                <a href={`mailto:${mentor.email}`} className="inline-block">
                  <Button size="sm">Email</Button>
                </a>
              )}
            </div>
          </div>
        )}
        {error && <div className="mt-3 text-xs text-destructive">{error}</div>}
      </CardContent>
    </Card>
  )
}
