"use client";
export const dynamic = "force-dynamic";



import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MentorSidebar } from "@/components/mentor-sidebar"
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

export default function MentorSubjectsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

  const [topicsBySubject, setTopicsBySubject] = useState<Record<string, Topic[]>>({})
  const [materialsByTopic, setMaterialsByTopic] = useState<Record<string, StudyMaterial[]>>({})

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Subject forms
  const [newSubject, setNewSubject] = useState({ name: "", description: "" })
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  // Topic forms
  const [newTopic, setNewTopic] = useState<{ subjectId: string; name: string; description: string }>({
    subjectId: "",
    name: "",
    description: "",
  })
  const [editingTopic, setEditingTopic] = useState<{ subjectId: string; topic: Topic } | null>(null)

  // Material forms
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
  // Load subjects + user
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
        console.error(err)
        toast({ title: "Error", description: err.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // -----------------------------------
  // Load topics + materials for subject
  // -----------------------------------
  const loadTopicsAndMaterials = async (subjectId: string) => {
    try {
      const { data: topicsData, error: topicsErr } = await supabase
        .from("topics")
        .select("id, name, description, order_index")
        .eq("subject_id", subjectId)
        .order("order_index", { ascending: true })

      if (topicsErr) throw topicsErr

      const topics = (topicsData || []) as Topic[]
      setTopicsBySubject((prev) => ({ ...prev, [subjectId]: topics }))

      if (topics.length === 0) return

      const topicIds = topics.map((t) => t.id)

      const { data: materialsData, error: materialsErr } = await supabase
        .from("study_materials")
        .select("id, topic_id, title, content_type, resource_url, duration_minutes")
        .in("topic_id", topicIds)

      if (materialsErr) throw materialsErr

      const grouped: Record<string, StudyMaterial[]> = {}
      ;(materialsData || []).forEach((m: any) => {
        if (!grouped[m.topic_id]) grouped[m.topic_id] = []
        grouped[m.topic_id].push(m as StudyMaterial)
      })

      setMaterialsByTopic((prev) => ({ ...prev, ...grouped }))
    } catch (err) {
      console.error("Error loading topics/materials", err)
      toast({
        title: "Error",
        description: "Failed to load topics/materials",
        variant: "destructive",
      })
    }
  }

  // -----------------------------------
  // SUBJECT: Add / Update / Delete
  // -----------------------------------
  const handleAddSubject = async () => {
    try {
      if (!newSubject.name.trim()) return

      const { data, error } = await supabase
        .from("subjects")
        .insert({
          name: newSubject.name,
          description: newSubject.description || null,
        })
        .select()
        .single()

      if (error) throw error

      setSubjects((prev) => [...prev, data as Subject])
      setNewSubject({ name: "", description: "" })
      toast({ title: "Subject Added", description: "New subject created successfully." })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleUpdateSubject = async () => {
    if (!editingSubject) return
    try {
      const { id, name, description } = editingSubject
      const { data, error } = await supabase
        .from("subjects")
        .update({ name, description })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setSubjects((prev) => prev.map((s) => (s.id === id ? (data as Subject) : s)))
      setEditingSubject(null)
      toast({ title: "Subject Updated", description: "Changes have been saved." })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", subjectId)
      if (error) throw error

      setSubjects((prev) => prev.filter((s) => s.id !== subjectId))
      const copyTopics = { ...topicsBySubject }
      delete copyTopics[subjectId]
      setTopicsBySubject(copyTopics)
      toast({ title: "Subject Deleted", description: "Subject has been removed." })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  // -----------------------------------
  // TOPIC: Add / Update / Delete
  // -----------------------------------
  const handleAddTopic = async () => {
    const { subjectId, name, description } = newTopic
    if (!subjectId || !name.trim()) return

    try {
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

      if (error) throw error

      setTopicsBySubject((prev) => ({
        ...prev,
        [subjectId]: [...currentList, data as Topic],
      }))

      setNewTopic({ subjectId: "", name: "", description: "" })
      toast({ title: "Topic Added", description: "New topic created successfully." })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleUpdateTopic = async () => {
    if (!editingTopic) return
    try {
      const { subjectId, topic } = editingTopic
      const { id, name, description } = topic

      const { data, error } = await supabase
        .from("topics")
        .update({
          name,
          description: description || null,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setTopicsBySubject((prev) => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).map((t) =>
          t.id === id ? (data as Topic) : t,
        ),
      }))

      setEditingTopic(null)
      toast({ title: "Topic Updated", description: "Changes have been saved." })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteTopic = async (subjectId: string, topicId: string) => {
    try {
      const { error } = await supabase.from("topics").delete().eq("id", topicId)
      if (error) throw error

      setTopicsBySubject((prev) => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).filter((t) => t.id !== topicId),
      }))

      const matsCopy = { ...materialsByTopic }
      delete matsCopy[topicId]
      setMaterialsByTopic(matsCopy)

      toast({ title: "Topic Deleted", description: "Topic has been removed." })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  // -----------------------------------
  // MATERIAL: dialogs & CRUD
  // -----------------------------------
  const openCreateMaterialDialog = (topicId: string) => {
    setMaterialDialogMode("create")
    setMaterialDraft({
      topicId,
      title: "",
      content_type: "video",
      resource_url: "",
      duration_minutes: "",
    })
  }

  const openEditMaterialDialog = (material: StudyMaterial) => {
    setMaterialDialogMode("edit")
    setMaterialDraft({
      topicId: material.topic_id,
      id: material.id,
      title: material.title,
      content_type: material.content_type,
      resource_url: material.resource_url,
      duration_minutes: material.duration_minutes?.toString() || "",
    })
  }

  const handleSaveMaterial = async () => {
    const { id, topicId, title, content_type, resource_url, duration_minutes } = materialDraft
    if (!topicId || !title.trim()) return

    try {
      let data, error

      if (materialDialogMode === "create") {
        const payload: any = {
          topic_id: topicId,
          title,
          content_type,
          resource_url,
        }
        if (duration_minutes) payload.duration_minutes = Number(duration_minutes)
        if (currentUserId) payload.created_by = currentUserId

        const res = await supabase.from("study_materials").insert(payload).select().single()
        data = res.data
        error = res.error
      } else {
        const payload: any = {
          title,
          content_type,
          resource_url,
          duration_minutes: duration_minutes ? Number(duration_minutes) : null,
        }

        const res = await supabase
          .from("study_materials")
          .update(payload)
          .eq("id", id)
          .select()
          .single()

        data = res.data
        error = res.error
      }

      if (error) throw error

      setMaterialsByTopic((prev) => {
        const list = prev[topicId] || []
        if (materialDialogMode === "create") {
          return { ...prev, [topicId]: [...list, data as StudyMaterial] }
        }
        return {
          ...prev,
          [topicId]: list.map((m) =>
            m.id === (data as StudyMaterial).id ? (data as StudyMaterial) : m,
          ),
        }
      })

      toast({
        title: materialDialogMode === "create" ? "Material Added" : "Material Updated",
        description: "Changes have been saved.",
      })

      setMaterialDraft({
        topicId: "",
        title: "",
        content_type: "video",
        resource_url: "",
        duration_minutes: "",
      })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteMaterial = async (topicId: string, materialId: string) => {
    try {
      const { error } = await supabase.from("study_materials").delete().eq("id", materialId)
      if (error) throw error

      setMaterialsByTopic((prev) => ({
        ...prev,
        [topicId]: (prev[topicId] || []).filter((m) => m.id !== materialId),
      }))

      toast({ title: "Material Deleted", description: "Study material has been removed." })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  // -----------------------------------
  // Render
  // -----------------------------------
  if (loading) {
    return (
      <div className="flex h-screen">
        <MentorSidebar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <MentorSidebar />

      <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Subjects, Topics & Materials</h1>
            <p className="text-muted-foreground mt-1">
              Create subjects, add topics, and attach study materials for your students.
            </p>
          </div>

          {/* Add Subject */}
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

        {/* Subjects list */}
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
                    if (willExpand && !topicsBySubject[subject.id]) {
                      loadTopicsAndMaterials(subject.id)
                    }
                  }}
                >
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        <CardTitle className="text-xl">{subject.name}</CardTitle>
                      </div>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {subject.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Edit subject */}
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
                              placeholder="Subject Name"
                              value={editingSubject?.name || ""}
                              onChange={(e) =>
                                setEditingSubject((prev) =>
                                  prev ? { ...prev, name: e.target.value } : prev,
                                )
                              }
                            />
                            <Textarea
                              placeholder="Description"
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

                      {/* Delete subject */}
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
                              This will permanently delete the subject. Topics and materials will
                              not be auto-deleted unless you handle it separately in DB.
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

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {/* Add Topic */}
                    <Dialog
                      open={newTopic.subjectId === subject.id}
                      onOpenChange={(open) => {
                        if (open) {
                          setNewTopic({ subjectId: subject.id, name: "", description: "" })
                        } else {
                          setNewTopic({ subjectId: "", name: "", description: "" })
                        }
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
                            value={
                              newTopic.subjectId === subject.id ? newTopic.name : ""
                            }
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
                            value={
                              newTopic.subjectId === subject.id
                                ? newTopic.description
                                : ""
                            }
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

                    {/* Topics list */}
                    <div className="space-y-3 mt-2">
                      {subjectTopics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No topics added yet.
                        </p>
                      ) : (
                        subjectTopics.map((topic) => {
                          const materials = materialsByTopic[topic.id] || []

                          return (
                            <div
                              key={topic.id}
                              className="border rounded-lg p-4 space-y-3"
                            >
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
                                  {/* Edit Topic */}
                                  <Dialog
                                    open={editingTopic?.topic.id === topic.id}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setEditingTopic({
                                          subjectId: subject.id,
                                          topic: { ...topic },
                                        })
                                      } else {
                                        setEditingTopic(null)
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
                                                    topic: {
                                                      ...prev.topic,
                                                      name: e.target.value,
                                                    },
                                                  }
                                                : prev,
                                            )
                                          }
                                        />
                                        <Textarea
                                          placeholder="Description"
                                          value={
                                            editingTopic?.topic.description || ""
                                          }
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
                                        <Button
                                          className="w-full"
                                          onClick={handleUpdateTopic}
                                        >
                                          Save Changes
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  {/* Delete Topic */}
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
                                          This will delete the topic. Materials linked to
                                          this topic will not be deleted automatically
                                          unless you enforce it in DB.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-600 hover:bg-red-700"
                                          onClick={() =>
                                            handleDeleteTopic(subject.id, topic.id)
                                          }
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>

                              {/* Materials section */}
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-xs font-semibold text-muted-foreground">
                                  Study Materials
                                </p>

                                {/* Add Material */}
                                <Dialog
                                  open={
                                    materialDialogMode === "create" &&
                                    materialDraft.topicId === topic.id
                                  }
                                  onOpenChange={(open) => {
                                    if (open) openCreateMaterialDialog(topic.id)
                                    else
                                      setMaterialDraft({
                                        topicId: "",
                                        title: "",
                                        content_type: "video",
                                        resource_url: "",
                                        duration_minutes: "",
                                      })
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
                                        value={
                                          materialDraft.topicId === topic.id
                                            ? materialDraft.title
                                            : ""
                                        }
                                        onChange={(e) =>
                                          setMaterialDraft((prev) => ({
                                            ...prev,
                                            topicId: topic.id,
                                            title: e.target.value,
                                          }))
                                        }
                                      />
                                      <Input
                                        placeholder="Resource URL"
                                        value={
                                          materialDraft.topicId === topic.id
                                            ? materialDraft.resource_url
                                            : ""
                                        }
                                        onChange={(e) =>
                                          setMaterialDraft((prev) => ({
                                            ...prev,
                                            topicId: topic.id,
                                            resource_url: e.target.value,
                                          }))
                                        }
                                      />
                                      <Input
                                        placeholder="Duration (minutes, optional)"
                                        type="number"
                                        value={
                                          materialDraft.topicId === topic.id
                                            ? materialDraft.duration_minutes
                                            : ""
                                        }
                                        onChange={(e) =>
                                          setMaterialDraft((prev) => ({
                                            ...prev,
                                            topicId: topic.id,
                                            duration_minutes: e.target.value,
                                          }))
                                        }
                                      />
                                      <Input
                                        placeholder='Content type (e.g. "video", "pdf", "notes", "test")'
                                        value={
                                          materialDraft.topicId === topic.id
                                            ? materialDraft.content_type
                                            : "video"
                                        }
                                        onChange={(e) =>
                                          setMaterialDraft((prev) => ({
                                            ...prev,
                                            topicId: topic.id,
                                            content_type: e.target.value,
                                          }))
                                        }
                                      />
                                      <Button
                                        className="w-full"
                                        onClick={handleSaveMaterial}
                                      >
                                        Add Material
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
                                          Type: {m.content_type} •{" "}
                                          {m.duration_minutes
                                            ? `${m.duration_minutes} min`
                                            : "duration not set"}
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
                                            if (open) openEditMaterialDialog(m)
                                            else
                                              setMaterialDraft({
                                                topicId: "",
                                                title: "",
                                                content_type: "video",
                                                resource_url: "",
                                                duration_minutes: "",
                                              })
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
                                                placeholder="Duration (minutes, optional)"
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
                                                placeholder="Content type"
                                                value={materialDraft.content_type}
                                                onChange={(e) =>
                                                  setMaterialDraft((prev) => ({
                                                    ...prev,
                                                    content_type: e.target.value,
                                                  }))
                                                }
                                              />
                                              <Button
                                                className="w-full"
                                                onClick={handleSaveMaterial}
                                              >
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
                                              <AlertDialogTitle>
                                                Delete Material?
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will permanently delete this study material.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700"
                                                onClick={() =>
                                                  handleDeleteMaterial(topic.id, m.id)
                                                }
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
