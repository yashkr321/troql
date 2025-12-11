"use client"

import { useState } from "react"
import { Terminal, Loader2, CheckCircle2, Download, ExternalLink, Monitor } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface EnvironmentCardProps {
  stack?: string
  repoName?: string
}

export function EnvironmentCard({ stack = "Node.js", repoName }: EnvironmentCardProps) {
  const [status, setStatus] = useState<"idle" | "launching" | "ready">("idle")

  // Fallback if repoName is missing (prevents broken links)
  const safeRepo = repoName || "stripe/stripe-node"

  const handleLaunch = () => {
    setStatus("launching")
    // Simulate setup time (2 seconds)
    setTimeout(() => setStatus("ready"), 2000)
  }

  const handleDownloadConfig = () => {
    const config = {
      name: `Onboard AI - ${stack}`,
      image: stack === "Python" ? "mcr.microsoft.com/devcontainers/python:3" : "mcr.microsoft.com/devcontainers/javascript-node:18",
      customizations: {
        vscode: {
          extensions: ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"]
        }
      }
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "devcontainer.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 p-4 md:p-6 md:pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Terminal className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <CardTitle className="text-foreground text-base">Environment</CardTitle>
            <CardDescription className="text-xs">Pre-configured {stack} dev container</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        
        {/* State 1: IDLE */}
        {status === "idle" && (
          <Button
            onClick={handleLaunch}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 md:h-10 touch-manipulation"
          >
            <Terminal className="w-4 h-4 mr-2" />
            Launch Dev Container
          </Button>
        )}

        {/* State 2: LAUNCHING */}
        {status === "launching" && (
          <Button disabled className="w-full bg-secondary text-muted-foreground h-12 md:h-10">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Provisioning {stack} VM...
          </Button>
        )}

        {/* State 3: READY */}
        {status === "ready" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Container Ready</span>
            </div>
            
            {/* OPTION A: Open Local VS Code (Desktop) */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 md:h-10"
              asChild
            >
              <a
                // This magic link opens the VS Code Desktop App and Clone the repo
                href={`vscode://vscode.git/clone?url=https://github.com/${safeRepo}.git`}
              >
                <Monitor className="w-4 h-4 mr-2" />
                Clone in VS Code (Desktop)
              </a>
            </Button>

            {/* OPTION B: Open in Codespaces (Web) */}
            <Button
              variant="secondary"
              className="w-full h-12 md:h-10"
              asChild
            >
              <a
                href={`https://github.com/codespaces/new/${safeRepo}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Codespaces (Web)
              </a>
            </Button>

            {/* OPTION C: Download Config */}
            <Button
              variant="outline"
              onClick={handleDownloadConfig}
              className="w-full border-border text-foreground hover:bg-secondary bg-transparent h-12 md:h-10"
            >
              Download Config
              <Download className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}