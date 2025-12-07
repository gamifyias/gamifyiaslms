"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Play, FileText } from "lucide-react"

interface Subject {
  id: string
  name: string
  description: string
  icon_url?: string
}

interface Topic {
  id: string
  subject_id: string
  name: string
  description: string
  order_index: number
}

interface Material {
  id: string
  topic_id: string
  title: string
  content_type: string
  resource_url: string
  duration_minutes: number
  difficulty: string
}

export function StudyMaterialsView({ userId }: { userId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubjects = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("subjects").select("*").order("name")

      if (data) {
        setSubjects(data)
        setSelectedSubject(data[0])
      }
      setIsLoading(false)
    }

    fetchSubjects()
  }, [])

  useEffect(() => {
    const fetchTopicsAndMaterials = async () => {
      if (!selectedSubject) return

      const supabase = createClient()

      // Fetch topics
      const { data: topicsData } = await supabase
        .from("topics")
        .select("*")
        .eq("subject_id", selectedSubject.id)
        .order("order_index")

      setTopics(topicsData || [])

      // Fetch materials for this subject
      if (topicsData && topicsData.length > 0) {
        const topicIds = topicsData.map((t: any) => t.id)
        const { data: materialsData } = await supabase.from("study_materials").select("*").in("topic_id", topicIds)

        setMaterials(materialsData || [])
      }
    }

    fetchTopicsAndMaterials()
  }, [selectedSubject])

  const filteredMaterials = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topics
        .find((t) => t.id === m.topic_id)
        ?.name.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Study Materials</h2>
        <p className="text-muted-foreground mt-2">Access comprehensive study resources for UPSC preparation</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search materials by title or topic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading study materials...</div>
      ) : (
        <div className="space-y-6">
          {/* Subjects Tabs */}
          <div className="border border-border rounded-lg">
            <Tabs
              value={selectedSubject?.id || ""}
              onValueChange={(id) => setSelectedSubject(subjects.find((s) => s.id === id) || null)}
            >
              <TabsList className="w-full justify-start bg-secondary/50 rounded-none border-b border-border">
                {subjects.map((subject) => (
                  <TabsTrigger key={subject.id} value={subject.id} className="rounded-none">
                    {subject.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {subjects.map((subject) => (
                <TabsContent key={subject.id} value={subject.id} className="p-6 m-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{subject.description}</p>
                    </div>

                    {/* Topics */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-base">Topics</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {topics.map((topic) => {
                          const topicMaterials = materials.filter((m) => m.topic_id === topic.id)
                          return (
                            <Card key={topic.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                              <CardHeader>
                                <CardTitle className="text-base">{topic.name}</CardTitle>
                                <CardDescription className="text-xs">{topicMaterials.length} materials</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <Button className="w-full bg-transparent" variant="outline">
                                  View Topics
                                </Button>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>

                    {/* Materials */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-base">Study Materials</h4>
                      <div className="space-y-3">
                        {filteredMaterials.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-8 text-center">No materials found</p>
                        ) : (
                          filteredMaterials.map((material) => {
                            const topic = topics.find((t) => t.id === material.topic_id)
                            const Icon = material.content_type === "video" ? Play : FileText
                            return (
                              <Card key={material.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase">
                                          {material.content_type}
                                        </span>
                                        <span className="text-xs font-medium text-accent">{material.difficulty}</span>
                                      </div>
                                      <h5 className="font-semibold text-sm line-clamp-2">{material.title}</h5>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {topic?.name}
                                        {material.duration_minutes && ` • ${material.duration_minutes} min`}
                                      </p>
                                    </div>
                                    <Button size="sm" className="flex-shrink-0">
                                      {material.content_type === "video" ? "Watch" : "Read"}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      )}
    </div>
  )
}
