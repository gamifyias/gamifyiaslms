"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Define interfaces for the data
interface Topic {
  id: string;
  name: string;
  order_index: number;
  progress_percentage: number;
  status: "MASTERED" | "GOOD" | "NEEDS_WORK" | "Not Started";
}

interface Subject {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  topics: Topic[];
}

export default function SubjectsView() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not found");
        setLoading(false);
        return;
      }

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("id, name, description, icon_url");

      if (subjectsError) {
        console.error("Error fetching subjects:", subjectsError);
        setLoading(false);
        return;
      }

      // Fetch topics
      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select("id, subject_id, name, order_index");

      if (topicsError) {
        console.error("Error fetching topics:", topicsError);
        setLoading(false);
        return;
      }

      // Fetch topic progress
      const { data: progressData, error: progressError } = await supabase
        .from("topic_progress")
        .select("topic_id, progress_percentage, status")
        .eq("student_id", user.id);

      if (progressError) {
        console.error("Error fetching topic progress:", progressError);
        setLoading(false);
        return;
      }

      // Combine the data
      const combinedData = subjectsData.map((subject) => {
        const subjectTopics = topicsData
          .filter((topic) => topic.subject_id === subject.id)
          .map((topic) => {
            const progress = progressData.find(
              (p) => p.topic_id === topic.id
            );
            return {
              ...topic,
              progress_percentage: progress?.progress_percentage || 0,
              status: progress?.status || "Not Started",
            };
          })
          .sort((a, b) => a.order_index - b.order_index);

        return {
          ...subject,
          topics: subjectTopics,
        };
      });

      setSubjects(combinedData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Subjects</h1>
      <Accordion type="single" collapsible className="w-full">
        {subjects.map((subject) => {
          const totalTopics = subject.topics.length;
          const completedTopics = subject.topics.filter(
            (t) => t.progress_percentage >= 100
          ).length;
          const subjectProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

          return (
            <AccordionItem value={subject.id} key={subject.id}>
              <AccordionTrigger>
                <div className="flex items-center w-full">
                  <div className="flex-grow text-left">
                    <div className="font-semibold">{subject.name}</div>
                    <div className="text-sm text-muted-foreground">{subject.description}</div>
                    <div className="flex items-center text-sm mt-1">
                      <span>{completedTopics} / {totalTopics} Topics Completed</span>
                    </div>
                     <Progress value={subjectProgress} className="w-full mt-2" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {subject.topics.map((topic) => (
                    <Link href={`/student/subjects/${topic.id}`} key={topic.id}>
                      <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>{topic.name}</div>
                          <div className="flex items-center w-1/3">
                            <Progress value={topic.progress_percentage} className="w-full mr-4" />
                            <Badge variant={
                                topic.status === "MASTERED" ? "default" :
                                topic.status === "GOOD" ? "secondary" :
                                topic.status === "NEEDS_WORK" ? "destructive" :
                                "outline"
                              }>
                              {topic.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
