"use client";
export const dynamic = "force-dynamic";



import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Loader2,
  Plus,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react"

interface Subject {
  id: string
  name: string
  description: string | null
}

interface Topic {
  id: string
  name: string
  description: string | null
  order_index: number | null
}

interface StudyMaterial {
  id: string
  topic_id: string
  title: string
  content_type: string
  resource_url: string
  duration_minutes: number | null
}

export default function AdminSubjectsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

  const [topicsBySubject, setTopicsBySubject] = useState<Record<string, Topic[]>>({})
  const [materialsByTopic, setMaterialsByTopic] = useState<Record<string, StudyMaterial[]>>({})

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [newSubject, setNewSubject] = useState({ name: "", description: "" })
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  const [newTopic, setNewTopic] = useState<{ subjectId: string; name: string; description: string }>({
    subjectId: "",
    name: "",
    description: "",
  })
  const [editingTopic, setEditingTopic] = useState<{ subjectId: string; topic: Topic } | null>(null)

  const [materialDraft, setMaterialDraft] = useState<{
    topicId: string
    id?: string
    title: string
    content_type: string
    resource_url: string
    duration_minutes: string
  }>({
    topicId: "",
    title: "",
    content_type: "video",
    resource_url: "",
    duration_minutes: "",
  })

  const [materialDialogMode, setMaterialDialogMode] = useState<"create" | "edit">("create")

  // -----------------------------------
  // Load subjects
  // -----------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user?.id) setCurrentUserId(user.id)

        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .order("created_at", { ascending: true })

        if (error) throw error

        setSubjects((data as Subject[]) || [])
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ------------------------------------------
  // Load topics + materials
  // ------------------------------------------
  const loadTopicsAndMaterials = async (subjectId: string) => {
    try {
      const { data: topicsData } = await supabase
        .from("topics")
        .select("id, name, description, order_index")
        .eq("subject_id", subjectId)
        .order("order_index", { ascending: true })

      const topics = (topicsData || []) as Topic[]
      setTopicsBySubject((prev) => ({ ...prev, [subjectId]: topics }))

      if (topics.length === 0) return

      const topicIds = topics.map((t) => t.id)

      const { data: materialsData } = await supabase
        .from("study_materials")
        .select("*")
        .in("topic_id", topicIds)

      const grouped: Record<string, StudyMaterial[]> = {}
      ;(materialsData || []).forEach((m: any) => {
        if (!grouped[m.topic_id]) grouped[m.topic_id] = []
        grouped[m.topic_id].push(m)
      })

      setMaterialsByTopic((prev) => ({ ...prev, ...grouped }))
    } catch {
      toast({
        title: "Error",
        description: "Failed to load topics or materials.",
        variant: "destructive",
      })
    }
  }

  // ------------------------------------------
  // Add Subject
  // ------------------------------------------
  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) return

    const { data, error } = await supabase
      .from("subjects")
      .insert({
        name: newSubject.name,
        description: newSubject.description || null,
      })
      .select()
      .single()

    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" })

    setSubjects((prev) => [...prev, data as Subject])
    setNewSubject({ name: "", description: "" })
    toast({ title: "Subject Added" })
  }

  // ------------------------------------------
  // Update Subject
  // ------------------------------------------
  const handleUpdateSubject = async () => {
    if (!editingSubject) return

    const { id, name, description } = editingSubject

    const { data, error } = await supabase
      .from("subjects")
      .update({ name, description })
      .eq("id", id)
      .select()
      .single()

    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" })

    setSubjects((prev) => prev.map((s) => (s.id === id ? (data as Subject) : s)))
    setEditingSubject(null)
    toast({ title: "Subject Updated" })
  }

  // ------------------------------------------
  // Delete Subject
  // ------------------------------------------
  const handleDeleteSubject = async (subjectId: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", subjectId)

    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" })

    setSubjects((prev) => prev.filter((s) => s.id !== subjectId))
    toast({ title: "Subject Deleted" })
  }

  // ------------------------------------------
  // Add Topic
  // ------------------------------------------
  const handleAddTopic = async () => {
    const { subjectId, name, description } = newTopic
    if (!subjectId || !name.trim()) return

    const currentList = topicsBySubject[subjectId] || []
    const nextOrderIndex = currentList.length

    const { data, error } = await supabase
      .from("topics")
      .insert({
        subject_id: subjectId,
        name,
        description: description || null,
        order_index: nextOrderIndex,
      })
      .select()
      .single()

    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" })

    setTopicsBySubject((prev) => ({
      ...prev,
      [subjectId]: [...currentList, data as Topic],
    }))

    setNewTopic({ subjectId: "", name: "", description: "" })
    toast({ title: "Topic Added" })
  }

  // ------------------------------------------
  // Update Topic
  // ------------------------------------------
  const handleUpdateTopic = async () => {
    if (!editingTopic) return

    const { subjectId, topic } = editingTopic
    const { id, name, description } = topic

    const { data, error } = await supabase
      .from("topics")
      .update({ name, description: description || null })
      .eq("id", id)
      .select()
      .single()

    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" })

    setTopicsBySubject((prev) => ({
      ...prev,
      [subjectId]: prev[subjectId].map((t) => (t.id === id ? (data as Topic) : t)),
    }))

    setEditingTopic(null)
    toast({ title: "Topic Updated" })
  }

  // ------------------------------------------
  // Delete Topic
  // ------------------------------------------
  const handleDeleteTopic = async (subjectId: string, topicId: string) => {
    const { error } = await supabase.from("topics").delete().eq("id", topicId)

    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" })

    setTopicsBySubject((prev) => ({
      ...prev,
      [subjectId]: prev[subjectId].filter((t) => t.id !== topicId),
    }))

    toast({ title: "Topic Deleted" })
  }

  // ------------------------------------------
  // Save Material
  // ------------------------------------------
  const handleSaveMaterial = async () => {
    const { id, topicId, title, content_type, resource_url, duration_minutes } = materialDraft

    if (!topicId || !title.trim()) return

    let data, error

    if (materialDialogMode === "create") {
      const res = await supabase
        .from("study_materials")
        .insert({
          topic_id: topicId,
          title,
          content_type,
          resource_url,
          duration_minutes: duration_minutes ? Number(duration_minutes) : null,
          created_by: currentUserId,
        })
        .select()
        .single()

      data = res.data
      error = res.error
    } else {
      const res = await supabase
        .from("study_materials")
        .update({
          title,
          content_type,
          resource_url,
          duration_minutes: duration_minutes ? Number(duration_minutes) : null,
        })
        .eq("id", id)
        .select()
        .single()

      data = res.data
      error = res.error
    }

    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" })

    setMaterialsByTopic((prev) => {
      const list = prev[topicId] || []
      if (materialDialogMode === "create") {
        return { ...prev, [topicId]: [...list, data as StudyMaterial] }
      }
      return {
        ...prev,
        [topicId]: list.map((m) => (m.id === (data as StudyMaterial).id ? (data as StudyMaterial) : m)),
      }
    })

    toast({
      title: materialDialogMode === "create" ? "Material Added" : "Material Updated",
    })

    setMaterialDraft({
      topicId: "",
      title: "",
      content_type: "video",
      resource_url: "",
      duration_minutes: "",
    })
  }

  // ------------------------------------------
  // Delete Material
  // ------------------------------------------
  const handleDeleteMaterial = async (topicId: string, materialId: string) => {
    const { error } = await supabase.from("study_materials").delete().eq("id", materialId)

    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" })

    setMaterialsByTopic((prev) => ({
      ...prev,
      [topicId]: prev[topicId].filter((m) => m.id !== materialId),
    }))

    toast({ title: "Material Deleted" })
  }

  // ------------------------------------------
  // Render UI
  // ------------------------------------------
  if (loading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />

      <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin: Subjects, Topics & Materials</h1>
            <p className="text-muted-foreground mt-1">
              Administrators can fully manage subjects, topics, and materials.
            </p>
          </div>

          {/* Create Subject */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Subject Name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject((prev) => ({ ...prev, description: e.target.value }))}
                />
                <Button className="w-full" onClick={handleAddSubject}>
                  Add Subject
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subject List */}
        <div className="space-y-6">
          {subjects.map((subject) => {
            const isExpanded = expandedSubject === subject.id
            const subjectTopics = topicsBySubject[subject.id] || []

            return (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => {
                    const willExpand = !isExpanded
                    setExpandedSubject(willExpand ? subject.id : null)
                    if (willExpand && !topicsBySubject[subject.id]) loadTopicsAndMaterials(subject.id)
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        <CardTitle className="text-xl">{subject.name}</CardTitle>
                      </div>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground mt-1">{subject.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Edit Subject */}
                      <Dialog
                        open={editingSubject?.id === subject.id}
                        onOpenChange={(open) => {
                          if (open) setEditingSubject(subject)
                          else setEditingSubject(null)
                        }}
                      >
                        <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="outline">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Subject</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              value={editingSubject?.name || ""}
                              onChange={(e) =>
                                setEditingSubject((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                              }
                            />
                            <Textarea
                              value={editingSubject?.description || ""}
                              onChange={(e) =>
                                setEditingSubject((prev) =>
                                  prev ? { ...prev, description: e.target.value } : prev,
                                )
                              }
                            />
                            <Button className="w-full" onClick={handleUpdateSubject}>
                              Save Changes
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Delete Subject */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="outline">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the subject.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteSubject(subject.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded section */}
                {isExpanded && (
                  <CardContent className="space-y-4">
                    {/* Add Topic */}
                    <Dialog
                      open={newTopic.subjectId === subject.id}
                      onOpenChange={(open) => {
                        if (open) setNewTopic({ subjectId: subject.id, name: "", description: "" })
                        else setNewTopic({ subjectId: "", name: "", description: "" })
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Topic
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Topic to {subject.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Topic Name"
                            value={newTopic.subjectId === subject.id ? newTopic.name : ""}
                            onChange={(e) =>
                              setNewTopic({
                                subjectId: subject.id,
                                name: e.target.value,
                                description: newTopic.description,
                              })
                            }
                          />
                          <Textarea
                            placeholder="Description (optional)"
                            value={newTopic.subjectId === subject.id ? newTopic.description : ""}
                            onChange={(e) =>
                              setNewTopic({
                                subjectId: subject.id,
                                name: newTopic.name,
                                description: e.target.value,
                              })
                            }
                          />
                          <Button className="w-full" onClick={handleAddTopic}>
                            Add Topic
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* List topics */}
                    <div className="space-y-3 mt-2">
                      {subjectTopics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No topics added yet.</p>
                      ) : (
                        subjectTopics.map((topic) => {
                          const materials = materialsByTopic[topic.id] || []

                          return (
                            <div key={topic.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">{topic.name}</p>
                                  {topic.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {topic.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Edit topic */}
                                  <Dialog
                                    open={editingTopic?.topic.id === topic.id}
                                    onOpenChange={(open) => {
                                      if (open)
                                        setEditingTopic({ subjectId: subject.id, topic: { ...topic } })
                                      else setEditingTopic(null)
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button size="icon" variant="outline">
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Topic</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <Input
                                          placeholder="Topic Name"
                                          value={editingTopic?.topic.name || ""}
                                          onChange={(e) =>
                                            setEditingTopic((prev) =>
                                              prev
                                                ? {
                                                    ...prev,
                                                    topic: { ...prev.topic, name: e.target.value },
                                                  }
                                                : prev,
                                            )
                                          }
                                        />
                                        <Textarea
                                          placeholder="Description"
                                          value={editingTopic?.topic.description || ""}
                                          onChange={(e) =>
                                            setEditingTopic((prev) =>
                                              prev
                                                ? {
                                                    ...prev,
                                                    topic: {
                                                      ...prev.topic,
                                                      description: e.target.value,
                                                    },
                                                  }
                                                : prev,
                                            )
                                          }
                                        />
                                        <Button className="w-full" onClick={handleUpdateTopic}>
                                          Save Changes
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  {/* Delete topic */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="outline">
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will delete the topic.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-600 hover:bg-red-700"
                                          onClick={() => handleDeleteTopic(subject.id, topic.id)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>

                              {/* Study materials */}
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-xs font-semibold text-muted-foreground">
                                  Study Materials
                                </p>

                                {/* Add material */}
                                <Dialog
                                  open={
                                    materialDialogMode === "create" && materialDraft.topicId === topic.id
                                  }
                                  onOpenChange={(open) => {
                                    if (open) {
                                      setMaterialDialogMode("create")
                                      setMaterialDraft({
                                        topicId: topic.id,
                                        title: "",
                                        content_type: "video",
                                        resource_url: "",
                                        duration_minutes: "",
                                      })
                                    } else {
                                      setMaterialDraft({
                                        topicId: "",
                                        title: "",
                                        content_type: "video",
                                        resource_url: "",
                                        duration_minutes: "",
                                      })
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="gap-1">
                                      <Plus className="w-4 h-4" />
                                      Add Material
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Add Material to {topic.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <Input
                                        placeholder="Title"
                                        value={materialDraft.title}
                                        onChange={(e) =>
                                          setMaterialDraft((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                          }))
                                        }
                                      />
                                      <Input
                                        placeholder="Resource URL"
                                        value={materialDraft.resource_url}
                                        onChange={(e) =>
                                          setMaterialDraft((prev) => ({
                                            ...prev,
                                            resource_url: e.target.value,
                                          }))
                                        }
                                      />
                                      <Input
                                        placeholder="Duration (minutes)"
                                        type="number"
                                        value={materialDraft.duration_minutes}
                                        onChange={(e) =>
                                          setMaterialDraft((prev) => ({
                                            ...prev,
                                            duration_minutes: e.target.value,
                                          }))
                                        }
                                      />
                                      <Input
                                        placeholder="Content Type (video/pdf/notes/test)"
                                        value={materialDraft.content_type}
                                        onChange={(e) =>
                                          setMaterialDraft((prev) => ({
                                            ...prev,
                                            content_type: e.target.value,
                                          }))
                                        }
                                      />

                                      <Button className="w-full" onClick={handleSaveMaterial}>
                                        Save Material
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>

                              {/* Materials list */}
                              <div className="space-y-2 mt-2">
                                {materials.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">
                                    No materials added for this topic yet.
                                  </p>
                                ) : (
                                  materials.map((m) => (
                                    <div
                                      key={m.id}
                                      className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium">{m.title}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {m.content_type} •{" "}
                                          {m.duration_minutes
                                            ? `${m.duration_minutes} min`
                                            : "no duration"}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {/* Edit material */}
                                        <Dialog
                                          open={
                                            materialDialogMode === "edit" &&
                                            materialDraft.id === m.id
                                          }
                                          onOpenChange={(open) => {
                                            if (open) {
                                              setMaterialDialogMode("edit")
                                              setMaterialDraft({
                                                topicId: m.topic_id,
                                                id: m.id,
                                                title: m.title,
                                                content_type: m.content_type,
                                                resource_url: m.resource_url,
                                                duration_minutes: m.duration_minutes?.toString() || "",
                                              })
                                            } else {
                                              setMaterialDraft({
                                                topicId: "",
                                                title: "",
                                                content_type: "video",
                                                resource_url: "",
                                                duration_minutes: "",
                                              })
                                            }
                                          }}
                                        >
                                          <DialogTrigger asChild>
                                            <Button size="icon" variant="outline">
                                              <Pencil className="w-4 h-4" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Edit Material</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                              <Input
                                                value={materialDraft.title}
                                                onChange={(e) =>
                                                  setMaterialDraft((prev) => ({
                                                    ...prev,
                                                    title: e.target.value,
                                                  }))
                                                }
                                              />
                                              <Input
                                                value={materialDraft.resource_url}
                                                onChange={(e) =>
                                                  setMaterialDraft((prev) => ({
                                                    ...prev,
                                                    resource_url: e.target.value,
                                                  }))
                                                }
                                              />
                                              <Input
                                                type="number"
                                                value={materialDraft.duration_minutes}
                                                onChange={(e) =>
                                                  setMaterialDraft((prev) => ({
                                                    ...prev,
                                                    duration_minutes: e.target.value,
                                                  }))
                                                }
                                              />
                                              <Input
                                                value={materialDraft.content_type}
                                                onChange={(e) =>
                                                  setMaterialDraft((prev) => ({
                                                    ...prev,
                                                    content_type: e.target.value,
                                                  }))
                                                }
                                              />
                                              <Button className="w-full" onClick={handleSaveMaterial}>
                                                Save Changes
                                              </Button>
                                            </div>
                                          </DialogContent>
                                        </Dialog>

                                        {/* Delete material */}
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="outline">
                                              <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Material?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will permanently remove the study material.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700"
                                                onClick={() => handleDeleteMaterial(topic.id, m.id)}
                                              >
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
