"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MentorSidebar } from "@/components/mentor-sidebar";
import { useToast } from "@/components/ui/use-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, ChevronDown, ChevronRight, BookOpen, Target, Award, Zap, User } from "lucide-react";


function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

// TYPES FOR LEVEL + PROFILE (fixes TS errors)
interface LevelRecord {
  total_xp?: number;
  current_level?: number;
}

interface StudentProfileRecord {
  total_hours_studied?: number;
  current_streak?: number;
  overall_accuracy?: number;
  last_study_date?: string | null;
  enrollment_date?: string | null;
}

export default function ProgressDisplay() {
  const supabase = createClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const studentId = searchParams.get("studentId");

  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [studentStats, setStudentStats] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [topicProgress, setTopicProgress] = useState<any[]>([]);
  const [revisionSchedule, setRevisionSchedule] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        // Load profile + stats
        const [pRes, spRes, levelRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", studentId).single(),
          supabase
            .from("student_profiles")
            .select(
              "total_hours_studied, current_streak, overall_accuracy, last_study_date, enrollment_date"
            )
            .eq("id", studentId)
            .maybeSingle(),
          supabase
            .from("level_system")
            .select("total_xp, current_level")
            .eq("student_id", studentId)
            .maybeSingle(),
        ]);

        if (pRes.error) throw pRes.error;

        setStudentProfile(pRes.data);

        // FIXED TYPING HERE (no more TS error)
        const sp = (spRes.data || {}) as StudentProfileRecord;
        const lvl = (levelRes.data || {}) as LevelRecord;

        setStudentStats({
          current_level: lvl.current_level ?? 1,
          total_points: lvl.total_xp ?? 0,
        });

        // Load subjects + topics
        const [subjectsRes, topicsRes] = await Promise.all([
          supabase
            .from("subjects")
            .select("id, name, description")
            .order("name", { ascending: true }),
          supabase
            .from("topics")
            .select("id, name, description, subject_id")
            .order("order_index", { ascending: true }),
        ]);

        if (subjectsRes.error) throw subjectsRes.error;
        if (topicsRes.error) throw topicsRes.error;

        setSubjects(subjectsRes.data || []);
        setTopics(topicsRes.data || []);

        const topicIds = (topicsRes.data || []).map((t: any) => t.id);
        if (topicIds.length === 0) {
          setTopicProgress([]);
          setRevisionSchedule([]);
          setMaterials([]);
          setTests([]);
          return;
        }

        // Load topic progress + revisions + materials + tests
        const [tpRes, revRes, matRes, testsRes] = await Promise.all([
          supabase
            .from("topic_progress")
            .select("*")
            .eq("student_id", studentId)
            .in("topic_id", topicIds),
          supabase
            .from("revision_schedule")
            .select("*")
            .eq("student_id", studentId)
            .in("topic_id", topicIds),
          supabase.from("study_materials").select("*").in("topic_id", topicIds),
          supabase
            .from("tests")
            .select("*")
            .eq("student_id", studentId)
            .in("topic_id", topicIds)
            .order("created_at", { ascending: false }),
        ]);

        if (tpRes.error) throw tpRes.error;
        if (revRes.error) throw revRes.error;
        if (matRes.error) throw matRes.error;
        if (testsRes.error) throw testsRes.error;

        setTopicProgress(tpRes.data || []);
        setRevisionSchedule(revRes.data || []);
        setMaterials(matRes.data || []);
        setTests(testsRes.data || []);
      } catch (err: any) {
        console.error(err);
        toast({
          title: "Error loading student data",
          description: err.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentId]);

  // Memoized subject breakdown
  const subjectBlocks = useMemo(() => {
    if (!subjects.length || !topics.length) return [];

    const progressById: Record<string, any> = {};
    for (const tp of topicProgress) progressById[tp.topic_id] = tp;

    const revisionsById: Record<string, any[]> = {};
    for (const r of revisionSchedule) {
      if (!revisionsById[r.topic_id]) revisionsById[r.topic_id] = [];
      revisionsById[r.topic_id].push(r);
    }

    const materialsById: Record<string, any[]> = {};
    for (const m of materials) {
      if (!materialsById[m.topic_id]) materialsById[m.topic_id] = [];
      materialsById[m.topic_id].push(m);
    }

    return subjects.map((sub) => {
      const subTopics = topics.filter((t) => t.subject_id === sub.id);
      const topicRows = subTopics.map((topic) => {
        const tp = progressById[topic.id];
        const revs = revisionsById[topic.id] || [];
        const mats = materialsById[topic.id] || [];

        let lastRev: string | null = null;
        const completed = revs.filter((r) => r.completed_date);
        if (completed.length > 0) {
          completed.sort(
            (a, b) =>
              new Date(b.completed_date!).getTime() -
              new Date(a.completed_date!).getTime()
          );
          lastRev = completed[0].completed_date;
        }

        return {
          topicId: topic.id,
          topicName: topic.name,
          description: topic.description,
          progress: tp?.progress_percentage ?? 0,
          status: tp?.status ?? "NEEDS_WORK",
          totalXP: tp?.total_xp ?? 0,
          testScore: tp?.test_score ?? 0,
          testCompleted: tp?.test_completed ?? false,
          videoCompleted: tp?.video_completed ?? false,
          revisionsCompleted: completed.length,
          totalRevisions: revs.length,
          lastRevisionDate: lastRev,
          materialsCount: mats.length,
        };
      });

      const avg =
        topicRows.length > 0
          ? Math.round(
              topicRows.reduce((s, t) => s + t.progress, 0) /
                topicRows.length
            )
          : 0;

      return { subject: sub, topics: topicRows, averageProgress: avg };
    });
  }, [subjects, topics, topicProgress, revisionSchedule, materials]);

  const overallProgress = useMemo(() => {
    if (!subjectBlocks.length) return 0;
    const sum = subjectBlocks.reduce(
      (s, b) => s + b.averageProgress,
      0
    );
    return Math.round(sum / subjectBlocks.length);
  }, [subjectBlocks]);

  if (!studentId) {
    return (
      <div className="flex h-screen bg-background">
        <MentorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            No student selected. Use ?studentId= in URL.
          </p>
        </div>
      </div>
    );
  }

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

  if (!studentProfile) {
    return (
      <div className="flex h-screen bg-background">
        <MentorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-destructive">Student not found.</p>
        </div>
      </div>
    );
  }

  const stats = studentStats || {};

  return (
    <div className="flex h-screen bg-background">
      <MentorSidebar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-8">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={studentProfile.avatar_url ?? undefined} />
                <AvatarFallback>
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  {studentProfile.full_name}
                  <Badge variant="outline" className="text-xs">
                    Student
                  </Badge>
                </h1>

                <p className="text-sm text-muted-foreground">
                  {studentProfile.email}
                  {studentProfile.phone && ` · ${studentProfile.phone}`}
                </p>
              </div>
            </div>
          </div>

          {/* TOP STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-2xl font-bold">{stats.current_level ?? 1}</p>
                </div>
                <Target className="w-6 h-6 text-muted-foreground opacity-70" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{stats.total_points ?? 0}</p>
                </div>
                <Zap className="w-6 h-6 text-muted-foreground opacity-70" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overall Progress</p>
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                </div>
                <BookOpen className="w-6 h-6 text-muted-foreground opacity-70" />
              </CardContent>
            </Card>
          </div>

          {/* MAIN LAYOUT */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* SUBJECT TREE */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Subject & Topic Progress
                  </CardTitle>
                  <CardDescription>
                    Breakdown of subjects → topics → individual progress.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {subjectBlocks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No subjects found.
                    </p>
                  ) : (
                    subjectBlocks.map((block) => {
                      const open = expandedSubjectId === block.subject.id;

                      return (
                        <div
                          key={block.subject.id}
                          className="border rounded-lg overflow-hidden bg-card"
                        >
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/70 transition"
                            onClick={() =>
                              setExpandedSubjectId(open ? null : block.subject.id)
                            }
                          >
                            <div>
                              <p className="font-semibold">{block.subject.name}</p>
                              {block.subject.description && (
                                <p className="text-xs text-muted-foreground">
                                  {block.subject.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  Avg Progress
                                </p>
                                <p className="text-sm font-semibold">
                                  {block.averageProgress}%
                                </p>
                              </div>

                              {open ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </div>
                          </button>

                          {open && (
                            <div className="px-4 pb-4 pt-2 space-y-3">
                              {block.topics.map((t) => (
                                <div
                                  className="border rounded-md p-3 bg-background space-y-2"
                                  key={t.topicId}
                                >
                                  <div className="flex justify-between">
                                    <div>
                                      <p className="text-sm font-semibold">
                                        {t.topicName}
                                      </p>
                                      {t.description && (
                                        <p className="text-xs text-muted-foreground">
                                          {t.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                      <Badge className="text-[10px]">
                                        {t.status}
                                      </Badge>
                                      <span className="text-[11px] text-muted-foreground">
                                        XP: {t.totalXP}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Progress value={t.progress} className="h-2 flex-1" />
                                    <span className="text-[11px]">
                                      {t.progress}%
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                    <span>Materials: {t.materialsCount}</span>
                                    <span>
                                      Revisions: {t.revisionsCompleted}/{t.totalRevisions}
                                    </span>
                                    {t.lastRevisionDate && (
                                      <span>Last: {formatDate(t.lastRevisionDate)}</span>
                                    )}
                                    {t.testScore > 0 && (
                                      <span>Score: {t.testScore}/20</span>
                                    )}
                                    {t.videoCompleted && (
                                      <Badge variant="outline" className="text-[10px]">
                                        Video Done
                                      </Badge>
                                    )}
                                    {t.testCompleted && (
                                      <Badge className="text-[10px]">Test Completed</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* TEST PERFORMANCE */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Test Performance
                  </CardTitle>
                  <CardDescription>All test attempts for this student.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-md bg-background">
                      <p className="text-xs text-muted-foreground">Total Attempts</p>
                      <p className="text-xl font-bold">{tests.length}</p>
                    </div>

                    <div className="p-3 border rounded-md bg-background">
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                      <p className="text-xl font-bold">
                        {tests.length > 0
                          ? (
                              tests.reduce((a, t) => a + (t.score ?? 0), 0) /
                              tests.length
                            ).toFixed(1)
                          : "0.0"}
                      </p>
                    </div>

                    <div className="p-3 border rounded-md bg-background">
                      <p className="text-xs text-muted-foreground">Best Score</p>
                      <p className="text-xl font-bold">
                        {tests.length > 0
                          ? Math.max(...tests.map((t) => t.score ?? 0))
                          : 0}
                      </p>
                    </div>

                    <div className="p-3 border rounded-md bg-background">
                      <p className="text-xs text-muted-foreground">Worst Score</p>
                      <p className="text-xl font-bold">
                        {tests.length > 0
                          ? Math.min(...tests.map((t) => t.score ?? 0))
                          : 0}
                      </p>
                    </div>

                    <div className="p-3 border rounded-md bg-background col-span-2">
                      <p className="text-xs text-muted-foreground">Tests in Last 7 Days</p>
                      <p className="text-xl font-bold">
                        {
                          tests.filter((t) => {
                            const d = new Date(t.created_at);
                            return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
                          }).length
                        }
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Topic</th>
                          <th className="p-2 text-left">Score</th>
                          <th className="p-2 text-left">Attempt</th>
                        </tr>
                      </thead>

                      <tbody>
                        {tests.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-4 text-center text-muted-foreground"
                            >
                              No tests attempted yet.
                            </td>
                          </tr>
                        ) : (
                          tests.map((t) => {
                            const topic = topics.find((tp) => tp.id === t.topic_id);

                            return (
                              <tr key={t.id} className="border-t">
                                <td className="p-2">{formatDate(t.created_at)}</td>
                                <td className="p-2">{topic?.name ?? "Topic"}</td>
                                <td className="p-2 font-semibold">
                                  {t.score}/{t.max_score ?? 20}
                                </td>
                                <td className="p-2">#{t.attempt_number}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
