"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import {
  LayoutDashboard,
  Users,
  LogOut,
  Zap,
  User,
  BookOpen,
  Users2,
  Menu,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Fetch admin profile
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      setFullName(data?.full_name ?? "Admin")
      setAvatarUrl(data?.avatar_url ?? null)
    }

    load()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const menu = [
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
    {
      icon: BookOpen,
      label: "Subjects & Topics",
      href: "/admin/subjects",
    },
  ]

  // --- SIDEBAR CONTENT (Reusable for Desktop + Mobile) ---
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">

      {/* HEADER */}
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

        {/* Profile */}
        <div className="mt-4 flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}

          <a href="/admin/settings" className="block">
            <div className="text-sm font-medium">{fullName}</div>
            <div className="text-xs text-muted-foreground">Administrator</div>
          </a>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + "/")

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
        <Button onClick={logout} variant="outline" className="w-full gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        
        {/* HAMBURGER BUTTON */}
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

        <h1 className="font-semibold text-lg">Admin Panel</h1>
      </div>

      {/* SPACER (to avoid overlap) */}
      <div className="h-14 md:hidden"></div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-64 h-screen sticky top-0">
        <SidebarContent />
      </div>
    </>
  )
}
