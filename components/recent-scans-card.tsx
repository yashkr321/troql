"use client"

import { useState, useEffect } from "react"
import { Clock, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RecentScansCardProps {
  onSelect: (repo: string) => void
}

export function RecentScansCard({ onSelect }: RecentScansCardProps) {
  const [scans, setScans] = useState<any[]>([])

  // 1. Load Real Scans from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("onboard_scans")
    if (saved) {
      setScans(JSON.parse(saved))
    }
  }, [])

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <CardTitle className="text-foreground">Recent Scans</CardTitle>
            <CardDescription className="text-xs md:text-sm">Previously scanned repositories</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        <div className="space-y-2">
          {scans.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No scans yet. Try scanning a repo!
            </div>
          ) : (
            scans.map((scan, index) => (
              <button
                key={index}
                onClick={() => onSelect(scan.repo)}
                className="w-full flex items-center justify-between p-3 md:p-3 rounded-lg bg-secondary/50 hover:bg-secondary active:bg-secondary/80 transition-colors group touch-manipulation min-h-[64px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 md:w-8 md:h-8 rounded-md bg-background flex items-center justify-center shrink-0">
                    <span className="text-xs font-mono text-muted-foreground">
                      {scan.repo.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{scan.repo}</p>
                    <p className="text-xs text-muted-foreground">{scan.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge className={cn("text-xs bg-green-500/10 text-green-500 border-green-500/20")}>
                     {scan.stack || "Ready"}
                  </Badge>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}