"use client"

import { useState } from "react"
import { CheckSquare, ShieldCheck, Code2, Terminal, Check, Layers, Cpu, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ImpactBadge } from "./impact-badge"

interface OnboardingTask {
  tier: "SCOUT" | "BUILDER" | "ENGINEER";
  title: string;
  description: string;
  file_path: string;
  action_type: "edit_text" | "create_file" | "insert_log";
  safety_label: string;
  completed?: boolean;
}

interface OnboardingTracks {
  GENERAL?: OnboardingTask[];
  FRONTEND?: OnboardingTask[];
  BACKEND?: OnboardingTask[];
  DEVOPS?: OnboardingTask[];
}

interface MicroTasksCardProps {
  tracks: OnboardingTracks | OnboardingTask[];
  impactMap?: any;
  onToggleTask?: (role: string, index: number) => void
}

export function MicroTasksCard({ tracks, impactMap, onToggleTask }: MicroTasksCardProps) {
  const [activeTab, setActiveTab] = useState<"GENERAL" | "FRONTEND" | "BACKEND" | "DEVOPS">("GENERAL");
  
  // REFINEMENT 1: Track hover state to avoid banner spam
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const normalizedTracks: OnboardingTracks = Array.isArray(tracks) 
    ? { GENERAL: tracks } 
    : tracks || { GENERAL: [] };

  const currentTasks = normalizedTracks[activeTab] || [];

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case "SCOUT": return { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", icon: ShieldCheck };
      case "BUILDER": return { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Code2 };
      case "ENGINEER": return { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Terminal };
      default: return { color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20", icon: CheckSquare };
    }
  };

  const tabs = [
    { id: "GENERAL", label: "General", icon: Layers },
    { id: "FRONTEND", label: "Frontend", icon: Globe },
    { id: "BACKEND", label: "Backend", icon: Cpu },
    { id: "DEVOPS", label: "DevOps", icon: Terminal },
  ] as const;

  return (
    <Card className="bg-card border-border h-fit shadow-sm flex flex-col">
      <CardHeader className="pb-3 p-4 md:p-6 md:pb-3 border-b border-border/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-foreground text-base">Onboarding Tracks</CardTitle>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-secondary/30 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {(normalizedTracks[tab.id]?.length || 0) > 0 && (
                <span className="ml-1 opacity-50 text-[10px]">
                    {normalizedTracks[tab.id]?.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 pt-4">
        {currentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <div className="p-3 rounded-full bg-secondary/50">
                    <Layers className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">No specific tasks found for {activeTab.toLowerCase()}.</p>
                <p className="text-xs text-muted-foreground/60">Try checking the General track.</p>
            </div>
        ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {currentTasks.map((task, i) => {
                const config = getTierConfig(task.tier);
                const TierIcon = config.icon;

                return (
                <div 
                    key={i}
                    // Trigger Intent: Hovering sets this task as active
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onToggleTask && onToggleTask(activeTab, i)}
                    className={cn(
                    "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md bg-card",
                    task.completed ? "opacity-60" : "hover:border-primary/40"
                    )}
                >
                    <div className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                    task.completed 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-muted-foreground/30 group-hover:border-primary"
                    )}>
                    {task.completed && <Check className="w-3 h-3" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase flex items-center gap-1 shrink-0",
                                config.color, config.bg, config.border
                            )}>
                                <TierIcon className="w-3 h-3" />
                                {task.tier}
                            </span>
                            <h4 className="text-sm font-medium truncate text-foreground">
                                {task.title}
                            </h4>
                            </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {task.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="bg-secondary rounded px-2 py-1 text-[10px] font-mono text-muted-foreground flex items-center gap-1 max-w-[70%] truncate">
                                <span className="shrink-0">📂</span>
                                {task.file_path}
                            </div>
                            
                            {impactMap && (
                                <ImpactBadge 
                                    filePath={task.file_path} 
                                    impactMap={impactMap} 
                                    // REFINEMENT: Only show full banner if this specific card is hovered
                                    showBanner={hoveredIndex === i} 
                                />
                            )}
                        </div>
                    </div>
                </div>
                )
            })}
            </div>
        )}
      </CardContent>
    </Card>
  )
}