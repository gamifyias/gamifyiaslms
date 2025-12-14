import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Sword, BookOpen, Trophy, BarChart3, Users } from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: "Ancient Knowledge Scrolls",
      description:
        "Explore well-structured UPSC knowledge across all worlds with scrolls, visions, and manuscripts.",
    },
    {
      icon: Sword,
      title: "Trials & Battles",
      description:
        "Face challenging trials, earn XP, unlock levels, and grow stronger with every victory.",
    },
    {
      icon: Trophy,
      title: "Hall of Glory",
      description:
        "Rise through the High Scores and etch your name among elite aspirants.",
    },
    {
      icon: BarChart3,
      title: "Battle Analytics",
      description:
        "Study your accuracy, consistency, and weaknesses after every trial.",
    },
    {
      icon: Users,
      title: "Guild Masters",
      description:
        "Train under experienced mentors who guide you through your journey.",
    },
    {
      icon: BookOpen,
      title: "Endless Practice Grounds",
      description:
        "Sharpen your skills with unlimited practice trials aligned with UPSC patterns.",
    },
  ]

  return (
    <div className="w-full bg-[#F6E7C1] text-[#3B2A23]">
      {/* HERO / GAME INTRO */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl text-center space-y-10">
          <div className="space-y-4">
            <p className="text-sm tracking-widest uppercase">
              ⚔️ Welcome to the Realm
            </p>
            <h1 className="text-5xl md:text-6xl font-bold">
              Gamify IAS
              <span className="block text-[#8B5A2B]">
                Academy
              </span>
            </h1>
            <p className="text-lg max-w-2xl mx-auto">
              A gamified UPSC preparation realm where aspirants become warriors,
              trials forge champions, and discipline builds legends.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="border-2 border-[#3B2A23] bg-[#C47A2C] text-[#3B2A23] hover:bg-[#B96C1E]"
              >
                Sign Up
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#3B2A23] bg-transparent text-[#3B2A23]"
              >
                Login
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-12">
            {[
              { label: "Active Warriors", value: "100+" },
              { label: "Trials Available", value: "25K+" },
              { label: "Victory Rate", value: "95%" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="border-2 border-[#8B5A2B] bg-[#F2DEB3] p-4"
              >
                <div className="text-2xl font-bold">
                  {stat.value}
                </div>
                <div className="text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES / QUEST SYSTEM */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">
              Why Enter This Realm?
            </h2>
            <p className="text-lg max-w-2xl mx-auto">
              Everything required to conquer the UPSC trials lies within this
              world.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card
                  key={idx}
                  className="border-2 border-[#8B5A2B] bg-[#F2DEB3]"
                >
                  <CardHeader>
                    <Icon className="w-8 h-8 mb-2" />
                    <CardTitle className="text-lg">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 bg-[#EAD39C]">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold">
            Your Journey Awaits
          </h2>
          <p className="text-lg">
            Thousands have entered this realm.
            <br />
            Few emerge as legends.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="border-2 border-[#3B2A23] bg-[#C47A2C] text-[#3B2A23]"
            >
              Enter the Realm
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
