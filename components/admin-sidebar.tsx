"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Zap,
  User,
  BookOpen,
  ShieldCheck,
  ClipboardList,
  Database,
  Users2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // admin profile header
  const [fullName, setFullName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        const { data: { user }} = await supabase.auth.getUser()
        if (!user?.id) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, role")
          .eq("id", user.id)
          .maybeSingle()

        if (!mounted) return

        setFullName(profile?.full_name ?? "Admin")
        setAvatarUrl(profile?.avatar_url ?? null)
      } catch (err) {
        console.warn("Error loading admin profile", err)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [])

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  // ADMIN MENU
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Admin Dashboard",
      href: "/admin/dashboard",
    },
    {
      icon: Users2,
      label: "User Management",
      href: "/admin/users",
    },
    {
      icon: Users,
      label: "Mentors",
      href: "/admin/mentors",
    },
    // {
    //   icon: ShieldCheck,
    //   label: "Security & RLS",
    //   href: "/admin/security",
    // },
    // {
    //   icon: Database,
    //   label: "Database Viewer",
    //   href: "/admin/database",
    // },
    {
      icon: BookOpen,
      label: "Subjects & Topics",
      href: "/admin/subjects",
    },
    // {
    //   icon: ClipboardList,
    //   label: "Logs / Activity",
    //   href: "/admin/logs",
    // },
    // {
    //   icon: Settings,
    //   label: "Settings",
    //   href: "/admin/settings",
    // },
  ]

  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen">

      {/* Logo + Role Header */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-red-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">Gamify IAS Academy</h1>
            <p className="text-xs text-sidebar-accent">Admin Panel</p>
          </div>
        </Link>

        {/* Admin Profile Snippet */}
        <div className="mt-4 flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName ?? "Admin"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}

          <a href="/admin/settings" className="block w-full text-left">
            <div className="text-sm font-medium">{fullName ?? "Admin"}</div>
            <div className="text-xs text-muted-foreground">Administrator</div>
          </a>
        </div>
      </div>

      {/* Sidebar Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive &&
                    "bg-sidebar-primary text-sidebar-primary-foreground"
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
