"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"

interface ProfileFormProps {
  profile: {
    bio: string
    phone: string
  }
  studentProfile: {
    preferred_subjects: string[]
  }
  onProfileChange: (data: {
    bio?: string
    phone?: string
    preferred_subjects?: string[]
  }) => void
}

interface Subject {
  id: string
  name: string
}

export function ProfileForm({
  profile,
  studentProfile,
  onProfileChange,
}: ProfileFormProps) {
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  useEffect(() => {
    const fetchSubjects = async () => {
      const supabase = createClient()
      setLoadingSubjects(true)
      try {
        const { data, error } = await supabase.from("subjects").select("id, name")
        if (error) throw error
        setAllSubjects(data || [])
      } catch (error) {
        console.error("Error fetching subjects:", error)
      } finally {
        setLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [])
  
  const handleSubjectsChange = (newSubjects: string[]) => {
    onProfileChange({ preferred_subjects: newSubjects })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Tell us more about yourself and your study preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bio">Biography</Label>
          <Textarea
            id="bio"
            placeholder="A short bio about your goals and interests..."
            value={profile.bio || ""}
            onChange={(e) => onProfileChange({ bio: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Your contact number"
            value={profile.phone || ""}
            onChange={(e) => onProfileChange({ phone: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Label>Preferred Subjects</Label>
          <p className="text-sm text-muted-foreground">Select the subjects you are most interested in.</p>
          {loadingSubjects ? (
             <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          ) : (
            <ToggleGroup
                type="multiple"
                variant="outline"
                value={studentProfile.preferred_subjects || []}
                onValueChange={handleSubjectsChange}
                className="flex flex-wrap justify-start gap-2"
            >
                {allSubjects.map((subject) => (
                    <ToggleGroupItem 
                        key={subject.id} 
                        value={subject.name}
                        className="rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                        {subject.name}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
