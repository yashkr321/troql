"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectHeader } from "./project-header"
import { MicroTasksCard } from "./micro-tasks-card"
import { EnvironmentCard } from "./environment-card"
import { VideoCard } from "./video-card"

interface ActiveProjectViewProps {
  projectName: string
  onClose: () => void
}

export function ActiveProjectView({ projectName, onClose }: ActiveProjectViewProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground -ml-2 h-11 md:h-9 touch-manipulation"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <ProjectHeader projectName={projectName} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 order-1">
          <MicroTasksCard />
        </div>
        <div className="space-y-4 md:space-y-6 order-2">
          <EnvironmentCard />
          <VideoCard />
        </div>
      </div>
    </div>
  )
}