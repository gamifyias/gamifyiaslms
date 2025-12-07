"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Scroll, 
  Settings,
  Gamepad2,
  LogOut, 
  Zap,
  Trophy,
  BookOpen, 
  User,
} from "lucide-react"
import {Users2,} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function MentorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // fetch mentor profile for header
  const [fullName, setFullName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const loadProfile = async () => {
      try {
        const { data: { user }} = await supabase.auth.getUser()
        if (!user?.id) return

        // Fetch mentor profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle()

        if (!mounted) return

        setFullName(profile?.full_name ?? "Mentor")
        setAvatarUrl(profile?.avatar_url ?? null)
      } catch (err) {
        console.warn("Error loading mentor profile", err)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  // MENTOR MENU
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Home",
      href: "/mentor/home",
    },
    {
      icon: Gamepad2,
      label: "Command Center",
      href: "/mentor/command-center/",
    },
    {
      icon: Users,
      label: "My Students",
      href: "/mentor/yourstudents",
    },
    {
      icon: Users2,
      label: "All Students",
      href: "/mentor/students",
    },
    {
      icon: BookOpen,
      label: "Subjects & Topics",
      href: "/mentor/subjects",
    },
    {
      icon: Trophy,
      label: "Daily Leaderboard",
      href: "/mentor/leaderboard",
    },
    {
      icon: Settings,
      label: "Profile",
      href: "/mentor/profile",
    },
  ]

  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen">
      
      {/* Logo + Role Header */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/mentor/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">Gamify IAS Academy</h1>
            <p className="text-xs text-sidebar-accent">Mentor Panel</p>
          </div>
        </Link>

        {/* Mentor Profile Snippet */}
        <div className="mt-4 flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName ?? "Mentor"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}

          <a href="/mentor/profile" className="block w-full text-left">
            <div className="text-sm font-medium">{fullName ?? "Mentor"}</div>
            <div className="text-xs text-muted-foreground">Mentor</div>
          </a>
        </div>
      </div>

      {/* Sidebar Menu */}
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

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
