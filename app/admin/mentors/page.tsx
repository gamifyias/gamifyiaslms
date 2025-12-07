export const dynamic = "force-dynamic";

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminSidebar } from "@/components/admin-sidebar"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, UserPlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function AdminMentorManagementPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [mentors, setMentors] = useState<any[]>([])
  const [filteredMentors, setFilteredMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const loadMentors = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("mentor_profiles")
          .select(`
            id,
            profile_id,
            specialization,
            years_of_experience,
            rating,
            total_students,
            availability,
            profiles (
              full_name,
              email,
              phone,
              avatar_url
            )
          `)

        if (error) throw error

        setMentors(data || [])
        setFilteredMentors(data || [])
      } catch (err: any) {
        console.error(err)
        toast({
          title: "Error",
          description: err.message || "Failed to load mentors",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMentors()
  }, [])

  useEffect(() => {
    const term = search.toLowerCase()
    const result = mentors.filter((m) => {
      const name = m.profiles?.full_name || ""
      const email = m.profiles?.email || ""
      return (
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term)
      )
    })
    setFilteredMentors(result)
  }, [search, mentors])

  const deleteMentor = async (mentorId: string) => {
    const ok = confirm("Are you sure you want to delete this mentor?")
    if (!ok) return

    try {
      const { error } = await supabase
        .from("mentor_profiles")
        .delete()
        .eq("id", mentorId)

      if (error) throw error

      setMentors((prev) => prev.filter((m) => m.id !== mentorId))
      setFilteredMentors((prev) => prev.filter((m) => m.id !== mentorId))

      toast({
        title: "Mentor removed",
        description: "The mentor has been deleted successfully.",
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error deleting mentor",
        description: err.message || "Something went wrong",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Mentor Management</h2>
            <p className="text-muted-foreground mt-2">
              View and manage all mentors in Gamify IAS Academy.
            </p>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Mentors</CardTitle>
              <CardDescription>
                Total: {filteredMentors.length} mentor
                {filteredMentors.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Search + Add */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mentors by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Button className="gap-2" disabled>
                  <UserPlus className="w-4 h-4" />
                  Add Mentor
                </Button>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading mentors...
                  </div>
                ) : filteredMentors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No mentors found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredMentors.map((mentor) => (
                        <TableRow key={mentor.id} className="hover:bg-secondary/40">
                          <TableCell className="font-medium">
                            {mentor.profiles?.full_name || "Unknown"}
                          </TableCell>

                          <TableCell className="text-sm text-muted-foreground">
                            {mentor.profiles?.email || "-"}
                          </TableCell>

                          <TableCell className="text-sm">
                            {mentor.profiles?.phone || "-"}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {mentor.specialization || "N/A"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm">
                            {mentor.years_of_experience || 0} yrs
                          </TableCell>

                          <TableCell className="text-sm">
                            ⭐ {Number(mentor.rating ?? 0).toFixed(1)}
                          </TableCell>

                          <TableCell className="text-sm">
                            {mentor.total_students ?? 0}
                          </TableCell>

                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => deleteMentor(mentor.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
