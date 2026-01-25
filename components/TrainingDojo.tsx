"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Check, Loader2, Calendar, Clock, Lock } from "lucide-react"
import { getDojoRevisions, completeRevision, type DojoTabs } from "@/lib/dojo/dojoSystem"

interface TrainingDojoProps {
  studentId: string
}

export function TrainingDojo({ studentId }: TrainingDojoProps) {
  const [tabs, setTabs] = useState<DojoTabs>({ overdue: [], today: [], upcoming: [] })
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getDojoRevisions(studentId)
      setTabs(data)
    } catch (error) {
      console.error("Failed to load revisions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [studentId])

  const handleComplete = async (revisionId: string) => {
    setCompletingId(revisionId)
    await completeRevision(revisionId)
    await loadData() // Refresh list
    setCompletingId(null)
  }

  // --- Reusable Card Component ---
  const RevisionItem = ({ rev, variant }: { rev: any, variant: 'red' | 'yellow' | 'green' }) => {
    const isUpcoming = variant === 'green'
    
    // 1. Explicit Style Maps (Fixes hover issues and makes styling cleaner)
    const cardStyles = {
      red: "border-red-200 bg-red-50/50",
      yellow: "border-yellow-200 bg-yellow-50/50",
      green: "border-green-200 bg-green-50/50",
    }[variant]

    const badgeStyles = {
      red: "bg-red-100 text-red-800 border-red-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200",
    }[variant]

    // 2. The "Best" Button Styles: White w/ Border -> Fills Color on Hover
    const buttonStyles = {
      red: "bg-white text-red-600 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600",
      yellow: "bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-500 hover:text-white hover:border-yellow-500",
      green: "bg-muted text-muted-foreground border-transparent cursor-not-allowed",
    }[variant]

    return (
      <div 
        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${cardStyles}`}
      >
        
        {/* Left Side: Topic Details */}
        <div className="space-y-2 mb-3 sm:mb-0 flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${badgeStyles} font-bold uppercase text-[10px] tracking-wider px-2 py-0.5`}>
              {rev.material_type}
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground tracking-wide">
              REVISION {rev.revision_number}
            </span>
          </div>
          
          <div>
            <h4 className="font-bold text-lg text-foreground leading-tight truncate">
              {rev.topics?.name || "Untitled Topic"}
            </h4>
            {rev.topics?.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {rev.topics.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
               <Calendar className="w-3 h-3" />
               {new Date(rev.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
            {variant === 'yellow' && (
               <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(rev.due_date).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
               </div>
            )}
          </div>
        </div>

        {/* Right Side: Action Button */}
        <div className="flex-shrink-0">
          <Button
            onClick={(e) => {
                // 3. STOP PROPAGATION: Prevents the card click (if you add one later)
                e.stopPropagation(); 
                handleComplete(rev.id);
            }}
            disabled={completingId === rev.id || isUpcoming}
            size="sm"
            className={`w-full sm:w-auto min-w-[120px] transition-all border shadow-sm ${buttonStyles}`}
            variant="ghost" // We override styles via className, but ghost removes default shadcn bg
          >
            {completingId === rev.id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : isUpcoming ? (
              <>
                <Lock className="h-3.5 w-3.5 mr-2 opacity-70" />
                Locked
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Mark Done
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex justify-center h-64 items-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
    </div>
  )

  const totalCount = tabs.overdue.length + tabs.today.length + tabs.upcoming.length
  
  if (totalCount === 0) {
    return (
      <Card className="bg-slate-50 border-dashed">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full flex items-center justify-center mb-4">
             <Check className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">All Caught Up!</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            You have no pending revisions. Go to the Study Library to start learning new topics.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-100 bg-red-50/30 shadow-none">
           <CardContent className="p-4 text-center">
             <div className="text-2xl font-black text-red-600">{tabs.overdue.length}</div>
             <div className="text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-wider">Overdue</div>
           </CardContent>
        </Card>
        <Card className="border-yellow-100 bg-yellow-50/30 shadow-none">
           <CardContent className="p-4 text-center">
             <div className="text-2xl font-black text-yellow-600">{tabs.today.length}</div>
             <div className="text-[10px] sm:text-xs font-bold text-yellow-400 uppercase tracking-wider">Today</div>
           </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50/30 shadow-none">
           <CardContent className="p-4 text-center">
             <div className="text-2xl font-black text-green-600">{tabs.upcoming.length}</div>
             <div className="text-[10px] sm:text-xs font-bold text-green-400 uppercase tracking-wider">Upcoming</div>
           </CardContent>
        </Card>
      </div>

      {/* Revision Lists */}
      
      {tabs.overdue.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h3 className="flex items-center gap-2 text-lg font-bold text-red-700 px-1">
            <AlertCircle className="w-5 h-5" /> Overdue
          </h3>
          {tabs.overdue.map(rev => <RevisionItem key={rev.id} rev={rev} variant="red" />)}
        </div>
      )}

      {tabs.today.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <h3 className="flex items-center gap-2 text-lg font-bold text-yellow-700 px-1">
            <AlertCircle className="w-5 h-5" /> Due Today
          </h3>
          {tabs.today.map(rev => <RevisionItem key={rev.id} rev={rev} variant="yellow" />)}
        </div>
      )}

      {tabs.upcoming.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-1000">
          <h3 className="flex items-center gap-2 text-lg font-bold text-green-700 px-1">
            <Check className="w-5 h-5" /> Upcoming
          </h3>
          {tabs.upcoming.map(rev => <RevisionItem key={rev.id} rev={rev} variant="green" />)}
        </div>
      )}
    </div>
  )
}