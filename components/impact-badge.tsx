"use client"

import { AlertTriangle, ShieldCheck, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImpactBadgeProps {
  filePath: string
  impactMap: any
  showBanner?: boolean 
}

export function ImpactBadge({ filePath, impactMap, showBanner = false }: ImpactBadgeProps) {
  // REFINEMENT 2: Normalize path to prevent silent lookup failures
  // Removes leading ./ or / from the path
  const normalizedPath = filePath.replace(/^\.?\//, "");
  const data = impactMap?.[normalizedPath]

  if (!data) return null

  const config = {
    High: {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-100 dark:border-red-800/30",
      icon: AlertTriangle,
      label: "High Impact"
    },
    Medium: {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-100 dark:border-amber-800/30",
      icon: Activity,
      label: "Medium Impact"
    },
    Low: {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-100 dark:border-emerald-800/30",
      icon: ShieldCheck,
      label: "Low Risk"
    }
  }[data.level as "High" | "Medium" | "Low"] || null

  if (!config) return null

  const Icon = config.icon

  return (
    <div className="flex flex-col gap-2 mt-1">
      {/* 1. THE BADGE */}
      <div className="group relative w-fit">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-colors cursor-help",
          config.color, config.bg, config.border
        )}>
          <Icon className="w-3 h-3" />
          <span>{config.label}</span>
        </div>

        {/* TOOLTIP */}
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-lg border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 bg-white dark:bg-zinc-950">
          <div className="font-semibold mb-1 flex items-center gap-2">
            <Icon className="w-3 h-3" /> {config.label} File
          </div>
          <p className="mb-2 opacity-90 leading-snug">{data.summary}</p>
          
          {data.flows && data.flows.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-border/50">
              <span className="text-[10px] uppercase tracking-wider opacity-70">Used in flows:</span>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                {data.flows.map((flow: string, i: number) => (
                  <li key={i} className="truncate">{flow}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 2. WARNING BANNER (Controlled by parent via showBanner) */}
      {showBanner && data.level === "High" && (
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-xs text-red-800 dark:text-red-300 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Caution advised</p>
            <p className="opacity-90 leading-relaxed">
              This file is load-bearing. Changes here may affect 
              <span className="font-semibold"> {data.flows?.length || "multiple"} critical flows</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}