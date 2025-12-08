"use client";
export const dynamic = "force-dynamic";



import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      } else {
        setUser(user)
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (profile?.role) {
          setRole(profile.role)
          // Auto redirect if role is already set
          const redirectPath = profile.role === "admin" ? "/admin" : profile.role === "mentor" ? "/mentor" : "/student"
          router.push(redirectPath)
          return
        }
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
          role: role,
          full_name: user?.user_metadata?.full_name,
        },
      })

      if (error) throw error

      // Update profile in database
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user?.id,
          full_name: user?.user_metadata?.full_name || user?.email,
          email: user?.email,
          role: role,
        },
        { onConflict: "id" },
      )

      if (profileError) throw profileError

      if (role === "mentor") {
        const { error: mentorError } = await supabase.from("mentor_profiles").upsert(
          {
            id: user?.id,
            profile_id: user?.id,
            specialization: "UPSC",
          },
          { onConflict: "id" },
        )
        if (mentorError) throw mentorError
      } else if (role === "student") {
        const { error: studentError } = await supabase.from("student_profiles").upsert(
          {
            id: user?.id,
            profile_id: user?.id,
          },
          { onConflict: "id" },
        )
        if (studentError) throw studentError
      }

      toast({
        title: "Welcome to UPSC Elite!",
        description: `You've been set up as a ${role}. Redirecting to your dashboard...`,
      })

      const redirectPath = role === "admin" ? "/admin" : role === "mentor" ? "/mentor" : "/student"
      setTimeout(() => {
        router.push(redirectPath)
      }, 500)
    } catch (error: unknown) {
      console.error("[v0] Error in role selection:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-8">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to Gamify IAS Academy

            </h1>
            <p className="text-lg text-muted-foreground">Choose your role to get started</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                id: "student" as const,
                title: "Student",
                description: "Prepare for UPSC with gamified learning",
                icon: "📚",
                features: ["Practice tests", "Track progress", "Earn badges", "Leaderboards"],
              },
              {
                id: "mentor" as const,
                title: "Mentor",
                description: "Guide students in their preparation",
                icon: "👨‍🏫",
                features: ["Manage students", "Create content", "Track performance", "Ratings"],
              },
              {
                id: "admin" as const,
                title: "Administrator",
                description: "Manage platform and users",
                icon: "⚙️",
                features: ["User management", "Content moderation", "Analytics", "System settings"],
              },
            ].map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all border-2 ${
                  role === option.id ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/50"
                }`}
                onClick={() => setRole(option.id)}
              >
                <CardHeader>
                  <div className="text-4xl mb-2">{option.icon}</div>
                  <CardTitle>{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {option.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={handleRoleSelection} disabled={isLoading} size="lg" className="w-full">
            {isLoading ? "Setting up..." : `Continue as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
