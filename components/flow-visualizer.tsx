"use client"

import { useState } from "react"
import { ArrowRight, GitCommit, Route, FileCode, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ImpactBadge } from "./impact-badge"

interface FlowStep {
  file: string;
  role: string;
  note?: string;
}

interface KeyFlow {
  name: string;
  description: string;
  steps: FlowStep[];
  confidence: "High" | "Medium";
}

interface FlowVisualizerProps {
  flows: KeyFlow[];
  impactMap: any;
}

export function FlowVisualizer({ flows, impactMap }: FlowVisualizerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!flows || flows.length === 0) return null;

  const activeFlow = flows[selectedIndex];

  return (
    <Card className="bg-card border-border shadow-sm flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="pb-3 p-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Critical Data Flows</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col md:flex-row min-h-[300px]">
        
        {/* 1. SIDEBAR: Flow List */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border/40 bg-secondary/10 p-2 space-y-1">
          {flows.map((flow, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "w-full text-left px-3 py-3 rounded-lg text-sm transition-all border group",
                selectedIndex === i 
                  ? "bg-background border-border shadow-sm text-foreground ring-1 ring-primary/5" 
                  : "hover:bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium truncate">{flow.name}</span>
                
                {/* Confidence Ribbon */}
                {flow.confidence === "High" && (
                    <div className="relative group/tooltip">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 cursor-help" />
                        {/* Tooltip */}
                        <div className="absolute right-0 bottom-full mb-2 w-max px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded border shadow-sm opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                            High Confidence: Verified via File Tree
                        </div>
                    </div>
                )}
              </div>
              <p className="text-xs opacity-70 line-clamp-2 leading-relaxed">
                {flow.description}
              </p>
            </button>
          ))}
        </div>

        {/* 2. CANVAS: Visualization */}
        <div className="flex-1 bg-gradient-to-br from-background to-secondary/5 p-6 md:p-8 overflow-x-auto">
          {activeFlow ? (
            <div className="flex flex-col h-full">
               {/* Flow Header */}
               <div className="mb-8">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {activeFlow.name}
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                        {activeFlow.steps.length} Steps
                    </Badge>
                    {activeFlow.confidence === "High" && (
                        <Badge variant="secondary" className="text-[10px] font-normal text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Flow
                        </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{activeFlow.description}</p>
               </div>

               {/* The Chain Visualization */}
               <div className="flex items-start gap-4 min-w-max pb-4">
                  {activeFlow.steps.map((step, i) => {
                    const isLast = i === activeFlow.steps.length - 1;
                    
                    return (
                      <div key={i} className="flex items-center gap-4 group">
                        
                        {/* NODE CARD */}
                        <div className="relative w-64 p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200">
                            
                            {/* Step Role */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className={cn(
                                    "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border",
                                    i === 0 ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                                    isLast ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                    "bg-secondary text-muted-foreground border-border"
                                )}>
                                    {i + 1}
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {step.role}
                                </span>
                            </div>

                            {/* File Info */}
                            <div className="flex items-start gap-3">
                                <FileCode className="w-5 h-5 text-muted-foreground/50 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate text-foreground mb-1" title={step.file}>
                                        {step.file.split('/').pop()}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate opacity-60 font-mono">
                                        {step.file}
                                    </p>
                                </div>
                            </div>

                            {/* Impact Badge Integration */}
                            {impactMap && (
                                <div className="mt-4 pt-3 border-t border-border/40">
                                    <ImpactBadge 
                                        filePath={step.file} 
                                        impactMap={impactMap} 
                                        showBanner={false} 
                                    />
                                </div>
                            )}
                        </div>

                        {/* CONNECTOR OR TERMINATOR */}
                        {!isLast ? (
                            <div className="text-muted-foreground/30 flex items-center justify-center">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        ) : (
                            // SAFETY: Explicit Termination Node
                            <div className="flex flex-col items-center gap-2 opacity-50 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50 text-[10px] text-muted-foreground whitespace-nowrap mt-1">
                                    <AlertCircle className="w-3 h-3" />
                                    End of verified path
                                </div>
                            </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                <GitCommit className="w-8 h-8 mb-2" />
                <p className="text-sm">Select a flow to visualize path</p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  )
}