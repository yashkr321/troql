"use client"

import { FileText, Layers, Server } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// --- NEW INTERFACES TO MATCH BACKEND ---
interface CoreModule {
  name: string;
  path: string;
  responsibility: string;
  confidence: "High" | "Medium" | "Low";
}

interface SystemArchitecture {
  summary: string;
  architecture_style: string;
  core_modules: CoreModule[];
}

interface SummaryCardProps {
  data: SystemArchitecture
}

export function SummaryCard({ data }: SummaryCardProps) {
  // Safe check in case data hasn't loaded yet
  if (!data) {
    return (
      <Card className="bg-card border-border h-full flex flex-col shadow-sm">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Waiting for analysis...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3 p-4 md:p-6 md:pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-foreground text-base">System Mental Model</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 pt-4 flex flex-col gap-6">
        
        {/* SECTION 1: High Level Architecture */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Server className="w-4 h-4" />
            <span className="font-medium text-foreground">Architecture:</span>
            <Badge variant="outline" className="text-xs font-normal bg-secondary/30">
              {data.architecture_style}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.summary}
          </p>
        </div>

        {/* SECTION 2: Core Modules Grid */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Layers className="w-3 h-3" /> Core Modules
          </h4>
          
          <div className="grid gap-3">
            {data.core_modules.map((module, i) => (
              <div key={i} className="p-3 rounded-lg border border-border/60 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-medium text-sm text-foreground">{module.name}</span>
                  <Badge 
                    variant={module.confidence === 'High' ? "default" : "secondary"} 
                    className="text-[10px] h-5 px-1.5"
                  >
                    {module.confidence}%
                  </Badge>
                </div>
                
                <div className="text-[10px] text-muted-foreground font-mono mb-2 bg-background/50 px-1.5 py-0.5 rounded w-fit">
                  {module.path}
                </div>
                
                <p className="text-xs text-muted-foreground leading-snug">
                  {module.responsibility}
                </p>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}