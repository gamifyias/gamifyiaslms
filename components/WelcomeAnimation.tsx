"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Confetti } from "./Confetti"
import { Star } from "lucide-react"

export function WelcomeAnimation({ onClose }: { onClose?: () => void }) {
  const [show, setShow] = useState(true)
  const [triggerConfetti, setTriggerConfetti] = useState(false)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !mounted) return

        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle()

        const first = data?.full_name?.split(" ")[0] || "Player"
        setName(first)
      } catch (err) {
        // ignore
      }
    }

    load()

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!show) return
    setTriggerConfetti(true)
    const timer = setTimeout(() => setTriggerConfetti(false), 3000)
    const closeTimer = setTimeout(() => handleClose(), 6000)
    return () => { clearTimeout(timer); clearTimeout(closeTimer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const handleClose = () => {
    setShow(false)
    if (onClose) onClose()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center">
      <Confetti trigger={triggerConfetti} />

      {/* animated starry background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1f2937] to-[#0b1220] overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <radialGradient id="g1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffd54f" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ffd54f" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>
        <div className="absolute inset-0" aria-hidden>
          <div className="star field absolute inset-0">
            <div className="star-1" />
            <div className="star-2" />
            <div className="star-3" />
          </div>
        </div>
      </div>

      {/* overlay content */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="max-w-5xl w-full mx-6 md:mx-0 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#FFF7E0] to-[#F6E7C1] border-2 border-[#8B5A2B] shadow-2xl text-[#3B2A23]">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#EAD39C] border-4 border-[#3B2A23] flex items-center justify-center animate-pulse">
                <Star className="w-12 h-12 text-[#3B2A23]" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Welcome to
                <div className="text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-[#c47b00] to-[#ffd54f]"> Gamify IAS Academy</div>
              </h1>

              <p className="mt-4 text-sm md:text-base text-[#3B2A23] opacity-90">
                {`${name ?? "Learner"}, your UPSC journey becomes a game — earn XP, level up, and conquer topics.`}
              </p>

              <div className="mt-6 flex items-center gap-4 justify-center md:justify-start">
                <Button className="bg-[#3B2A23] text-white px-6 py-3" onClick={handleClose}>Start Learning</Button>
                <button className="text-sm text-[#3B2A23] underline" onClick={() => { setShow(false); if (onClose) onClose() }}>Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .star field { position: relative }
        .star-1::before, .star-2::before, .star-3::before {
          content: '';
          position: absolute;
          width: 6px; height: 6px; border-radius: 50%;
          background: radial-gradient(circle, #fff 0%, rgba(255,255,255,0) 60%);
          animation: twinkle 4s linear infinite;
        }
        .star-1::before { left: 10%; top: 20%; animation-delay: 0s }
        .star-2::before { left: 70%; top: 10%; animation-delay: 1.2s }
        .star-3::before { left: 40%; top: 60%; animation-delay: 2.1s }
        @keyframes twinkle { 0% { opacity: 0 } 50% { opacity: 1 } 100% { opacity: 0 } }
        .animate-pulse { animation: pulse 2.6s ease-in-out infinite }
        @keyframes pulse { 0% { transform: scale(1) } 50% { transform: scale(1.06) } 100% { transform: scale(1) } }
      `}</style>
    </div>
  )
}
