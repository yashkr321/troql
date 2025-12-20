"use client"

import { useState, useEffect } from "react"
import { Sidebar, HistoryItem } from "./sidebar"
import { AddRepositoryCard } from "./add-repository-card"
import { MicroTasksCard } from "./micro-tasks-card"
import { WikiCard } from "./wiki-card"
import { SummaryCard } from "./summary-card"
import { FlowVisualizer } from "./flow-visualizer"
import { EditProposalModal, EditProposal } from "./edit-proposal-modal"
import { cn } from "@/lib/utils"
import { Code, Terminal, Download, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Dashboard() {
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // --- STATE ---
  const [aiOnboardingTracks, setAiOnboardingTracks] = useState<any>({ GENERAL: [] })
  const [aiSystemArch, setAiSystemArch] = useState<any>(null)
  const [aiImpactMap, setAiImpactMap] = useState<any>({}) 
  const [aiKeyFlows, setAiKeyFlows] = useState<any[]>([]) 
  const [detectedStack, setDetectedStack] = useState<string>("Unknown")
  const [scanHistory, setScanHistory] = useState<HistoryItem[]>([])

  // --- EDIT & PREVIEW STATE (PHASE 7/8) ---
  const [editProposal, setEditProposal] = useState<EditProposal | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false)
  const [isApplyingEdit, setIsApplyingEdit] = useState(false)

  // Proof-of-Preview State
  const [previewJobId, setPreviewJobId] = useState<string | null>(null)
  const [previewStatus, setPreviewStatus] = useState<"idle" | "queued" | "running" | "success" | "failed">("idle")
  const [previewToken, setPreviewToken] = useState<string | null>(null) // JWT from server

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)

    const savedHistory = localStorage.getItem("onboard_history")
    if (savedHistory) {
        try {
            setScanHistory(JSON.parse(savedHistory))
        } catch (e) {
            console.error("Failed to parse history", e)
        }
    }

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // --- POLLING LOGIC FOR PREVIEW TOKEN ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (previewJobId && (previewStatus === 'queued' || previewStatus === 'running')) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/preview-status?id=${previewJobId}`)
          const data = await res.json()
          
          if (data.success) {
            setPreviewStatus(data.status)
            // If success, capture the Proof-of-Preview Token
            if (data.status === 'success' && data.result?.token) {
              setPreviewToken(data.result.token)
            }
          }
        } catch (e) {
          console.error("Polling error", e)
        }
      }, 2000) // Poll every 2s
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [previewJobId, previewStatus])


  const addToHistory = (repo: string, stack: string, tracks: any, architecture: any, flows: any[]) => {
    const safeTracks = Array.isArray(tracks) ? { GENERAL: tracks } : tracks;

    const newItem: HistoryItem & { flows?: any[] } = { 
        repo, 
        stack, 
        tasks: safeTracks, 
        date: new Date().toISOString(),
        summary: architecture,
        flows: flows, 
        script: [],
        features: [] 
    }
    
    const newHistory = [newItem, ...scanHistory.filter(h => h.repo !== repo)]
    setScanHistory(newHistory)
    localStorage.setItem("onboard_history", JSON.stringify(newHistory))
  }

  const handleScanData = (data: any, repoUrl: string) => {
    const cleanRepo = repoUrl.replace("https://github.com/", "").replace(".git", "")
    
    const newTracks = data.onboarding_tracks || { GENERAL: data.onboarding_track || [] };
    const newArch = data.system_architecture || null
    const newImpact = data.impact_map || {}
    const newFlows = data.key_flows || [] 
    
    setAiOnboardingTracks(newTracks)
    setAiSystemArch(newArch)
    setAiImpactMap(newImpact)
    setAiKeyFlows(newFlows)
    setDetectedStack(newArch?.architecture_style || "Unknown")

    setActiveProject(cleanRepo)
    
    addToHistory(cleanRepo, newArch?.architecture_style || "Unknown", newTracks, newArch, newFlows)
    
    if (isMobile) setSidebarOpen(false)
  }

  const handleSelectFromSidebar = (item: any) => {
    setActiveProject(item.repo)
    
    const safeTracks = Array.isArray(item.tasks) ? { GENERAL: item.tasks } : item.tasks;
    setAiOnboardingTracks(safeTracks || { GENERAL: [] })
    
    setDetectedStack(item.stack)
    setAiSystemArch(item.summary) 
    setAiKeyFlows(item.flows || []) 
    setAiImpactMap({}) 
    
    if (isMobile) setSidebarOpen(false)
  }

  const handleNewScan = () => {
    setActiveProject(null)
    setAiOnboardingTracks({ GENERAL: [] })
    setAiSystemArch(null)
    setAiImpactMap({})
    setAiKeyFlows([])
    if (isMobile) setSidebarOpen(false)
  }

  const handleToggleTask = (role: string, index: number) => {
    const currentTracks = { ...aiOnboardingTracks };
    
    if (currentTracks[role] && currentTracks[role][index]) {
        currentTracks[role][index].completed = !currentTracks[role][index].completed;
        setAiOnboardingTracks(currentTracks);
        
        if (activeProject) {
            const updatedHistory = scanHistory.map(h => 
                h.repo === activeProject ? { ...h, tasks: currentTracks } : h
            )
            setScanHistory(updatedHistory)
            localStorage.setItem("onboard_history", JSON.stringify(updatedHistory))
        }
    }
  }

  // --- PHASE 4 -> PHASE 7/8 TRANSITION: EDIT LOGIC ---

  const handleRequestEdit = async () => {
    if (!activeProject) return;
    const targetFile = "package.json"; 

    // Reset Preview State
    setPreviewJobId(null)
    setPreviewStatus("idle")
    setPreviewToken(null)

    setIsGeneratingProposal(true);
    try {
        // 1. Generate Text Proposal (LLM)
        const res = await fetch('/api/propose-edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                repoUrl: activeProject,
                instruction: "Add a 'test' script that runs 'jest'.",
                targetFile: targetFile,
                impactContext: {
                    impactMap: aiImpactMap,
                    keyFlows: aiKeyFlows,
                }
            })
        });

        const data = await res.json();
        if (data.success) {
            setEditProposal(data.proposal);
            setIsEditModalOpen(true);

            // 2. AUTO-TRIGGER PREVIEW (Phase 7 Sandbox)
            // Immediately start verifying this diff in the background
            triggerPreview(activeProject, data.proposal.file_path, data.proposal.diff)
        } else {
            alert(`Proposal Error: ${data.error}`); 
        }
    } catch (e) {
        console.error(e);
        alert("Failed to connect to Edit Agent.");
    } finally {
        setIsGeneratingProposal(false);
    }
  };

  const triggerPreview = async (repoUrl: string, targetFile: string, diff: string) => {
    try {
      setPreviewStatus("queued")
      const res = await fetch('/api/apply-edit-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, targetFile, diff })
      })
      const data = await res.json()
      if (data.success) {
        setPreviewJobId(data.jobId) // Starts polling effect
      } else {
        setPreviewStatus("failed")
      }
    } catch (e) {
      console.error("Preview trigger failed", e)
      setPreviewStatus("failed")
    }
  }

  const handleApproveEdit = async () => {
    if (!activeProject || !editProposal) return;

    // 1. Safety Gate: Ensure Preview passed & Token received
    if (!previewToken) {
        if (previewStatus === 'running' || previewStatus === 'queued') {
            alert("⏳ Verifying edit safety in sandbox... please wait a moment.");
            return;
        }
        if (previewStatus === 'failed') {
            alert("❌ Edit verification failed. Cannot create PR.");
            return;
        }
        alert("⚠️ Waiting for verification token...");
        return;
    }

    setIsApplyingEdit(true);

    try {
        // 2. Call Final Write Endpoint (No PAT Headers)
        const res = await fetch('/api/apply-edit-final', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
                // REMOVED: Authorization header (PAT no longer used)
            },
            body: JSON.stringify({
                jobId: previewJobId, // Link to sandbox job
                token: previewToken, // Proof-of-Preview JWT
                repoUrl: activeProject,
                targetFile: editProposal.file_path,
                diff: editProposal.diff,
                summary: editProposal.summary
            })
        });

        const data = await res.json();

        if (data.success) {
            setIsEditModalOpen(false);
            setEditProposal(null);
            
            // Success Message
            const successMsg = `🚀 Pull Request Created!\n\nBranch: ${data.branch}\n\nThe edit is now isolated in a PR for final review.`;
            const userClick = confirm(`${successMsg}\n\nClick OK to open the PR on GitHub.`);
            
            if (userClick && data.prUrl) {
                window.open(data.prUrl, "_blank");
            }
        } else {
            // Handle Replay/Integrity Errors
            alert(`❌ Apply Failed:\n${data.error}`);
        }

    } catch (error) {
        console.error("Execute Edit Error:", error);
        alert("❌ Network error while applying edit.");
    } finally {
        setIsApplyingEdit(false);
    }
  };

  // --- UI HANDLERS ---
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
        system_architecture: aiSystemArch,
        onboarding_tracks: aiOnboardingTracks,
        key_flows: aiKeyFlows,
        impact_map: aiImpactMap
    }
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "troql-config.json"
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

      {/* Removed border from main container */}
      <main className="flex-1 m-2 rounded-xl bg-background shadow-sm overflow-hidden flex flex-col relative transition-all duration-300">
        
        {/* Removed border-b from header */}
        <div className="shrink-0 p-4 md:px-8 md:pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-3">
                {activeProject ? activeProject : "troQl"}
              </h1>
            </div>

            {activeProject && (
                <div className="flex items-center gap-2">
                    {/* TEST EDIT BUTTON */}
                    <Button 
                        size="sm"
                        variant="outline"
                        className="gap-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800"
                        onClick={handleRequestEdit}
                        disabled={isGeneratingProposal}
                    >
                        <Sparkles className={cn("w-4 h-4", isGeneratingProposal && "animate-spin")} />
                        {isGeneratingProposal ? "Analysing..." : "Test Edit"}
                    </Button>

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

        <div className="flex flex-1 overflow-hidden">
            
            <div className={cn(
                "flex-1 overflow-y-auto p-4 md:p-8",
                "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            )}>
                {activeProject ? (
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">
                        {aiKeyFlows.length > 0 && (
                            <FlowVisualizer 
                                flows={aiKeyFlows} 
                                impactMap={aiImpactMap} 
                            />
                        )}

                        <MicroTasksCard 
                            tracks={aiOnboardingTracks} 
                            onToggleTask={handleToggleTask} 
                            impactMap={aiImpactMap}
                        />
                        <SummaryCard data={aiSystemArch} />
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto mt-20">
                        <AddRepositoryCard onDataReceived={handleScanData} />
                    </div>
                )}
            </div>

            {activeProject && (
                // Removed border-l from wiki sidebar
                <div className="hidden xl:block w-[450px] bg-card/30 shrink-0 h-full relative">
                    <WikiCard 
                        repoName={activeProject} 
                        stack={detectedStack}
                        architecture={aiSystemArch} 
                    />
                </div>
            )}

        </div>

        {/* MODALS */}
        <EditProposalModal 
            open={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            onApprove={handleApproveEdit} 
            proposal={editProposal} 
            isApplying={isApplyingEdit} 
        />
        
      </main>
    </div>
  )
}