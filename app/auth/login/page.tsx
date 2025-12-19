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
import { AlertCircle, Shield } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      setTimeout(() => {
        router.push("/auth/welcome")
      }, 500)
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Authentication failed."
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0F131A] text-[#E9ECF2]">
      <div className="w-full max-w-md space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#8B93A7]">
            Secure Access
          </p>
          <h1 className="text-3xl font-semibold text-[#C8A24A]">
            Gamify IAS
            <span className="block text-[#E9ECF2] mt-1">
              Academy
            </span>
          </h1>
          <p className="text-sm text-[#B5BDCF]">
            Sign in to continue your preparation journey.
          </p>
        </div>

        {/* LOGIN CARD */}
        <Card className="bg-[#161B26] border border-[#2A3042]">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg text-[#E9ECF2]">
              <Shield className="h-5 w-5 text-[#C8A24A]" />
              Login
            </CardTitle>
            <p className="text-sm text-[#8B93A7]">
              Authorized users only.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* EMAIL */}
              <div className="space-y-1">
                <Label
                  htmlFor="email"
                  className="text-sm text-[#B5BDCF]"
                >
                  Email
                </Label>
                <Input
                  id="email"
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
                <Label
                  htmlFor="password"
                  className="text-sm text-[#B5BDCF]"
                >
                  Password
                </Label>
                <Input
                  id="password"
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
                className="
                  w-full
                  bg-[#C8A24A]
                  text-[#0F131A]
                  hover:bg-[#D8B45C]
                "
              >
                {isLoading ? "Signing In..." : "Login"}
              </Button>

              <p className="text-center text-sm text-[#8B93A7]">
                Don’t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-[#C8A24A] hover:underline"
                >
                  Create one
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <p className="text-xs text-center text-[#7C8599]">
          Secure access protected by platform policies.
        </p>
      </div>
    </div>
  )
}
