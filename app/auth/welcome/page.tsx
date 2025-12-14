"use client"
export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

type UserRole = "student" | "mentor" | "admin"

export default function WelcomePage() {
  const [role, setRole] = useState<UserRole>("student")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role) {
        if (profile.role === "null") {
          router.push("/no-access");
          return;
        }
        
        const redirectPath =
          profile.role === "admin"
            ? "/admin"
            : profile.role === "mentor"
            ? "/mentor/home"
            : "/student/dashboard"

        router.push(redirectPath)
        return
      }

      setIsCheckingAuth(false)
    }

    checkUser()
  }, [router])

  const handleRoleSelection = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          role,
          full_name: user?.user_metadata?.full_name,
        },
      })
      if (error) throw error

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: user?.user_metadata?.full_name || user.email,
          email: user.email,
          role,
        },
        { onConflict: "id" },
      )
      if (profileError) throw profileError

      if (role === "mentor") {
        const { error } = await supabase.from("mentor_profiles").upsert(
          {
            id: user.id,
            profile_id: user.id,
            specialization: "UPSC",
          },
          { onConflict: "id" },
        )
        if (error) throw error
      }

      if (role === "student") {
        const { error } = await supabase.from("student_profiles").upsert(
          {
            id: user.id,
            profile_id: user.id,
          },
          { onConflict: "id" },
        )
        if (error) throw error
      }

      toast({
        title: "⚔️ Oath Accepted",
        description: `You have entered the realm as a ${role}.`,
      })

      const redirectPath =
        role === "admin"
          ? "/admin"
          : role === "mentor"
          ? "/mentor/home"
          : "/student/dashboard"

      setTimeout(() => {
        router.push(redirectPath)
      }, 600)
    } catch (err: any) {
      toast({
        title: "⚠️ Ritual Failed",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6E7C1] text-[#3B2A23]">
        <p className="text-lg">Preparing the Realm...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F6E7C1] text-[#3B2A23]">
      <div className="w-full max-w-5xl space-y-10">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <p className="uppercase tracking-widest text-sm">
            🏰 Choose Your Path
          </p>
          <h1 className="text-4xl font-bold">
            Enter the Realm of
            <span className="block text-[#8B5A2B]">
              Gamify IAS Academy
            </span>
          </h1>
          <p>Select your destiny to begin.</p>
        </div>

        {/* ROLE CARDS */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              id: "student" as const,
              title: "Student",
              icon: "📜",
              desc: "Train, battle trials, and rise through levels.",
              features: ["Trials", "XP & Levels", "Leaderboards"],
            },
            {
              id: "mentor" as const,
              title: "Mentor",
              icon: "🧙",
              desc: "Guide warriors and command the guild.",
              features: ["Create Trials", "Track Students", "Insights"],
            },
            {
              id: "admin" as const,
              title: "Game Master",
              icon: "👑",
              desc: "Rule the realm and maintain balance.",
              features: ["Users", "Systems", "Analytics"],
            },
          ].map((opt) => (
            <Card
              key={opt.id}
              onClick={() => setRole(opt.id)}
              className={`cursor-pointer border-2 ${
                role === opt.id
                  ? "border-[#3B2A23] bg-[#EAD39C]"
                  : "border-[#8B5A2B] bg-[#F2DEB3]"
              }`}
            >
              <CardHeader>
                <div className="text-4xl">{opt.icon}</div>
                <CardTitle>{opt.title}</CardTitle>
                <p className="text-sm">{opt.desc}</p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {opt.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CONTINUE */}
        <Button
          size="lg"
          disabled={isLoading}
          onClick={handleRoleSelection}
          className="w-full border-2 border-[#3B2A23] bg-[#C47A2C] text-[#3B2A23]"
        >
          {isLoading
            ? "Sealing Your Fate..."
            : `Continue as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
        </Button>
      </div>
    </div>
  )
}
