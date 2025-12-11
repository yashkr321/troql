"use client"

// 1. CHANGED: Imported 'Check' instead of 'ArrowRight'
import { CheckSquare, Clock, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MicroTasksCardProps {
  tasks: any[]
  onToggleTask: (index: number) => void
}

export function MicroTasksCard({ tasks, onToggleTask }: MicroTasksCardProps) {
  // If no tasks, show a default empty state
  const displayTasks = tasks.length > 0 ? tasks : [
    { title: "Scan a repository", difficulty: "Easy", time: "5m", desc: "Start by entering a URL." },
    { title: "Review dependencies", difficulty: "Medium", time: "15m", desc: "Check package.json." },
    { title: "Run local server", difficulty: "Hard", time: "30m", desc: "Follow the README." },
  ]

  return (
    <Card className="bg-card border-border h-fit shadow-sm">
      <CardHeader className="pb-3 p-4 md:p-6 md:pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-foreground text-base">Onboarding Tasks</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 pt-4">
        <div className="space-y-3">
          {displayTasks.map((task, i) => (
            <div 
              key={i}
              onClick={() => onToggleTask(i)}
              className={cn(
                "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md",
                task.completed 
                  ? "bg-secondary/30 border-transparent opacity-60" 
                  : "bg-card border-border hover:border-primary/50"
              )}
            >
              {/* Checkbox Circle */}
              <div className={cn(
                "mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                task.completed 
                  ? "bg-primary border-primary text-primary-foreground" // Solid color when checked
                  : "border-muted-foreground/30 group-hover:border-primary" // Outline when unchecked
              )}>
                {/* 2. CHANGED: Used Check icon here */}
                {task.completed && <Check className="w-3 h-3" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className={cn(
                    "text-sm font-medium truncate",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h4>
                  <Badge variant="outline" className={cn(
                    "text-[10px] h-5 px-1.5 font-normal",
                    task.difficulty === "Easy" ? "text-green-500 border-green-500/20 bg-green-500/5" :
                    task.difficulty === "Medium" ? "text-yellow-500 border-yellow-500/20 bg-yellow-500/5" :
                    "text-red-500 border-red-500/20 bg-red-500/5"
                  )}>
                    {task.difficulty}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {task.desc}
                </p>
                
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/70 font-medium">
                  <Clock className="w-3 h-3" />
                  {task.time} est.
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}