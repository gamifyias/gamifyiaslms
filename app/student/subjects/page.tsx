"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, BookOpen, ChevronRight, ChevronDown, CheckCircle2, Clock, Star } from "lucide-react";
import Link from "next/link";
import { StudentSidebar } from "@/components/student-sidebar";
import { motion, AnimatePresence } from "framer-motion";

// =============================
// Interfaces
// =============================
interface Subject {
  id: string;
  name: string;
  description: string;
}

interface TopicStats {
  topicId: string;
  topicName: string;
  progress: number;
  status: "MASTERED" | "GOOD" | "NEEDS_WORK" | "Not Started";
  revisionsCompleted: number;
  totalRevisions: number;
  materialsCompleted: number;
  totalMaterials: number;
  hasStarted: boolean;
  testScore: number;
  totalXP: number;
  lastRevisionDate: string | null;
}

interface SubjectWithTopics {
  subject: Subject;
  topics: TopicStats[];
  completedTopics: number;
  totalTopics: number;
  averageProgress: number;
}

// =============================
// Utilities
// =============================
const isRevisionAllowedToday = (lastRevisionDate: string | null): boolean => {
  if (!lastRevisionDate) return true;
  const lastDate = new Date(lastRevisionDate);
  const today = new Date();
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return lastDate.getTime() !== today.getTime();
};

// =============================
// Sub-Component: Subject Card (Collapsible)
// =============================
function SubjectAccordion({ data }: { data: SubjectWithTopics }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-2 border-[#3B2A23]/10 shadow-sm hover:shadow-md transition-all">
        {/* Header Section - Always Visible */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer p-5 flex items-center justify-between bg-white hover:bg-stone-50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-[#3B2A23]">{data.subject.name}</h3>
              <Badge variant={data.averageProgress === 100 ? "default" : "secondary"} className="rounded-full">
                {data.completedTopics}/{data.totalTopics} Done
              </Badge>
            </div>
            <p className="text-sm text-stone-500 mt-1 line-clamp-1">{data.subject.description}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Overall Progress</span>
              <div className="flex items-center gap-3">
                <Progress value={data.averageProgress} className="w-24 h-2" />
                <span className="text-sm font-bold w-8">{data.averageProgress}%</span>
              </div>
            </div>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
              <ChevronDown className="w-5 h-5 text-stone-400" />
            </motion.div>
          </div>
        </div>

        {/* Expandable Section */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardContent className="p-4 pt-0 bg-stone-50/50 border-t border-stone-100">
                <div className="space-y-3 mt-4">
                  {data.topics.length > 0 ? (
                    data.topics.map((topic) => {
                      const canRevise = isRevisionAllowedToday(topic.lastRevisionDate);
                      return (
                        <Link key={topic.topicId} href={`/student/subjects/${topic.topicId}`}>
                          <motion.div 
                            whileHover={{ scale: 1.005, x: 5 }}
                            className="group flex items-center justify-between p-4 rounded-xl border border-white bg-white shadow-sm hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex-1 mr-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-[#3B2A23] group-hover:text-primary transition-colors">
                                  {topic.topicName}
                                </span>
                                <div className="flex items-center gap-4 text-[11px] font-medium text-stone-400">
                                   <span className="flex items-center gap-1">
                                      <BookOpen className="w-3 h-3" /> {topic.materialsCompleted}/{topic.totalMaterials}
                                   </span>
                                   <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {topic.revisionsCompleted}/{topic.totalRevisions}
                                   </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <Progress value={topic.progress} className="h-1.5 flex-1" />
                                <span className="text-xs font-black text-stone-500">{topic.progress}%</span>
                              </div>

                              <div className="flex items-center gap-3 mt-2">
                                {topic.testScore > 0 && (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 py-0 h-5 text-[10px]">
                                    Score: {topic.testScore}/20
                                  </Badge>
                                )}
                                <Badge className="bg-blue-50 text-blue-700 border-blue-100 py-0 h-5 text-[10px]">
                                  {topic.totalXP} XP
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {topic.progress === 100 ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              ) : !canRevise && topic.hasStarted ? (
                                <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 text-[10px]">
                                  1/day limit
                                </Badge>
                              ) : (
                                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-primary" />
                              )}
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-stone-400 italic text-sm">
                      No topics found for this subject.
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// =============================
// Main Page
// =============================
export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        const { data: subjectsData } = await supabase.from("subjects").select("*").order("name");
        if (!subjectsData) return;

        const detailedData = await Promise.all(subjectsData.map(async (sub) => {
          const { data: topics } = await supabase.from("topics").select("*").eq("subject_id", sub.id);
          if (!topics || topics.length === 0) return { subject: sub, topics: [], completedTopics: 0, totalTopics: 0, averageProgress: 0 };

          const tIds = topics.map(t => t.id);
          const [progress, revisions, materials, xp] = await Promise.all([
            supabase.from("topic_progress").select("*").eq("student_id", user.id).in("topic_id", tIds),
            supabase.from("revision_schedule").select("*").eq("student_id", user.id).in("topic_id", tIds),
            supabase.from("study_materials").select("*").in("topic_id", tIds),
            supabase.from("xp_events").select("*").eq("student_id", user.id)
          ]);

          const topicStats: TopicStats[] = topics.map(t => {
            const p = progress.data?.find(x => x.topic_id === t.id);
            const r = revisions.data?.filter(x => x.topic_id === t.id) || [];
            const m = materials.data?.filter(x => x.topic_id === t.id) || [];
            
            // Completion Logic
            const compR = r.filter(x => x.is_completed).length;
            const hasStarted = r.length > 0;
            const lastRev = r.filter(x => x.completed_date).sort((a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime())[0];

            // Simplified Progress calculation for UI demo
            const matComp = m.filter(mat => xp.data?.some(e => e.material_id === mat.id)).length;
            const calculatedProgress = hasStarted ? Math.min(100, Math.round(((matComp / (m.length || 1)) * 50) + ((compR / (r.length || 1)) * 50))) : 0;

            return {
              topicId: t.id,
              topicName: t.name,
              progress: calculatedProgress,
              status: p?.total_xp >= 180 ? "MASTERED" : p?.total_xp >= 120 ? "GOOD" : "NEEDS_WORK",
              revisionsCompleted: compR,
              totalRevisions: r.length,
              materialsCompleted: matComp,
              totalMaterials: m.length,
              hasStarted,
              testScore: p?.test_score || 0,
              totalXP: p?.total_xp || 0,
              lastRevisionDate: lastRev?.completed_date || null
            };
          });

          const avgProg = Math.round(topicStats.reduce((acc, curr) => acc + curr.progress, 0) / topicStats.length);
          return {
            subject: sub,
            topics: topicStats,
            completedTopics: topicStats.filter(t => t.progress === 100).length,
            totalTopics: topicStats.length,
            averageProgress: avgProg
          };
        }));

        setSubjects(detailedData);
      } catch (e) {
        setError("Failed to load your curriculum.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-screen bg-[#F6E7C1]"><StudentSidebar /><div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[#3B2A23] w-10 h-10" /></div></div>
  );

  return (
    <div className="flex h-screen bg-[#F6E7C1] text-[#3B2A23] font-sans">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">My Curriculum</h1>
            </div>
            <p className="text-stone-600 text-lg">Track your mastery and revision progress across all subjects.</p>
          </header>

          <div className="grid gap-6">
            {subjects.length > 0 ? (
              subjects.map((s) => <SubjectAccordion key={s.subject.id} data={s} />)
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                <h2 className="text-xl font-bold">No subjects assigned yet</h2>
                <p className="text-stone-500">Check back later or contact your instructor.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}