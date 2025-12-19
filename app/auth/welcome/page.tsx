"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type UserRole = "student" | "mentor" | "admin"

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [role, setRole] = useState<UserRole | "null">("null")
  const [profileId, setProfileId] = useState("")

  // profile fields
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")

  // mentor-only fields
  const [specialization, setSpecialization] = useState("")
  const [experience, setExperience] = useState("")

  const [missing, setMissing] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      // ROLE NULL → HARD BLOCK
      if (!profile || profile.role === "null") {
        router.push("/no-access")
        return
      }

      setRole(profile.role)
      setProfileId(profile.id)
      setPhone(profile.phone || "")
      setBio(profile.bio || "")

      const missingFields: string[] = []

      if (!profile.phone) missingFields.push("Phone number")
      if (!profile.bio) missingFields.push("Bio")

      if (profile.role === "mentor") {
        const { data: mentor } = await supabase
          .from("mentor_profiles")
          .select("*")
          .eq("id", profile.id)
          .single()

        if (mentor) {
          setSpecialization(mentor.specialization || "")
          setExperience(
            mentor.years_of_experience?.toString() || ""
          )

          if (!mentor.specialization)
            missingFields.push("Specialization")
          if (!mentor.years_of_experience)
            missingFields.push("Experience")
        } else {
          // mentor row missing entirely
          missingFields.push("Specialization", "Experience")
        }
      }

      // ✅ PROFILE COMPLETE → REDIRECT, DO NOT SHOW PAGE
      if (missingFields.length === 0) {
        const redirect =
          profile.role === "admin"
            ? "/admin"
            : profile.role === "mentor"
            ? "/mentor/home"
            : "/student/dashboard"

        router.push(redirect)
        return
      }

      // ❌ PROFILE INCOMPLETE → SHOW PAGE
      setMissing(missingFields)
      setLoading(false)
    }

    init()
  }, [router, supabase])

  const handleSave = async () => {
    setSaving(true)

    await supabase
      .from("profiles")
      .update({
        phone,
        bio,
        updated_at: new Date(),
      })
      .eq("id", profileId)

    if (role === "mentor") {
      await supabase.from("mentor_profiles").upsert(
        {
          id: profileId,
          profile_id: profileId,
          specialization,
          years_of_experience: experience
            ? Number(experience)
            : null,
        },
        { onConflict: "id" }
      )
    }

    router.refresh()
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F131A] text-[#E9ECF2]">
        Preparing your campaign…
      </div>
    )
  }

  const redirect =
    role === "admin"
      ? "/admin"
      : role === "mentor"
      ? "/mentor/home"
      : "/student/dashboard"

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0F131A] text-[#E9ECF2]">
      <motion.div
        initial="hidden"
        animate="visible"
        className="max-w-4xl w-full space-y-10"
      >
        {/* HEADER */}
        <motion.div variants={fadeUp} className="text-center space-y-4">
          <h1 className="text-4xl font-semibold text-[#C8A24A]">
            Complete Your Profile
          </h1>
          <p className="text-[#B5BDCF]">
            Some required information is missing.
            You can complete it now or skip for later.
          </p>
        </motion.div>

        {/* FORM */}
        <motion.div variants={fadeUp}>
          <Card className="bg-[#161B26] border border-[#2A3042]">
            <CardHeader>
              <CardTitle className="text-[white]">Required Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input className="text-[white]"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Textarea className="text-[white]"
                placeholder="Short bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              {role === "mentor" && (
                <>
                  <Input className="text-[white]"
                    placeholder="Specialization"
                    value={specialization}
                    onChange={(e) =>
                      setSpecialization(e.target.value)
                    }
                  />
                  <Input className="text-[white]"
                    placeholder="Years of experience"
                    type="number"
                    value={experience}
                    onChange={(e) =>
                      setExperience(e.target.value)
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ACTIONS */}
        <motion.div variants={fadeUp} className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#C8A24A] text-[#0F131A]"
          >
            {saving ? "Saving..." : "Save Details"}
          </Button>

          <Button
            variant="outline"
            className="border-[#2A3042] text-[black]"
            onClick={() => router.push(redirect)}
          >
            Continue To Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
