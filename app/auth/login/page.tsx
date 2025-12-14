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
      setError(error instanceof Error ? error.message : "The gate remains closed.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F6E7C1] text-[#3B2A23]">
      <div className="w-full max-w-md space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-widest">
            🛡️ Return to the Realm
          </p>
          <h1 className="text-3xl font-bold">
            Gamify IAS
            <span className="block text-[#8B5A2B]">Academy</span>
          </h1>
          <p className="text-sm">
            Present your credentials to the Guild Gate.
          </p>
        </div>

        {/* LOGIN CARD */}
        <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3]">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5" />
              Guild Gate
            </CardTitle>
            <p className="text-sm">
              Only registered warriors may enter.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">
                  Guild Scroll (Email)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="warrior@realm.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 border-[#8B5A2B] bg-[#F6E7C1]"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm">
                  Secret Rune (Password)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-2 border-[#8B5A2B] bg-[#F6E7C1]"
                />
              </div>

              {error && (
                <div className="flex gap-2 border-2 border-[#B84A3A] bg-[#F6D2C9] p-3 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full border-2 border-[#3B2A23] bg-[#C47A2C] text-[#3B2A23] hover:bg-[#B96C1E]"
              >
                {isLoading ? "Opening the Gate..." : "Enter the Realm"}
              </Button>

              <p className="text-center text-sm">
                New to the realm?{" "}
                <Link
                  href="/auth/signup"
                  className="font-semibold underline"
                >
                  Enlist as a Warrior
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <p className="text-xs text-center">
          By entering, you swear allegiance to the Guild Laws.
        </p>
      </div>
    </div>
  )
}
