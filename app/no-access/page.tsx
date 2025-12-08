"use client";


import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function NoAccess() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
          Access Denied
        </h1>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Your account is pending approval from an administrator.
        </p>
        <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
          Please check back later.
        </p>
        <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
          <a href="" className="text-blue-500 dark:text-blue-400">
            Contact Admin
          </a>
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>
    </div>
  )
}
