"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface StudyMaterial {
  id: string;
  topic_id: string;
  title: string;
  content_type: "video" | "pdf" | "notes" | "slides" | "test-solution" | "reference" | "extra";
  resource_url: string;
  created_at: string;
}

interface GroupedMaterials {
  video: StudyMaterial[];
  notes: StudyMaterial[];
  pdf: StudyMaterial[];
  slides: StudyMaterial[];
  "test-solution": StudyMaterial[];
  reference: StudyMaterial[];
  extra: StudyMaterial[];
}

export default function StudyMaterials({ topicId }: { topicId: string }) {
  const [materials, setMaterials] = useState<GroupedMaterials>({
    video: [],
    notes: [],
    pdf: [],
    slides: [],
    "test-solution": [],
    reference: [],
    extra: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("study_materials")
          .select("*")
          .eq("topic_id", topicId)
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;

        const grouped: GroupedMaterials = {
          video: [],
          notes: [],
          pdf: [],
          slides: [],
          "test-solution": [],
          reference: [],
          extra: [],
        };

        data?.forEach((item) => {
          if (item.content_type in grouped) {
            grouped[item.content_type as keyof GroupedMaterials].push(item);
          }
        });

        setMaterials(grouped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch materials");
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchMaterials();
    }
  }, [topicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Error loading materials: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const hasAnyMaterials = Object.values(materials).some((arr) => arr.length > 0);

  if (!hasAnyMaterials) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground">No study materials available for this topic yet.</p>
        </CardContent>
      </Card>
    );
  }

  const renderSection = (
    title: string,
    icon: string,
    items: StudyMaterial[],
    buttonLabel: string
  ) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div key={title}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {icon} {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    <Badge variant="secondary" className="mt-2">
                      {item.content_type}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => window.open(item.resource_url, "_blank")}
                    size="sm"
                    className="ml-4"
                  >
                    {buttonLabel}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Study Materials</h2>
        <p className="text-sm text-muted-foreground mt-1">All resources for this topic</p>
      </div>

      {renderSection("Video Lectures", "📺", materials.video, "Open Video")}
      {renderSection("Notes", "📝", materials.notes, "Open Notes")}
      {renderSection("PDFs", "📄", materials.pdf, "Open PDF")}
      {renderSection("Slides", "📚", materials.slides, "Open Slides")}
      {renderSection("Test Solutions", "🧪", materials["test-solution"], "Open Solution")}
      {renderSection("References", "🔗", materials.reference, "Open Link")}
      {renderSection("Extra Resources", "📦", materials.extra, "Open Resource")}
    </div>
  );
}
