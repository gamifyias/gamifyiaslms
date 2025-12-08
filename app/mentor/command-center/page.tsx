"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MentorSidebar } from "@/components/mentor-sidebar";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

import { User, Loader2 } from "lucide-react";

interface LevelRecord {
  student_id: string;
  total_xp?: number;
  current_level?: number;
}

interface StudentProfileRecord {
  id: string;
  total_hours_studied?: number;
  current_streak?: number;
  overall_accuracy?: number;
  last_study_date?: string | null;
}

export default function MentorCommandCenter() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [mentorId, setMentorId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Get logged-in mentor
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast({
            title: "Error",
            description: "Mentor not logged in",
            variant: "destructive",
          });
          return;
        }

        setMentorId(user.id);

        // Fetch assigned students
        const { data: assigned, error: aErr } = await supabase
          .from("student_mentor_assignments")
          .select("student_id")
          .eq("mentor_id", user.id)
          .eq("is_active", true);

        if (aErr) throw aErr;

        if (!assigned || assigned.length === 0) {
          setStudents([]);
          return;
        }

        const studentIds = assigned.map((x) => x.student_id);

        // 1. Profiles
        const { data: profilesRaw } = await supabase
          .from("profiles")
          .select("*")
          .in("id", studentIds);

        const profiles = profilesRaw ?? [];

        // 2. Level System
        const { data: levelRaw } = await supabase
          .from("level_system")
          .select("student_id, total_xp, current_level")
          .in("student_id", studentIds);

        const levelData: LevelRecord[] = levelRaw ?? [];

        // 3. Student Profiles
        const { data: spRaw } = await supabase
          .from("student_profiles")
          .select(
            "id, total_hours_studied, current_streak, overall_accuracy, last_study_date"
          )
          .in("id", studentIds);

        const studentProfiles: StudentProfileRecord[] = spRaw ?? [];

        // SAFE MAPPING
        const combined = profiles.map((p: any) => {
          const lvl =
            (levelData.find((l) => l.student_id === p.id) ||
              {}) as LevelRecord;
          const sp =
            (studentProfiles.find((s) => s.id === p.id) ||
              {}) as StudentProfileRecord;

          return {
            ...p,
            stats: {
              current_level: lvl.current_level ?? 1,
              total_points: lvl.total_xp ?? 0,
              overall_accuracy: sp.overall_accuracy ?? 0,
              current_streak: sp.current_streak ?? 0,
              total_hours_studied: sp.total_hours_studied ?? 0,
              last_study_date: sp.last_study_date ?? null,
            },
          };
        });

        setStudents(combined);
      } catch (err: any) {
        console.error(err);
        toast({
          title: "Error loading students",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const getHealthStatus = (stats: any) => {
    const accuracy = Number(stats.overall_accuracy || 0);
    const streak = Number(stats.current_streak || 0);

    if (accuracy >= 70 || streak >= 5)
      return { text: "Good", color: "bg-green-500" };
    if (accuracy >= 40)
      return { text: "Average", color: "bg-yellow-500" };
    return { text: "Needs Support", color: "bg-red-500" };
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <MentorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <MentorSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Command Center</h1>
            <p className="text-muted-foreground">
              Your assigned students & their overall performance.
            </p>
          </div>

          {students.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No students assigned yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              {students.map((student) => {
                const stats = student.stats;
                const health = getHealthStatus(stats);

                return (
                  <Card
                    key={student.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {student.full_name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {student.email}{" "}
                              {student.phone && `• ${student.phone}`}
                            </CardDescription>
                          </div>
                        </div>

                        <Badge className={`${health.color} text-white px-2`}>
                          {health.text}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Level</span>
                        <strong>{stats.current_level}</strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Total XP</span>
                        <strong>{stats.total_points}</strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Accuracy</span>
                        <strong>
                          {stats.overall_accuracy
                            ? `${Number(
                                stats.overall_accuracy
                              ).toFixed(1)}%`
                            : "0.0%"}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Streak</span>
                        <strong>{stats.current_streak} days</strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Hours Studied</span>
                        <strong>{stats.total_hours_studied} hrs</strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Last Active</span>
                        <strong>
                          {stats.last_study_date
                            ? new Date(
                                stats.last_study_date
                              ).toLocaleDateString()
                            : "-"}
                        </strong>
                      </div>

                      <Link
                        href={`/mentor/command-center/student-progress?studentId=${student.id}`}
                      >
                        <Button className="w-full mt-3">
                          View Full Progress
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
