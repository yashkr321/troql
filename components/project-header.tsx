"use client"

import { BadgeCheck, GitBranch, Star, GitFork } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProjectHeaderProps {
  projectName: string
}

export function ProjectHeader({ projectName }: ProjectHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
          <span className="text-xl font-bold text-foreground">
            {projectName.split("/")[0].slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">{projectName}</h2>
            <Badge
              className="text-success border-0 flex items-center gap-1"
              style={{ backgroundColor: "rgba(34, 197, 94, 0.2)" }}
            >
              <BadgeCheck className="w-3 h-3" />
              Verified
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <GitBranch className="w-4 h-4" />
              <span>main</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>3.2k</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="w-4 h-4" />
              <span>892</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
