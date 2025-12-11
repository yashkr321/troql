"use client"

import { useState, useEffect } from "react"
import { Sidebar, HistoryItem } from "./sidebar"
import { AddRepositoryCard } from "./add-repository-card"
import { MicroTasksCard } from "./micro-tasks-card"
import { WikiCard } from "./wiki-card"
import { SummaryCard } from "./summary-card"
import { cn } from "@/lib/utils"
// Removed PanelLeft import
import { Code, Terminal, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Dashboard() {
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Data State
  const [aiTasks, setAiTasks] = useState<any[]>([])
  const [detectedStack, setDetectedStack] = useState<string>("Unknown")
  const [aiScript, setAiScript] = useState<string[]>([])
  const [scanHistory, setScanHistory] = useState<HistoryItem[]>([])
  const [aiSummary, setAiSummary] = useState<string>("")
  const [aiFeatures, setAiFeatures] = useState<string[]>([])

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)

    const savedHistory = localStorage.getItem("onboard_history")
    if (savedHistory) setScanHistory(JSON.parse(savedHistory))

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const addToHistory = (repo: string, stack: string, tasks: any[], script?: string[], summary?: string, features?: string[]) => {
    const newItem: HistoryItem = { 
        repo, 
        stack, 
        tasks, 
        script: script || [], 
        summary: summary || "",
        features: features || [],
        date: new Date().toISOString() 
    }
    const newHistory = [newItem, ...scanHistory.filter(h => h.repo !== repo)]
    setScanHistory(newHistory)
    localStorage.setItem("onboard_history", JSON.stringify(newHistory))
  }

  const handleScanData = (data: any, repoUrl: string) => {
    const cleanRepo = repoUrl.replace("https://github.com/", "")
    
    setAiTasks(data.tasks || [])
    setDetectedStack(data.stack || "Unknown")
    setAiScript(data.script || [])
    setAiSummary(data.summary || "No summary generated.")
    setAiFeatures(data.features || [])

    setActiveProject(cleanRepo)
    
    addToHistory(
        cleanRepo, 
        data.stack, 
        data.tasks, 
        data.script, 
        data.summary, 
        data.features
    )
    
    if (isMobile) setSidebarOpen(false)
  }

  const handleSelectFromSidebar = (item: HistoryItem) => {
    setActiveProject(item.repo)
    setAiTasks(item.tasks)
    setDetectedStack(item.stack)
    setAiScript(item.script || [])
    setAiSummary(item.summary || "")
    setAiFeatures(item.features || [])
    
    if (isMobile) setSidebarOpen(false)
  }

  const handleNewScan = () => {
    setActiveProject(null)
    setAiTasks([])
    setAiScript([])
    setAiSummary("")
    setAiFeatures([])
    if (isMobile) setSidebarOpen(false)
  }

  const handleToggleTask = (index: number) => {
    const newTasks = [...aiTasks]
    newTasks[index].completed = !newTasks[index].completed
    setAiTasks(newTasks)
    
    if (activeProject) {
        const updatedHistory = scanHistory.map(h => 
            h.repo === activeProject ? { ...h, tasks: newTasks } : h
        )
        setScanHistory(updatedHistory)
        localStorage.setItem("onboard_history", JSON.stringify(updatedHistory))
    }
  }

  // --- BUTTON ACTIONS ---
  const handleCloneVSCode = () => {
    if (!activeProject) return
    window.open(`vscode://vscode.git/clone?url=https://github.com/${activeProject}.git`, "_self")
  }

  const handleOpenCodespaces = () => {
    if (!activeProject) return
    const [owner, repo] = activeProject.split("/")
    window.open(`https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=${owner}/${repo}`, "_blank")
  }

  const handleDownloadConfig = () => {
    if (!activeProject) return
    const configData = {
        project: activeProject,
        stack: detectedStack,
        tasks: aiTasks,
        summary: aiSummary,
        features: aiFeatures
    }
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "onboard-config.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex h-screen bg-sidebar overflow-hidden">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          "transition-all duration-300 ease-in-out z-50 h-full",
          isMobile ? "fixed inset-y-0 left-0" : "relative",
          isMobile && !sidebarOpen && "-translate-x-full",
        )}
      >
        <Sidebar 
            collapsed={!sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)} 
            isMobile={isMobile}
            history={scanHistory}
            onSelectRepo={handleSelectFromSidebar}
            onNewScan={handleNewScan}
        />
      </div>

      {/* MAIN LAYOUT */}
      <main className="flex-1 m-2 rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col relative transition-all duration-300">
        
        {/* HEADER (FIXED) */}
        <div className="shrink-0 p-4 md:px-8 md:pt-6 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* BUTTON REMOVED FROM HERE */}
              <h1 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-3">
                {activeProject ? activeProject : "troQl"}
              </h1>
            </div>

            {activeProject && (
                <div className="flex items-center gap-2">
                    <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm gap-2"
                        onClick={handleCloneVSCode}
                    >
                        <Code className="w-4 h-4" />
                        <span className="hidden sm:inline">Clone in VS Code</span>
                    </Button>

                    <Button 
                        size="sm" 
                        className="bg-zinc-800 hover:bg-zinc-700 text-white border-none shadow-sm gap-2"
                        onClick={handleOpenCodespaces}
                    >
                        <Terminal className="w-4 h-4" />
                        <span className="hidden sm:inline">Codespaces</span>
                    </Button>

                    <Button 
                        size="icon" 
                        className="w-9 h-9 bg-zinc-800 hover:bg-zinc-700 text-white border-none shadow-sm"
                        onClick={handleDownloadConfig}
                        title="Download Configuration"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            )}
          </div>
        </div>

        {/* SPLIT CONTENT */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* LEFT PANEL: SCROLLABLE (HIDDEN SCROLLBAR) */}
            <div className={cn(
                "flex-1 overflow-y-auto p-4 md:p-8",
                "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            )}>
                {activeProject ? (
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">
                        <MicroTasksCard tasks={aiTasks} onToggleTask={handleToggleTask} />
                        <SummaryCard summary={aiSummary} features={aiFeatures} />
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto mt-20">
                        <AddRepositoryCard onDataReceived={handleScanData} />
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: FIXED */}
            {activeProject && (
                <div className="hidden xl:block w-[450px] border-l border-border bg-card/30 shrink-0 h-full relative">
                    <WikiCard repoName={activeProject} stack={detectedStack} />
                </div>
            )}

        </div>
      </main>
    </div>
  )
}