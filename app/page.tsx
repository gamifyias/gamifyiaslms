import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, BookOpen, Trophy, BarChart3, Users } from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: "Comprehensive Study Materials",
      description: "Access organized study materials across all UPSC subjects with video, articles, and PDFs",
    },
    {
      icon: Zap,
      title: "Gamified Learning",
      description: "Earn points, badges, and climb levels as you progress through your preparation",
    },
    {
      icon: Trophy,
      title: "Leaderboards & Achievements",
      description: "Compete with peers and track your achievements on real-time leaderboards",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Get detailed insights into your accuracy, consistency, and areas for improvement",
    },
    {
      icon: Users,
      title: "Expert Mentors",
      description: "Connect with experienced UPSC mentors for personalized guidance",
    },
    {
      icon: BookOpen,
      title: "Practice Tests",
      description: "Take unlimited practice tests aligned with actual UPSC exam pattern",
    },
  ]

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 md:px-8 bg-gradient-to-br from-background via-background to-secondary overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Master the UPSC with
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                 Gamify IAS Academy
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Premium gamified learning platform for UPSC civil service exam preparation. Practice, compete, and succeed
              with thousands of aspirants.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Learning
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-12">
            {[
              { label: "Active Learners", value: "100+" },
              { label: "Practice Questions", value: "25K+" },
              { label: "Success Rate", value: "95%" },
            ].map((stat, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-card/50 backdrop-blur border border-border">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Why Choose<span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Gamify IAS Academy?</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to ace the UPSC examination in one comprehensive platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <Icon className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your UPSC Prep?</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of aspirants who are already crushing their UPSC goals with<span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Gamify IAS Academy </span>
          </p>
          <Link href="/auth/signup">
            <Button size="lg">Get Started for Free</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
