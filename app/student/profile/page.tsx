export const dynamic = "force-dynamic";

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { StudentSidebar } from "@/components/student-sidebar"

// Import sub-components
import { ProfileHeader } from "@/components/student-profile/profile-header"
import { StatsCard } from "@/components/student-profile/stats-card"
import { ProfileForm } from "@/components/student-profile/profile-form"
import { MentorCard } from "@/components/student-profile/mentor-card"
import { SecuritySettings } from "@/components/student-profile/security-settings"


export default function StudentProfilePage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)
  
  // State for original, clean data
  const [profile, setProfile] = useState<any>(null)
  const [studentProfile, setStudentProfile] = useState<any>(null)

  // This will be the single source of truth for unsaved changes
  const [dirtyProfile, setDirtyProfile] = useState<any>({})

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error("User not found.")
        }
        setStudentId(user.id)

        const [profileRes, studentProfileRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('student_profiles').select('*').eq('id', user.id).single()
        ])

        if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error
        if (studentProfileRes.error && studentProfileRes.error.code !== 'PGRST116') throw studentProfileRes.error

        const fetchedProfile = profileRes.data || {}
        const fetchedStudentProfile = studentProfileRes.data || {}

        setProfile(fetchedProfile)
        setStudentProfile(fetchedStudentProfile)
        
        setDirtyProfile({
          ...fetchedProfile,
          preferred_subjects: fetchedStudentProfile.preferred_subjects || []
        });

      } catch (error: any) {
        toast({
          title: "Failed to load profile",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [supabase, toast])

  const handleProfileChange = (newData: any) => {
    setDirtyProfile((prev: any) => ({ ...prev, ...newData }))
  }

  const handleSaveChanges = async () => {
    if (!studentId) return;
    setIsSaving(true)
    try {
        const { full_name, bio, phone, avatar_url, preferred_subjects } = dirtyProfile;

        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name,
                bio,
                phone,
                avatar_url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', studentId);

        if (profileError) throw profileError;

        const { error: studentProfileError } = await supabase
            .from('student_profiles')
            .update({ preferred_subjects })
            .eq('id', studentId);

        if (studentProfileError) throw studentProfileError;

        toast({
            title: "Profile Saved!",
            description: "Your information has been successfully updated.",
            className: "bg-green-100 text-green-800"
        });

        setProfile(dirtyProfile);
        setStudentProfile((prev: any) => ({...prev, preferred_subjects}));

    } catch (error: any) {
        toast({
            title: "Error Saving Profile",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsSaving(false)
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile || !studentProfile || !studentId) {
     return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">Could not load student data. Please try logging in again.</p>
      </div>
    )
  }

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

    {/* Content Area */}
    <div className="flex-1 overflow-y-auto bg-muted/40">
      <div className="max-w-6xl mx-auto py-10 px-6">

        {/* Page Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal and academic information.
          </p>
        </header>

        {/* Main Grid */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Mentor + Security */}
          <aside className="space-y-8 md:col-span-1">
            <MentorCard studentId={studentId} />

            {/* Security Settings moved here */}
            <SecuritySettings />
          </aside>

          {/* RIGHT COLUMN: Main profile info */}
          <section className="space-y-8 md:col-span-2">
            <ProfileHeader
              profile={dirtyProfile}
              onProfileChange={handleProfileChange}
            />

            <ProfileForm
              profile={dirtyProfile}
              studentProfile={dirtyProfile}
              onProfileChange={handleProfileChange}
            />
          </section>

        </main>



      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="gap-2 shadow-xl"
          onClick={handleSaveChanges}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save All Changes
        </Button>
      </div>
    </div>
  </div>
)

}

