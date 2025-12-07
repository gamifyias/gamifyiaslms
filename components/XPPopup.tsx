"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"

interface XPPopupProps {
  xp: number
  show: boolean
  duration?: number
}

export function XPPopup({ xp, show, duration = 1500 }: XPPopupProps) {
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => setIsVisible(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!isVisible) return null

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <div className="animate-bounce">
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-6 py-3 rounded-full font-bold shadow-lg border border-yellow-300">
          <Zap className="h-5 w-5 animate-pulse" />
          <span>+{xp} XP</span>
        </div>
      </div>
    </div>
  )
}
