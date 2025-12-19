"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion, AnimatePresence, cubicBezier } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Sword, BookOpen, Trophy, BarChart3, Users } from "lucide-react"

/* ------------------ ANIMATION PRESETS ------------------ */

const ease = cubicBezier(0.22, 1, 0.36, 1)

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const letter = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

/* ------------------ WELCOME INTRO ------------------ */

function WelcomeIntro({ onFinish }: { onFinish: () => void }) {
  const title = "GAMIFY IAS".split("")

  useEffect(() => {
    const t = setTimeout(onFinish, 2600)
    return () => clearTimeout(t)
  }, [onFinish])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E14]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        className="flex gap-1"
      >
        {title.map((char, i) => (
          <motion.span
            key={i}
            variants={letter}
            transition={{
              duration: 0.6,
              ease,
              delay: i * 0.08,
            }}
            className="
              text-5xl md:text-6xl font-bold
              text-[#E6C77D]
              tracking-wide
            "
          >
            {char}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  )
}

/* ------------------ MAIN PAGE ------------------ */

export default function Home() {
  const [showIntro, setShowIntro] = useState(true)

  const features = [
    {
      icon: BookOpen,
      title: "Ancient Knowledge Scrolls",
      description:
        "Well-structured UPSC learning paths with clarity and depth.",
    },
    {
      icon: Sword,
      title: "Trials & Battles",
      description:
        "XP-based assessments that reward consistency and discipline.",
    },
    {
      icon: Trophy,
      title: "Hall of Glory",
      description:
        "Leaderboards, ranks, and achievement-based motivation.",
    },
    {
      icon: BarChart3,
      title: "Battle Analytics",
      description:
        "Deep insights into accuracy, strength, and improvement areas.",
    },
    {
      icon: Users,
      title: "Guild Masters",
      description:
        "Mentor-driven guidance with structured performance reviews.",
    },
    {
      icon: BookOpen,
      title: "Endless Practice Grounds",
      description:
        "Unlimited, exam-aligned practice modules refined for UPSC.",
    },
  ]

  return (
    <>
      {/* INTRO */}
      <AnimatePresence>
        {showIntro && (
          <WelcomeIntro onFinish={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {/* PAGE CONTENT */}
      <div className="w-full bg-[#0B0E14] text-[#E6E9F0]">
        {/* HERO */}
        <section className="min-h-screen flex items-center justify-center px-4 py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.9, ease }}
            className="max-w-5xl text-center space-y-10"
          >
            <p className="text-xs tracking-[0.3em] uppercase text-[#9AA3B2]">
              Strategy • Discipline • Mastery
            </p>

            <h1 className="text-5xl md:text-6xl font-bold text-[#E6C77D]">
              Gamify IAS
              <span className="block text-[#E6E9F0] mt-2">
                Academy
              </span>
            </h1>

            <p className="text-lg max-w-2xl mx-auto text-[#9AA3B2]">
              A game-inspired UPSC preparation system built for
              long-term consistency and elite performance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button className="bg-[#C9A24D] text-[#0B0E14] hover:bg-[#E6C77D]">
                  Begin Journey
                </Button>
              </Link>

              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="border-[#C9A24D] text-[#C9A24D]"
                >
                  Continue
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* FEATURES */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ delay: i * 0.08, ease}}
                >
                  <Card className="bg-[#141824] border border-[#2A2F45] hover:border-[#C9A24D] transition-colors">
                    <CardHeader>
                      <Icon className="w-7 h-7 text-[#C9A24D] mb-2" />
                      <CardTitle className="text-[#9AA3B2]">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-[#9AA3B2]">
                        {f.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
