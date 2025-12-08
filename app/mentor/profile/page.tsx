"use client";
export const dynamic = "force-dynamic";



import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save, Shield, User, Lock, FileChartColumn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MentorSidebar } from "@/components/mentor-sidebar"
import { useToast } from "@/components/ui/use-toast"

export default function MentorProfilePage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mentorId, setMentorId] = useState<string | null>(null)

  const [profile, setProfile] = useState<any>({})
  const [mentorProfile, setMentorProfile] = useState<any>({})
  const [dirty, setDirty] = useState<any>({})

  // ------------------------------------------------------------
  // LOAD DATA
  // ------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Not logged in")

        setMentorId(user.id)

        const [p, mp] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("mentor_profiles").select("*").eq("id", user.id).single(),
        ])

        if (p.error) throw p.error
        if (mp.error) throw mp.error

        setProfile(p.data)
        setMentorProfile(mp.data)

        setDirty({ ...p.data, ...mp.data })
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ------------------------------------------------------------
  // HANDLE CHANGE
  // ------------------------------------------------------------
  const handleChange = (field: string, value: any) => {
    setDirty((prev: any) => ({ ...prev, [field]: value }))
  }

  // ------------------------------------------------------------
  // SAVE CHANGES
  // ------------------------------------------------------------
  const save = async () => {
    if (!mentorId) return
    setSaving(true)

    try {
      const {
        full_name,
        bio,
        phone,
        avatar_url,
        specialization,
        years_of_experience,
        availability
      } = dirty

      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          full_name,
          bio,
          phone,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mentorId)

      if (pErr) throw pErr

      const { error: mErr } = await supabase
        .from("mentor_profiles")
        .update({
          specialization,
          years_of_experience,
          availability
        })
        .eq("id", mentorId)

      if (mErr) throw mErr

      toast({
        title: "Saved!",
        description: "Your mentor profile has been updated.",
        className: "bg-green-200 text-green-900",
      })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // ------------------------------------------------------------
  // LOADING STATE
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <MentorSidebar />

      <div className="flex-1 overflow-y-auto bg-muted/40 p-8">
        
        {/* PAGE HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Your Mentor Profile</h1>
          <p className="text-muted-foreground">
            Update your personal information and mentor experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileChartColumn className="w-5 h-5" />
                  Mentor Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* <p>Total Students: <b>{mentorProfile.total_students || 0}</b></p> */}
                <p>Rating: <b>{mentorProfile.rating || 5} ⭐</b></p>
                <p>Experience: <b>{mentorProfile.years_of_experience || 0} years</b></p>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Button
                  variant="outline"
                  onClick={() => supabase.auth.signOut()}
                  className="w-full"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN */}
          <div className="md:col-span-2 space-y-8">

            {/* Profile Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">

                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={dirty.full_name || ""}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    value={dirty.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={dirty.bio || ""}
                    onChange={(e) => handleChange("bio", e.target.value)}
                  />
                </div>

              </CardContent>
            </Card>

            {/* Mentor Specific Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Mentor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div>
                  <label className="text-sm font-medium">Specialization</label>
                  <Input
                    value={dirty.specialization || ""}
                    onChange={(e) => handleChange("specialization", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Years of Experience</label>
                  <Input
                    type="number"
                    value={dirty.years_of_experience || ""}
                    onChange={(e) => handleChange("years_of_experience", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Availability</label>
                  <Input
                    value={dirty.availability || ""}
                    onChange={(e) => handleChange("availability", e.target.value)}
                  />
                </div>

              </CardContent>
            </Card>

          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="fixed bottom-8 right-8">
          <Button
            onClick={save}
            size="lg"
            className="gap-2 shadow-lg"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
