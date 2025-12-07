"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Edit } from "lucide-react"

interface Subject {
  id: string
  name: string
  description: string
}

interface Topic {
  id: string
  subject_id: string
  name: string
}

export function ContentManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [newSubjectName, setNewSubjectName] = useState("")
  const [newTopicName, setNewTopicName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      const supabase = createClient()

      const [{ data: subjectsData }, { data: topicsData }] = await Promise.all([
        supabase.from("subjects").select("*").order("name"),
        supabase.from("topics").select("*").order("name"),
      ])

      setSubjects(subjectsData || [])
      setTopics(topicsData || [])
      if (subjectsData?.length) {
        setSelectedSubject(subjectsData[0].id)
      }
      setIsLoading(false)
    }

    fetchContent()
  }, [])

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return

    const supabase = createClient()
    const { data, error } = await supabase.from("subjects").insert({ name: newSubjectName }).select()

    if (!error && data) {
      setSubjects([...subjects, data[0]])
      setNewSubjectName("")
    }
  }

  const handleAddTopic = async () => {
    if (!newTopicName.trim() || !selectedSubject) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from("topics")
      .insert({ subject_id: selectedSubject, name: newTopicName })
      .select()

    if (!error && data) {
      setTopics([...topics, data[0]])
      setNewTopicName("")
    }
  }

  const subjectTopics = topics.filter((t) => t.subject_id === selectedSubject)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
        <p className="text-muted-foreground mt-2">Manage subjects, topics, and study materials</p>
      </div>

      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Add New Subject</CardTitle>
              <CardDescription>Create a new UPSC subject category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Subject name..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
                <Button onClick={handleAddSubject} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Existing Subjects</CardTitle>
              <CardDescription>Total: {subjects.length} subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : subjects.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No subjects yet. Create one above.</p>
                ) : (
                  subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">{subject.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Add New Topic</CardTitle>
              <CardDescription>Create a new topic under a subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Select Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background mt-1"
                  >
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Topic name..."
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                  />
                  <Button onClick={handleAddTopic} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>
                Topics in {subjects.find((s) => s.id === selectedSubject)?.name || "Selected Subject"}
              </CardTitle>
              <CardDescription>Total: {subjectTopics.length} topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : subjectTopics.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No topics yet. Create one above.</p>
                ) : (
                  subjectTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50"
                    >
                      <p className="font-medium text-sm">{topic.name}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
