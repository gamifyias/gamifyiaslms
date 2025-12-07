"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, User, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ProfileHeaderProps {
  profile: {
    id: string
    full_name: string
    email: string
    avatar_url: string
  }
  onProfileChange: (data: { full_name?: string; avatar_url?: string }) => void
}

export function ProfileHeader({ profile, onProfileChange }: ProfileHeaderProps) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath)
      
      if (!publicUrl) {
         throw new Error("Could not get public URL for avatar.")
      }
      
      // Update the parent state
      onProfileChange({ avatar_url: publicUrl })

      toast({
        title: "Avatar updated!",
        description: "Your new avatar has been set.",
      })

    } catch (error: any) {
      toast({
        title: "Avatar Upload Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      <div className="h-24 md:h-32 bg-gradient-to-r from-primary to-primary/80 rounded-t-lg" />
      <div className="px-4 py-6 sm:px-6 sm:py-8 bg-card border border-border rounded-b-lg">
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-16 sm:-mt-20">
          <div className="relative group w-28 h-28 sm:w-32 sm:h-32">
            <Avatar className="w-full h-full border-4 border-background">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="text-4xl">
                <User />
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 bg-black/50 flex items-center justify-center text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {/* {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )} */}
            </label>
            {/* <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            /> */}
          </div>
          <div className="mt-4 sm:mt-0 flex-1">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={profile.full_name || ""}
                  onChange={(e) => onProfileChange({ full_name: e.target.value })}
                  className="text-lg font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
