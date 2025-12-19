"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import {
  Home,
  Radar,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Users,
  Library,
  BarChart3,
  UserCog,
  Menu,
  LogOut,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MentorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      setFullName(data?.full_name ?? "Mentor")
      setAvatarUrl(data?.avatar_url ?? null)
    }

    load()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const menu = [
    { icon: Home, label: "Home", href: "/mentor/home" },
    { icon: Radar, label: "Command Center", href: "/mentor/command-center" },
    { icon: ShieldCheck, label: "Manage Roles", href: "/mentor/manage-roles" },
    { icon: UserPlus, label: "Assign Mentors", href: "/mentor/assign-mentor" },
    { icon: UserCheck, label: "My Students", href: "/mentor/yourstudents" },
    { icon: Users, label: "All Students", href: "/mentor/students" },
    { icon: Library, label: "Subjects & Topics", href: "/mentor/subjects" },
    { icon: BarChart3, label: "Leaderboard", href: "/mentor/leaderboard" },
    { icon: UserCog, label: "Profile", href: "/mentor/profile" },
  ]

  const SidebarContent = () => (
    <div
      className="
        flex flex-col h-full w-64
        bg-[#F2DEB3] text-[#3B2A23]
        border-r-2 border-[#8B5A2B]
        animate-in fade-in duration-300
      "
    >
      {/* HEADER */}
      <div className="p-5 border-b-2 border-[#8B5A2B]">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#3B2A23]"
            />
          ) : (
            <div className="w-10 h-10 border-2 border-[#3B2A23] rounded-full flex items-center justify-center bg-[#EAD39C]">
              <User className="w-5 h-5" />
            </div>
          )}

          <div>
            <p className="font-semibold leading-tight">{fullName}</p>
            <p className="text-xs opacity-80">Mentor Panel</p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/")

          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  `
                  w-full flex items-center gap-3 px-3 py-2 text-sm text-left
                  border-2
                  transition-all duration-200 ease-out
                  `,
                  active
                    ? "bg-[#EAD39C] border-[#3B2A23] font-semibold translate-x-[2px]"
                    : "bg-[#F6E7C1] border-[#8B5A2B] hover:bg-[#EAD39C] hover:translate-x-[2px]"
                )}
              >
                <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-105" />
                {item.label}
              </button>
            </Link>
          )
        })}
      </nav>

      {/* LOGOUT */}
      <div className="p-3 border-t-2 border-[#8B5A2B]">
        <Button
          onClick={logout}
          variant="outline"
          className="
            w-full border-2 border-[#3B2A23]
            transition-all duration-200
            hover:bg-[#EAD39C]
          "
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="
                bg-transparent
                hover:bg-black/5
                active:bg-black/10
                focus-visible:ring-0
              "
            >
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* SPACER */}
      <div className="h-14 md:hidden" />

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-64 h-screen sticky top-0">
        <SidebarContent />
      </div>
    </>
  )
}
