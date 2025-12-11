"use client"

import { useState, useEffect } from "react"
import { Loader2, Check, Code2, Layers, Container } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ScanningOverlayProps {
  repoName: string
  onComplete: () => void
}

const SCAN_STEPS = [
  { id: 1, label: "Analyzing AST...", icon: Code2, duration: 1500 },
  { id: 2, label: "Detecting Stack...", icon: Layers, duration: 1500 },
  { id: 3, label: "Generating Dockerfile...", icon: Container, duration: 1500 },
]

export function ScanningOverlay({ repoName, onComplete }: ScanningOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    if (currentStep >= SCAN_STEPS.length) {
      const timer = setTimeout(onComplete, 500)
      return () => clearTimeout(timer)
    }

    const step = SCAN_STEPS[currentStep]
    const timer = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, step.id])
      setCurrentStep((prev) => prev + 1)
    }, step.duration)

    return () => clearTimeout(timer)
  }, [currentStep, onComplete])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="bg-card border-border w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Scanning Repository</h2>
            <p className="text-sm text-muted-foreground font-mono">{repoName}</p>
          </div>

          <div className="space-y-4">
            {SCAN_STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id)
              const isActive = currentStep === index && !isCompleted
              const Icon = step.icon

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
                    isCompleted
                      ? "border-green-500/30"
                      : isActive
                        ? "bg-secondary border-primary/50"
                        : "bg-secondary/50 border-border opacity-50",
                  )}
                  style={isCompleted ? { backgroundColor: "rgba(34, 197, 94, 0.1)" } : undefined}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      isCompleted ? "bg-green-500/20" : isActive ? "bg-primary/20" : "bg-muted",
                    )}
                    style={
                      isCompleted
                        ? { backgroundColor: "rgba(34, 197, 94, 0.2)" }
                        : isActive
                          ? { backgroundColor: "rgba(250, 250, 250, 0.2)" }
                          : undefined
                    }
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors duration-300",
                      isCompleted ? "text-success" : isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {isCompleted ? step.label.replace("...", "") + " Complete" : step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
