"use client"

import Image from "next/image"
import { PanelLeftClose, PanelLeft, Github, LogOut, Plus, FolderGit2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export interface HistoryItem {
  repo: string
  stack: string
  tasks: any[]
  script?: string[]
  summary?: string    // <--- NEW
  features?: string[] // <--- NEW
  date: string
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  history: HistoryItem[]
  onSelectRepo: (repo: HistoryItem) => void
  onNewScan: () => void
}

export function Sidebar({ collapsed, onToggle, isMobile, history, onSelectRepo, onNewScan }: SidebarProps) {
  const { data: session } = useSession()

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out h-full overflow-hidden",
        isMobile ? "w-72" : collapsed ? "w-16" : "w-64",
      )}
    >
      {collapsed && !isMobile && (
        <div className="flex flex-col h-full items-center py-4 gap-4">
           {/* RAIL LOGO */}
           <div className="mb-2 shrink-0">
             <Image 
                src="/troql_logo.png" 
                alt="Troql Logo"
                width={32} 
                height={32} 
                priority
                className="w-8 h-8" 
              />
           </div>

           {/* Toggle */}
           <Button variant="ghost" size="icon" onClick={onToggle} title="Expand Sidebar">
              <PanelLeft className="w-5 h-5 text-muted-foreground" />
           </Button>

           {/* New Chat */}
           <Button 
                variant="ghost" 
                size="icon" 
                onClick={onNewScan} 
                className="bg-secondary/50 hover:bg-secondary text-foreground"
                title="New Onboarding"
            >
              <Plus className="w-5 h-5" />
           </Button>

           <div className="flex-1" />

           {/* Profile */}
           {session ? (
             <div className="flex flex-col items-center gap-3 mb-2">
                <Button variant="ghost" size="icon" title="Settings">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                </Button>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                    {session.user?.image ? (
                        <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center text-xs">U</div>
                    )}
                </div>
             </div>
           ) : (
             <Button variant="ghost" size="icon" onClick={() => signIn("github")}>
                <Github className="w-5 h-5" />
             </Button>
           )}
        </div>
      )}

      {(!collapsed || isMobile) && (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 border-b border-sidebar-border shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                    <Image 
                        src="/troql_logo.png" 
                        alt="Troql AI"
                        width={40}
                        height={40}
                        priority 
                        className="w-10 h-10"
                    />
                    <span className="font-bold text-foreground text-xl tracking-tight whitespace-nowrap">troQl</span>
                    </div>
                    
                    <button
                        onClick={onToggle}
                        className="p-2.5 md:p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors touch-manipulation"
                    >
                        <PanelLeftClose className="w-5 h-5" />
                    </button>
                </div>

                <button 
                    onClick={onNewScan}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md border border-border bg-background hover:bg-sidebar-accent transition-colors text-sm font-medium shadow-sm group whitespace-nowrap"
                >
                    <div className="p-1 rounded bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span>New Onboarding</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 min-h-0">
                <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Scans
                </div>
                
                {(!history || history.length === 0) ? (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center italic">
                        No recent history
                    </div>
                ) : (
                    <div className="space-y-1">
                        {history.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSelectRepo(item)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors text-left group"
                            >
                                <FolderGit2 className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100" />
                                <div className="flex-1 truncate font-medium">
                                    {item.repo}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-sidebar-border mt-auto shrink-0">
                {session ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
                                {session.user?.image ? (
                                    <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-secondary flex items-center justify-center text-xs">
                                        {session.user?.name?.[0] || "U"}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{session.user?.name}</p>
                                <button 
                                    onClick={() => signOut()}
                                    className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 transition-colors mt-0.5"
                                >
                                    <LogOut className="w-3 h-3" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                    onClick={() => signIn("github")}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors whitespace-nowrap"
                    >
                    <Github className="w-4 h-4" />
                    Sign In
                    </button>
                )}
            </div>
        </div>
      )}
    </aside>
  )
}