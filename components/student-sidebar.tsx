"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import {
  LayoutDashboard,
  Trophy,
  Settings,
  LogOut,
  Zap,
  Scroll,
  Flame,
  BookOpen,
  User,
  UserCheck,
  Menu,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // PROFILE DATA
  const [fullName, setFullName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      setFullName(data?.full_name ?? "Student")
      setAvatarUrl(data?.avatar_url ?? null)
    }

    load()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const menu = [
    { icon: LayoutDashboard, label: "Home", href: "/student/dashboard" },
    { icon: Scroll, label: "Quest Log", href: "/student/quest-log" },
    { icon: Flame, label: "Training Dojo", href: "/student/training-dojo" },
    { icon: BookOpen, label: "Subjects", href: "/student/subjects" },
    { icon: UserCheck, label: "Mentor", href: "/student/mentor" },
    { icon: Trophy, label: "Leaderboard", href: "/student/leaderboard" },
    { icon: Settings, label: "Profile", href: "/student/profile" },
  ]

  // SIDEBAR CONTENT
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      
      {/* HEADER */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}

          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">Student Panel</p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  active && "bg-sidebar-primary text-sidebar-primary-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* LOGOUT */}
      <div className="p-4 border-t border-sidebar-border">
        <Button className="w-full gap-2" variant="outline" onClick={logout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* MOBILE TOP NAV */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <h1 className="font-semibold text-lg">Student Panel</h1>
      </div>

      {/* SPACER (to avoid content hiding behind nav) */}
      <div className="h-14 md:hidden"></div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-64 h-screen sticky top-0">
        <SidebarContent />
      </div>
    </>
  )
}
