"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, User, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ProfileHeaderProps {
  profile: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
  onProfileChange: (data: {
    full_name?: string
    avatar_url?: string
  }) => void
}

/* ---------- IMAGE COMPRESSION (> 2MB) ---------- */
async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= 2 * 1024 * 1024) return file

  const img = await createImageBitmap(file)
  const canvas = document.createElement("canvas")

  const MAX = 512
  const scale = Math.min(MAX / img.width, MAX / img.height)

  canvas.width = img.width * scale
  canvas.height = img.height * scale

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.7)
  )

  return new File([blob], "avatar.jpg", { type: "image/jpeg" })
}

export function ProfileHeader({ profile, onProfileChange }: ProfileHeaderProps) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true)

      const file = e.target.files?.[0]
      if (!file) throw new Error("No file selected")

      // 🔹 compress if needed
      const compressed = await compressIfNeeded(file)

      // 🔹 PUBLIC BUCKET PATH (RLS SAFE)
      const filePath = `${profile.id}/avatar.png`

      // 🔹 upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressed, {
          upsert: true,
          contentType: compressed.type,
        })

      if (uploadError) throw uploadError

      // 🔹 get PUBLIC URL
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      if (!data?.publicUrl) {
        throw new Error("Failed to get public avatar URL")
      }

      const publicUrl = data.publicUrl

      // 🔹 SAVE URL TO DATABASE (AUTOMATIC)
      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (dbError) throw dbError

      // 🔹 update parent state (instant UI update)
      onProfileChange({ avatar_url: publicUrl })

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Avatar upload failed",
        description: err.message,
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
          
          {/* AVATAR */}
          <div className="relative group w-28 h-28 sm:w-32 sm:h-32">
            <Avatar className="w-full h-full border-4 border-background">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-4xl">
                <User />
              </AvatarFallback>
            </Avatar>

            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 bg-black/50 flex items-center justify-center text-white rounded-full
                         opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </label>

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              hidden
              disabled={uploading}
              onChange={handleAvatarUpload}
            />
          </div>

          {/* PROFILE INFO */}
          <div className="mt-4 sm:mt-0 flex-1">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) =>
                    onProfileChange({ full_name: e.target.value })
                  }
                  className="text-lg font-semibold"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input value={profile.email} disabled />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
