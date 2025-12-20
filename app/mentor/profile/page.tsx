"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Save,
  Shield,
  User,
  FileChartColumn,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MentorSidebar } from "@/components/mentor-sidebar";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* ---------------- IMAGE COMPRESSION (>2MB) ---------------- */
async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= 2 * 1024 * 1024) return file;

  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");

  const MAX = 512;
  const scale = Math.min(MAX / img.width, MAX / img.height);

  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.7)
  );

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

export default function MentorProfilePage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mentorId, setMentorId] = useState<string | null>(null);

  const [mentorProfile, setMentorProfile] = useState<any>({});
  const [dirty, setDirty] = useState<any>({});

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Not logged in");

        setMentorId(user.id);

        const [p, mp] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("mentor_profiles").select("*").eq("id", user.id).single(),
        ]);

        if (p.error) throw p.error;
        if (mp.error) throw mp.error;

        setMentorProfile(mp.data);
        setDirty({ ...p.data, ...mp.data });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [supabase, toast]);

  /* ---------------- HANDLE CHANGE ---------------- */
  const handleChange = (field: string, value: any) => {
    setDirty((prev: any) => ({ ...prev, [field]: value }));
  };

  /* ---------------- AVATAR UPLOAD ---------------- */
  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!mentorId) return;

    try {
      setUploading(true);

      const file = e.target.files?.[0];
      if (!file) return;

      const compressed = await compressIfNeeded(file);
      const path = `${mentorId}/avatar.png`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, {
          upsert: true,
          contentType: compressed.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      if (!data?.publicUrl) {
        throw new Error("Failed to get avatar URL");
      }

      const publicUrl = data.publicUrl;

      await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mentorId);

      setDirty((prev: any) => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (err: any) {
      toast({
        title: "Avatar upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- SAVE ---------------- */
  const save = async () => {
    if (!mentorId) return;
    setSaving(true);

    try {
      const {
        full_name,
        bio,
        phone,
        avatar_url,
        specialization,
        years_of_experience,
        availability,
      } = dirty;

      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          full_name,
          bio,
          phone,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mentorId);

      if (pErr) throw pErr;

      const { error: mErr } = await supabase
        .from("mentor_profiles")
        .update({
          specialization,
          years_of_experience,
          availability,
        })
        .eq("id", mentorId);

      if (mErr) throw mErr;

      toast({
        title: "Saved",
        description: "Your mentor profile has been updated.",
        className: "bg-green-200 text-green-900",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F6E7C1]">
        <Loader2 className="w-10 h-10 animate-spin text-[#3B2A23]" />
      </div>
    );
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23] relative overflow-hidden">
      <MentorSidebar />

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10 relative z-10">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Mentor Profile</h1>
          <p className="text-sm opacity-80">
            Manage your professional information and experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="space-y-6">

            {/* AVATAR */}
            <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3] card-rpg">
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-[#3B2A23]">
                    <AvatarImage src={dirty.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="w-12 h-12" />
                    </AvatarFallback>
                  </Avatar>

                  <label
                    htmlFor="mentor-avatar-upload"
                    className="absolute inset-0 bg-black/50 flex items-center justify-center
                               opacity-0 group-hover:opacity-100 cursor-pointer rounded-full"
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </label>

                  <input
                    id="mentor-avatar-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploading}
                    onChange={handleAvatarUpload}
                  />
                </div>

                <p className="text-sm opacity-70">Click avatar to change</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3] card-rpg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileChartColumn className="w-5 h-5" />
                  Mentor Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>Rating: <b>{mentorProfile.rating || 5} ⭐</b></p>
                <p>Experience: <b>{mentorProfile.years_of_experience || 0} years</b></p>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3] card-rpg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => supabase.auth.signOut()}
                  className="w-full border-[#3B2A23] hover:bg-[#EAD39C]"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="md:col-span-2 space-y-8">

            <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3] card-rpg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  className="bg-[#F6E7C1]"
                  placeholder="Full Name"
                  value={dirty.full_name || ""}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                />
                <Input
                  className="bg-[#F6E7C1]"
                  placeholder="Phone"
                  value={dirty.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                <Textarea
                  className="bg-[#F6E7C1]"
                  placeholder="Bio"
                  value={dirty.bio || ""}
                  onChange={(e) => handleChange("bio", e.target.value)}
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-[#8B5A2B] bg-[#F2DEB3] card-rpg">
              <CardHeader>
                <CardTitle>Mentor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  className="bg-[#F6E7C1]"
                  placeholder="Specialization"
                  value={dirty.specialization || ""}
                  onChange={(e) =>
                    handleChange("specialization", e.target.value)
                  }
                />
                <Input
                  type="number"
                  className="bg-[#F6E7C1]"
                  placeholder="Years of Experience"
                  value={dirty.years_of_experience || ""}
                  onChange={(e) =>
                    handleChange("years_of_experience", e.target.value)
                  }
                />
                <Input
                  className="bg-[#F6E7C1]"
                  placeholder="Availability"
                  value={dirty.availability || ""}
                  onChange={(e) =>
                    handleChange("availability", e.target.value)
                  }
                />
              </CardContent>
            </Card>

          </div>
        </div>

        {/* SAVE */}
        <div className="fixed bottom-8 right-8">
          <Button
            onClick={save}
            size="lg"
            disabled={saving}
            className="gap-2 shadow-xl bg-[#3B2A23] text-[#F6E7C1] hover:bg-[#2C1E18]"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </Button>
        </div>

      </div>
    </div>
  );
}
