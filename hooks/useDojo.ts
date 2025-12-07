import { useState, useCallback, useEffect } from "react"
import { fetchDojoTabs, DojoTabs, completeRevision } from "@/lib/dojo/dojoSystem"

export const useDojo = (studentId: string) => {
  const [tabs, setTabs] = useState<DojoTabs>({ overdue: [], today: [], upcoming: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTabs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const dojoTabs = await fetchDojoTabs(studentId)
      setTabs(dojoTabs)
    } catch (err) {
      console.error("Error fetching DOJO tabs:", err)
      setError("Failed to load revisions")
      setTabs({ overdue: [], today: [], upcoming: [] })
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchTabs()
  }, [fetchTabs])

  const handleCompleteRevision = useCallback(
    async (revisionId: string): Promise<boolean> => {
      try {
        const success = await completeRevision(revisionId, studentId)
        if (success) {
          await fetchTabs()
        }
        return success
      } catch (err) {
        console.error("Error completing revision:", err)
        return false
      }
    },
    [studentId, fetchTabs]
  )

  return {
    tabs,
    loading,
    error,
    handleCompleteRevision,
    refetchTabs: fetchTabs,
  }
}
