"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentSidebar } from "@/components/student-sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* ---------------- TYPES ---------------- */

interface LevelSystemRow {
  student_id: string;
  total_xp: number;
  current_level: number;
}

interface ProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface LeaderboardRow {
  rank: number;
  student_id: string;
  name: string;
  level: number;
  total_xp: number;
  avatar_url: string | null;
}

/* ---------------- PAGE ---------------- */

export default function StudentLeaderboardPage() {
  const supabase = createClient();

  const [levels, setLevels] = useState<LevelSystemRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // 1️⃣ Fetch ALL level system rows (MAIN SOURCE)
      const { data: levelData, error: levelError } = await supabase
        .from("level_system")
        .select("student_id, total_xp, current_level");

      if (levelError) {
        console.error(levelError);
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch student profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .eq("role", "student");

      if (profileError) {
        console.error(profileError);
        setLoading(false);
        return;
      }

      setLevels(levelData || []);
      setProfiles(profileData || []);
      setLoading(false);
    };

    loadData();
  }, [supabase]);

  /* ---------------- LEADERBOARD CALCULATION ---------------- */

  const leaderboard: LeaderboardRow[] = useMemo(() => {
    const profileMap = new Map(
      profiles.map((p) => [p.id, p])
    );

    return levels
      // only students that actually exist
      .filter((row) => profileMap.has(row.student_id))

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
        avatar_url: profileMap.get(row.student_id)!.avatar_url,
        level: row.current_level,
        total_xp: row.total_xp,
      }));
  }, [levels, profiles]);

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F6E7C1]">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23]">
      <StudentSidebar />

      <div className="flex-1 p-8 space-y-8 overflow-auto">

        {/* HEADER */}
        <div className="flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-700" />
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>

        {/* TOP 3 */}
        <div className="grid md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((s) => (
            <Card key={s.student_id} className="border-2 text-center">
              <CardHeader>
                <div className="text-3xl">
                  {s.rank === 1 && "🥇"}
                  {s.rank === 2 && "🥈"}
                  {s.rank === 3 && "🥉"}
                </div>

                <Avatar className="mx-auto h-16 w-16">
                  <AvatarImage src={s.avatar_url || undefined} />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>

                <CardTitle className="mt-2">
                  {s.name}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm opacity-80">
                  Level {s.level}
                </p>
                <p className="text-sm font-semibold">
                  {s.total_xp.toLocaleString()} XP
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
            {leaderboard.map((s) => (
              <div
                key={s.student_id}
                className="flex justify-between items-center p-4 rounded-md border
                           bg-[#F6E7C1] hover:bg-[#EAD39C]"
              >
                <div className="flex items-center gap-4">
                  <div className="font-bold">#{s.rank}</div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={s.avatar_url || undefined} />
                    <AvatarFallback>
                      {s.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs opacity-80">
                      Level {s.level}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold">
                    {s.total_xp.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-70">XP</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
