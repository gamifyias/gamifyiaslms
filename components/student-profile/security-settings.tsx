"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, LogOut } from "lucide-react"

export function SecuritySettings() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isLogoutLoading, setIsLogoutLoading] = useState(false)

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Please use a password with at least 6 characters.",
        variant: "destructive",
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both password fields are identical.",
        variant: "destructive",
      })
      return
    }

    setIsPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      })
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Password Update Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLogoutLoading(true)
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        router.push('/auth/login') // Redirect to login after logout
    } catch (error: any) {
        toast({
            title: "Logout Failed",
            description: error.message,
            variant: "destructive",
        })
    } finally {
        setIsLogoutLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Manage your password and session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Change Password</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <Button onClick={handleUpdatePassword} disabled={isPasswordLoading}>
            {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </div>

        <div className="space-y-2 pt-6 border-t">
           <h4 className="font-semibold">Log Out</h4>
            <p className="text-sm text-muted-foreground">End your current session on this device.</p>
            <Button variant="destructive" onClick={handleLogout} disabled={isLogoutLoading}>
                {isLogoutLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                )}
                Log Out
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}
