"use client"

import { Play, FileText, Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

interface VideoCardProps {
  script?: string[]
}

export function VideoCard({ script }: VideoCardProps) {
  const [copied, setCopied] = useState(false)

  // Default fallback script if none provided
  const displayScript = script || [
    "Welcome to the project! This is a standard architecture.",
    "Start by installing dependencies with the package manager.",
    "Check the README for environment setup details."
  ]

  const handleCopy = () => {
    navigator.clipboard.writeText(displayScript.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="pb-3 p-4 md:p-6 md:pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-foreground text-base">Walkthrough</CardTitle>
            <CardDescription className="text-xs">
              AI-generated manager briefing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 flex-1">
        <Tabs defaultValue="script" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="script">Script</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
          </TabsList>
          
          {/* TAB 1: AI SCRIPT */}
          <TabsContent value="script" className="flex-1 mt-0">
            <div className="bg-secondary/30 rounded-lg p-4 h-full border border-border space-y-3">
               <div className="flex items-center justify-between">
                   <span className="text-xs font-semibold text-muted-foreground uppercase">Talking Points</span>
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                   </Button>
               </div>
               <ul className="space-y-3">
                  {displayScript.map((point, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground/80">
                          <span className="text-orange-500 font-bold">•</span>
                          {point}
                      </li>
                  ))}
               </ul>
            </div>
          </TabsContent>

          {/* TAB 2: EMBED VIDEO (Placeholder for now) */}
          <TabsContent value="video" className="flex-1 mt-0 min-h-[150px]">
             <div className="w-full h-full rounded-lg bg-black/80 flex flex-col items-center justify-center text-center p-4 border border-border/50">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                    <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <p className="text-sm text-white font-medium">No video recorded yet</p>
                <p className="text-xs text-white/50 mt-1">Use the script to record a Loom</p>
             </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}