"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MentorSidebar } from "@/components/mentor-sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Loader2 } from "lucide-react";

/* ---------------- TYPES ---------------- */

interface LevelSystemRow {
  student_id: string;
  total_xp: number;
  current_level: number;
}

interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
}

interface LeaderboardRow {
  rank: number;
  student_id: string;
  name: string;
  level: number;
  isMentorStudent: boolean;
}

/* ---------------- PAGE ---------------- */

export default function LeaderboardPage() {
  const supabase = createClient();

  const [levels, setLevels] = useState<LevelSystemRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [mentorStudents, setMentorStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const mentorId = auth.user?.id;

      if (!mentorId) return;

      // 1️⃣ Fetch ALL level system rows (MAIN SOURCE)
      const { data: levelData } = await supabase
        .from("level_system")
        .select("student_id, total_xp, current_level");

      // 2️⃣ Fetch student profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "student");

      // 3️⃣ Fetch mentor assignments
      const { data: assigned } = await supabase
        .from("student_mentor_assignments")
        .select("student_id")
        .eq("mentor_id", mentorId)
        .eq("is_active", true);

      setLevels(levelData || []);
      setProfiles(profileData || []);
      setMentorStudents(assigned?.map(a => a.student_id) || []);

      setLoading(false);
    };

    loadData();
  }, [supabase]);

  /* ---------------- LEADERBOARD CALCULATION ---------------- */

  const leaderboard: LeaderboardRow[] = useMemo(() => {
    const profileMap = new Map(
      profiles.map(p => [p.id, p])
    );

    return levels
      // only students that actually exist
      .filter(row => profileMap.has(row.student_id))

      // ✅ CORE LOGIC:
      // 1) total_xp DESC
      // 2) current_level DESC
      .sort((a, b) => {
        if (b.total_xp !== a.total_xp) {
          return b.total_xp - a.total_xp;
        }
        return b.current_level - a.current_level;
      })

      // assign rank AFTER sorting
      .map((row, index) => ({
        rank: index + 1,
        student_id: row.student_id,
        name: profileMap.get(row.student_id)!.full_name,
        level: row.current_level,
        isMentorStudent: mentorStudents.includes(row.student_id),
      }));
  }, [levels, profiles, mentorStudents]);

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F6E7C1]">
        <MentorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23]">
      <MentorSidebar />

      <div className="flex-1 p-8 space-y-8 overflow-auto">

        {/* HEADER */}
        <div className="flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-700" />
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>

        {/* TOP 3 */}
        <div className="grid md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map(s => (
            <Card key={s.student_id} className="border-2 text-center">
              <CardHeader>
                <div className="text-3xl">
                  {s.rank === 1 && "🥇"}
                  {s.rank === 2 && "🥈"}
                  {s.rank === 3 && "🥉"}
                </div>
                <CardTitle>{s.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm opacity-80">
                  Level {s.level}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FULL LIST */}
        <Card className="border-2 bg-[#F2DEB3]">
          <CardHeader>
            <CardTitle>All Rankings</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {leaderboard.map(s => (
              <div
                key={s.student_id}
                className={`flex justify-between p-4 rounded-md border
                  ${s.isMentorStudent
                    ? "bg-green-100 border-green-600"
                    : "bg-[#F6E7C1] hover:bg-[#EAD39C]"}`}
              >
                <div>
                  <p className="font-semibold">
                    #{s.rank} {s.name}
                    {s.isMentorStudent && (
                      <Badge className="ml-2 bg-green-600 text-white">
                        Your Student
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs opacity-80">
                    Level {s.level}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
