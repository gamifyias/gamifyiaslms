"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Trophy, Settings, LogOut, Zap, Scroll, Flame, Users2, BookOpen, User, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // fetch current student profile for header display
  const [fullName, setFullName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user?.id) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle()
        if (!mounted) return
        setFullName(profile?.full_name ?? null)
        setAvatarUrl(profile?.avatar_url ?? null)
      } catch (err) {
        // non-blocking
        console.warn("Error loading sidebar profile", err)
      }
    }
    loadProfile()
    return () => { mounted = false }
  }, [supabase])

  const handleLogout = async () => {
    const supabaseClient = createClient()
    await supabaseClient.auth.signOut()
    router.push("/auth/login")
  }

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Home",
      href: "/student/dashboard",
    },
    {
      icon: Scroll,
      label: "Quest Log",
      href: "/student/quest-log",
    },
    {
      icon: Flame,
      label: "Training Dojo",
      href: "/student/training-dojo",
    },
    {
      icon: BookOpen,
      label: "Subjects",
      href: "/student/subjects",
    },
    {
      icon: UserCheck,
      label: "Mentor",
      href: "/student/mentor",
    },
    {
      icon: Trophy,
      label: "Leaderboard",
      href: "/student/leaderboard",
    },
    {
      icon: Settings,
      label: "Profile",
      href: "/student/profile",
    },
  ]

  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/student/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">Gamify IAS Academy</h1>
            <p className="text-xs text-sidebar-accent">Student Panel</p>
          </div>
        </Link>

        {/* Student profile snippet */}
        <div className="mt-4 flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName ?? "Student"} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}
          <a href="/student/profile" className="block w-full text-left">
            <div className="text-sm font-medium">{fullName ?? "Student"}</div>
            <div className="text-xs text-muted-foreground">Student</div>
          </a>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button onClick={handleLogout} variant="outline" className="w-full justify-start gap-2 bg-transparent">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
