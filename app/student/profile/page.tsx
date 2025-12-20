"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { StudentSidebar } from "@/components/student-sidebar"

import { ProfileHeader } from "@/components/student-profile/profile-header"
import { ProfileForm } from "@/components/student-profile/profile-form"
import { MentorCard } from "@/components/student-profile/mentor-card"
import { SecuritySettings } from "@/components/student-profile/security-settings"

export default function StudentProfilePage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)

  // Single source of truth
  const [dirtyProfile, setDirtyProfile] = useState<any>({})

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error("Not logged in")

        setStudentId(user.id)

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) throw profileError

        const { data: studentProfile, error: studentProfileError } =
          await supabase
            .from("student_profiles")
            .select("*")
            .eq("id", user.id)
            .single()

        if (studentProfileError) throw studentProfileError

        setDirtyProfile({
          ...profile,
          preferred_subjects: studentProfile?.preferred_subjects || [],
        })
      } catch (e: any) {
        toast({
          title: "Failed to load profile",
          description: e.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [supabase, toast])

  /* ---------------- SAVE PROFILE ---------------- */
  const handleSave = async () => {
    if (!studentId) return
    setSaving(true)

    try {
      const {
        full_name,
        bio,
        phone,
        avatar_url,
        preferred_subjects,
      } = dirtyProfile

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name,
          bio,
          phone,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)

      if (profileError) throw profileError

      const { error: studentProfileError } = await supabase
        .from("student_profiles")
        .update({ preferred_subjects })
        .eq("id", studentId)

      if (studentProfileError) throw studentProfileError

      toast({
        title: "Profile saved",
        description: "Your changes have been saved successfully.",
      })
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F6E7C1]">
      <StudentSidebar />

      <div className="flex-1 overflow-y-auto px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* PROFILE HEADER (handles avatar upload itself) */}
          <ProfileHeader
            profile={dirtyProfile}
            onProfileChange={(data) =>
              setDirtyProfile((prev: any) => ({ ...prev, ...data }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <aside className="space-y-6">
              <MentorCard studentId={studentId!} />
              <SecuritySettings />
            </aside>

            <section className="md:col-span-2">
              <ProfileForm
                profile={dirtyProfile}
                studentProfile={dirtyProfile}
                onProfileChange={(data) =>
                  setDirtyProfile((prev: any) => ({ ...prev, ...data }))
                }
              />
            </section>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="fixed bottom-6 right-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Save All Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
