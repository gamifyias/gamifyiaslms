import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Gamify IAS Academy
            </h1>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Verification Email Sent</CardTitle>
              <CardDescription className="text-center">Check your inbox to confirm your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                We&apos;ve sent a verification email to your inbox. Click the link in the email to confirm your account
                and get started with your UPSC preparation.
              </p>

              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent">
                <p className="font-medium">Check your spam folder</p>
                <p className="text-xs text-accent/80 mt-1">If you don&apos;t see the email, check your spam folder.</p>
              </div>

              <Link href="/auth/login" className="w-full">
                <Button className="w-full bg-transparent" variant="outline">
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
