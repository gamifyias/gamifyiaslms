"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

export default function SignupPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/welcome`,
          data: {
            full_name: fullName,
            role: "student",
          },
        },
      })
      if (error) throw error
      router.push("/auth/signup-success")
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Signup failed"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0F131A] text-[#E9ECF2]">
      <div className="w-full max-w-md space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#8B93A7]">
            Create Your Account
          </p>

          <h1 className="text-3xl font-semibold text-[#C8A24A]">
            Gamify IAS
            <span className="block text-[#E9ECF2] mt-1">
              Academy
            </span>
          </h1>

          <p className="text-sm text-[#B5BDCF]">
            Begin your structured UPSC preparation journey.
          </p>
        </div>

        {/* CARD */}
        <Card className="bg-[#161B26] border border-[#2A3042]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg text-[#E9ECF2]">
              Sign Up
            </CardTitle>
            <p className="text-sm text-[#8B93A7]">
              Register as a student to continue.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {/* NAME */}
              <div className="space-y-1">
                <Label className="text-sm text-[#B5BDCF]">
                  Full Name
                </Label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="
                    bg-[#0F131A]
                    border border-[#2A3042]
                    text-[#E9ECF2]
                    placeholder:text-[#8B93A7]
                    focus:border-[#C8A24A]
                  "
                />
              </div>

              {/* EMAIL */}
              <div className="space-y-1">
                <Label className="text-sm text-[#B5BDCF]">
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    bg-[#0F131A]
                    border border-[#2A3042]
                    text-[#E9ECF2]
                    placeholder:text-[#8B93A7]
                    focus:border-[#C8A24A]
                  "
                />
              </div>

              {/* PASSWORD */}
              <div className="space-y-1">
                <Label className="text-sm text-[#B5BDCF]">
                  Password
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    bg-[#0F131A]
                    border border-[#2A3042]
                    text-[#E9ECF2]
                    placeholder:text-[#8B93A7]
                    focus:border-[#C8A24A]
                  "
                />
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-1">
                <Label className="text-sm text-[#B5BDCF]">
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="
                    bg-[#0F131A]
                    border border-[#2A3042]
                    text-[#E9ECF2]
                    placeholder:text-[#8B93A7]
                    focus:border-[#C8A24A]
                  "
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="flex gap-2 border border-[#7A2E2E] bg-[#2A1A1A] p-3 text-sm text-[#F2B8B5]">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* BUTTON */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C8A24A] text-[#0F131A] hover:bg-[#D8B45C]"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-[#8B93A7]">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-[#C8A24A] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <p className="text-xs text-center text-[#7C8599]">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
