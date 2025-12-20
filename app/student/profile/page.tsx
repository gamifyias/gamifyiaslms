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

/* ---------------- IMAGE COMPRESSION ---------------- */
async function compressImage(file: File): Promise<File> {
  if (file.size <= 2 * 1024 * 1024) return file // <= 2MB

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas")

  const MAX = 512
  const scale = Math.min(MAX / bitmap.width, MAX / bitmap.height)

  canvas.width = bitmap.width * scale
  canvas.height = bitmap.height * scale

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.7)
  )

  return new File([blob], "avatar.jpg", { type: "image/jpeg" })
}

export default function StudentProfilePage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)

  const [dirtyProfile, setDirtyProfile] = useState<any>({})
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Not logged in")

        setStudentId(user.id)

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        setDirtyProfile({
          ...profile,
          preferred_subjects: studentProfile?.preferred_subjects || [],
        })

        if (profile?.avatar_url) {
          const { data } = await supabase.storage
            .from("avatars")
            .createSignedUrl(profile.avatar_url, 60 * 60)

          setAvatarUrl(data?.signedUrl || null)
        }
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
  }, [])

  /* ---------------- AVATAR UPLOAD ---------------- */
  const handleAvatarUpload = async (file: File) => {
    if (!studentId) return

    try {
      const compressed = await compressImage(file)
      const path = `${studentId}/avatar.png`

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, {
          upsert: true,
          contentType: compressed.type,
        })

      if (error) throw error

      const { data } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60)

      setAvatarUrl(data?.signedUrl || null)
      setDirtyProfile((p: any) => ({ ...p, avatar_url: path }))

      toast({ title: "Avatar uploaded" })
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e.message,
        variant: "destructive",
      })
    }
  }

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!studentId) return
    setSaving(true)

    try {
      const { full_name, bio, phone, avatar_url, preferred_subjects } = dirtyProfile

      await supabase
        .from("profiles")
        .update({
          full_name,
          bio,
          phone,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)

      await supabase
        .from("student_profiles")
        .update({ preferred_subjects })
        .eq("id", studentId)

      toast({ title: "Profile saved" })
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

          <ProfileHeader
            profile={dirtyProfile}
            avatarUrl={avatarUrl}
            onAvatarUpload={handleAvatarUpload}
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
                onProfileChange={(d) =>
                  setDirtyProfile((p: any) => ({ ...p, ...d }))
                }
              />
            </section>
          </div>
        </div>

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
