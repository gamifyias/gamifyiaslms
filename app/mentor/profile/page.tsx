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

export default function MentorProfilePage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mentorId, setMentorId] = useState<string | null>(null);

  const [mentorProfile, setMentorProfile] = useState<any>({});
  const [dirty, setDirty] = useState<any>({});

  // ---------------- LOAD DATA ----------------
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
  }, []);

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (field: string, value: any) => {
    setDirty((prev: any) => ({ ...prev, [field]: value }));
  };

  // ---------------- SAVE ----------------
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

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F6E7C1]">
        <Loader2 className="w-10 h-10 animate-spin text-[#3B2A23]" />
      </div>
    );
  }

  // ---------------- RENDER ----------------
  return (
    <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23] relative overflow-hidden">
      <MentorSidebar />

      {/* PARCHMENT NOISE */}
      <div className="pointer-events-none fixed inset-0 bg-parchment-noise opacity-[0.05] z-0" />

      {/* FLOATING DUST */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {[...Array(16)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#3B2A23]/40 animate-dust"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${18 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10 relative z-10 animate-in fade-in duration-300">

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
