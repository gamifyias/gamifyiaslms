"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { useDojo } from "@/hooks/useDojo"
import { completeRevision } from "@/lib/dojo/dojoSystem"

interface TrainingDojoProps {
  studentId: string
}

export function TrainingDojo({ studentId }: TrainingDojoProps) {
  const [localLoading, setLocalLoading] = useState(false)
  const { tabs: dojoTabs, loading, error, handleCompleteRevision, refetchTabs } = useDojo(studentId)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load training sessions: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const totalRevisions = dojoTabs.overdue.length + dojoTabs.today.length + dojoTabs.upcoming.length

  if (totalRevisions === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">
            No training sessions scheduled yet. Start by opening study materials to begin your revision schedule!
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleComplete = async (revisionId: string) => {
    setLocalLoading(true)
    try {
      await handleCompleteRevision(revisionId)
      await refetchTabs()
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{dojoTabs.overdue.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{dojoTabs.today.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{dojoTabs.upcoming.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue */}
      {dojoTabs.overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">🔴 Overdue ({dojoTabs.overdue.length})</CardTitle>
            </div>
            <CardDescription>Complete these revisions immediately</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dojoTabs.overdue.map((rev) => (
              <div key={rev.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                <div>
                  <p className="font-medium text-sm">{rev.material_type.toUpperCase()} - Revision {rev.revision_number}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(rev.due_date).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleComplete(rev.id)}
                  disabled={localLoading}
                  className="gap-1"
                >
                  <Check className="h-3 w-3" />
                  Complete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today */}
      {dojoTabs.today.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">🟠 Today ({dojoTabs.today.length})</CardTitle>
            </div>
            <CardDescription>Complete these revisions today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dojoTabs.today.map((rev) => (
              <div key={rev.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-100">
                <div>
                  <p className="font-medium text-sm">{rev.material_type.toUpperCase()} - Revision {rev.revision_number}</p>
                  <p className="text-xs text-muted-foreground">
                    Due today at {new Date(rev.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleComplete(rev.id)}
                  disabled={localLoading}
                  className="gap-1"
                >
                  <Check className="h-3 w-3" />
                  Complete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      {dojoTabs.upcoming.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">🟢 Upcoming ({dojoTabs.upcoming.length})</CardTitle>
            </div>
            <CardDescription>These are coming up soon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dojoTabs.upcoming.map((rev) => (
              <div key={rev.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100">
                <div>
                  <p className="font-medium text-sm">{rev.material_type.toUpperCase()} - Revision {rev.revision_number}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(rev.due_date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
