"use client"

import { FileText, Tag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SummaryCardProps {
  summary: string
  features: string[]
}

export function SummaryCard({ summary, features }: SummaryCardProps) {
  // Fallback if data is missing
  const displaySummary = summary || "Scan a repository to see its overview here."
  const displayFeatures = features && features.length > 0 ? features : ["Code Analysis", "Onboarding"]

  return (
    <Card className="bg-card border-border h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3 p-4 md:p-6 md:pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-foreground text-base">Project Overview</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 pt-4 flex flex-col gap-4">
        {/* The Summary Text */}
        <div className="text-sm text-muted-foreground leading-relaxed">
          {displaySummary}
        </div>

        {/* The Feature Tags */}
        <div className="flex flex-wrap gap-2">
            {displayFeatures.map((feat, i) => (
                <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs font-normal flex items-center gap-1.5 bg-secondary/50">
                    <Tag className="w-3 h-3 text-emerald-500/70" />
                    {feat}
                </Badge>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}