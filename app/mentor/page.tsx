export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MentorPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → redirect to login
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // No profile → redirect to onboarding/welcome
  if (!profile) {
    redirect("/auth/welcome");
  }

  const role = profile.role;

  // If NOT mentor → redirect to correct dashboard
  if (role !== "mentor") {
    if (role === "student") redirect("/student/dashboard");
    if (role === "admin") redirect("/admin");
    redirect("/"); // fallback
  }

  // If role IS mentor → show this page
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-2xl font-semibold mb-4">You're On the Wrong URL</h1>
      <p className="text-muted-foreground mb-6">
        It seems you're trying to access a page that doesn't exist for mentors.
      </p>
      <a
        href="/mentor/home"
        className="px-6 py-3 rounded-md bg-primary text-white hover:bg-primary/80 transition"
      >
        Go to Home
      </a>
    </div>
  );
}
