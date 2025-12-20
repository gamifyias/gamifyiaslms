"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";
import { StudentSidebar } from "@/components/student-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardEntry {
  rank: number;
  student_name: string;
  total_xp: number;
  current_level: number;
  avatar_url: string | null;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);

        /**
         * Mentor-style query:
         * leaderboard + profiles (avatar)
         */
        const { data, error: fetchError } = await supabase
          .from("leaderboard")
          .select(`
            rank,
            total_xp,
            level,
            profiles (
              full_name,
              avatar_url
            )
          `)
          .order("rank", { ascending: true })
          .limit(100);

        if (fetchError) throw fetchError;

        const formatted: LeaderboardEntry[] = (data || []).map(
          (row: any) => ({
            rank: row.rank,
            student_name: row.profiles?.full_name ?? "Unknown",
            total_xp: row.total_xp ?? 0,
            current_level: row.level ?? 1,
            avatar_url: row.profiles?.avatar_url ?? null,
          })
        );

        setEntries(formatted);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load leaderboard";
        setError(msg);
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [supabase]);

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23]">
        <StudentSidebar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23]">
      <StudentSidebar />

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Top performers in UPSC Prep
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <Card className="border-destructive mb-6">
              <CardContent className="p-6">
                <p className="text-destructive">Error: {error}</p>
              </CardContent>
            </Card>
          )}

          {/* EMPTY */}
          {entries.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No leaderboard data available yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Rankings</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.rank}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors
                        ${
                          entry.rank === 1
                            ? "bg-yellow-100 border-yellow-400"
                            : entry.rank === 2
                            ? "bg-gray-100 border-gray-400"
                            : entry.rank === 3
                            ? "bg-orange-100 border-orange-400"
                            : "hover:bg-muted/50"
                        }
                      `}
                    >
                      {/* LEFT */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* RANK */}
                        <div className="w-8 text-center font-bold">
                          {entry.rank === 1 && "🥇"}
                          {entry.rank === 2 && "🥈"}
                          {entry.rank === 3 && "🥉"}
                          {entry.rank > 3 && `#${entry.rank}`}
                        </div>

                        {/* AVATAR */}
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback>
                            {entry.student_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        {/* NAME */}
                        <div>
                          <p className="font-medium">
                            {entry.student_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Level {entry.current_level}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {entry.total_xp.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
