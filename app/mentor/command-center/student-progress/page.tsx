export const dynamic = "force-dynamic";

import { Suspense } from 'react';
import ProgressDisplay from './progress-display';
import { MentorSidebar } from "@/components/mentor-sidebar"
import { Loader2 } from "lucide-react"

export default function MentorStudentProgressPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-background">
        <MentorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    }>
      <ProgressDisplay />
    </Suspense>
  );
}