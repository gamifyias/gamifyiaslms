"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare, User } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface MentorCardProps {
  studentId: string
}

interface MentorInfo {
  full_name: string
  avatar_url: string
  specialization: string
  years_of_experience: number
  phone: string | null
}

export function MentorCard({ studentId }: MentorCardProps) {
  const [mentor, setMentor] = useState<MentorInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMentor = async () => {
      if (!studentId) return

      const supabase = createClient()
      setLoading(true)
      
      try {
        // Get active mentor assignment
        const { data: assignment, error: assignmentError } = await supabase
          .from("student_mentor_assignments")
          .select("mentor_id")
          .eq("student_id", studentId)
          .eq("is_active", true)
          .single()

        if (assignmentError || !assignment) {
          setMentor(null)
          return
        }

        const mentorId = assignment.mentor_id

        // Fetch mentor info including PHONE
        const { data: mentorData, error: mentorError } = await supabase
          .from("profiles")
          .select(`
            full_name,
            avatar_url,
            phone,
            mentor_profiles (
              specialization,
              years_of_experience
            )
          `)
          .eq("id", mentorId)
          .single()
        
        if (mentorError) throw mentorError
        
        const mentorProfile = mentorData.mentor_profiles[0] || {}

        setMentor({
          full_name: mentorData.full_name,
          avatar_url: mentorData.avatar_url,
          phone: mentorData.phone || null,
          specialization: mentorProfile.specialization || "N/A",
          years_of_experience: mentorProfile.years_of_experience || 0,
        })

      } catch (error) {
        console.error("Error fetching mentor:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMentor()
  }, [studentId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Mentor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Mentor</CardTitle>
        <CardDescription>Guidance on your UPSC journey.</CardDescription>
      </CardHeader>
      <CardContent>
        {mentor ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={mentor.avatar_url} alt={mentor.full_name} />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{mentor.full_name}</h3>
                <p className="text-sm text-muted-foreground">{mentor.specialization}</p>
                <p className="text-xs text-muted-foreground">{mentor.years_of_experience} years experience</p>
              </div>
            </div>

            {/* WhatsApp Message Button */}
            {mentor.phone ? (
              <a 
                href={`https://wa.me/${mentor.phone}`} 
                target="_blank" 
                className="block"
              >
                <Button className="w-full gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message Mentor
                </Button>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                Mentor has not added a phone number.
              </p>
            )}

          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No mentor assigned yet.</p>
            <Button variant="outline" size="sm" className="mt-4">Request a Mentor</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
