"use client"

import { useState, useMemo } from "react"
import { Search, Loader2, Lock, Globe, FolderGit2, ChevronRight, X, Github } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { OrgLoginHint } from "./org-login-hint" 

interface AddRepositoryCardProps {
  onScan?: (repo: string, tasks: any[], stack: string, script?: string[]) => void
  onDataReceived?: (data: any, repoUrl: string) => void
}

export function AddRepositoryCard({ onScan, onDataReceived }: AddRepositoryCardProps) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showRepoList, setShowRepoList] = useState(false)
  const [userRepos, setUserRepos] = useState<any[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [repoSearch, setRepoSearch] = useState("")

  const { data: session } = useSession()

  const handleScan = async (repoUrlOverride?: string) => {
    const targetUrl = repoUrlOverride || url
    if (!targetUrl) return

    setLoading(true)
    setError(null)
    setShowRepoList(false)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl: targetUrl }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      
      if (onDataReceived) {
        onDataReceived(data, targetUrl)
      } else if (onScan) {
        onScan(
          targetUrl.replace("https://github.com/", ""), 
          data.tasks, 
          data.stack,
          data.script
        )
      }
      
      setUrl("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRepoList = async () => {
    if (showRepoList) {
      setShowRepoList(false)
      return
    }

    setShowRepoList(true)
    if (userRepos.length > 0) return 

    if (!session) return

    setLoadingRepos(true)
    try {
      const res = await fetch("/api/user/repos")
      if (!res.ok) throw new Error("Failed to fetch repositories")
      const data = await res.json()
      if (data.repos) setUserRepos(data.repos)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRepos(false)
    }
  }

  const filteredRepos = useMemo(() => {
    return userRepos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase()))
  }, [userRepos, repoSearch])

  return (
    <Card className="bg-card w-full shadow-sm"> {/* removed border */}
      <CardHeader className="pb-3 p-4 md:p-6 md:pb-3"> {/* removed border */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {showRepoList ? (
                  <Github className="w-5 h-5 text-primary" />
              ) : (
                  <Search className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-foreground text-base md:text-lg">
                {showRepoList ? "Select Repository" : "Add Repository"}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {showRepoList ? "Choose from your list" : "Scan public or private code"}
              </CardDescription>
            </div>
          </div>

          {session && (
            <Button 
              variant={showRepoList ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={handleToggleRepoList}
            >
              {showRepoList ? <X className="w-4 h-4" /> : <FolderGit2 className="w-4 h-4" />}
              <span className="hidden md:inline">{showRepoList ? "Close" : "My Repos"}</span>
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        
        {!showRepoList && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            
            <div className="relative">
              <Input
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9 h-11 bg-background border-input"
              />
              {session ? (
                <Lock className="w-4 h-4 absolute left-3 top-3.5 text-green-500" />
              ) : (
                <Globe className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
              )}
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                <X className="w-3 h-3" /> {error}
              </p>
            )}

            <Button 
              onClick={() => handleScan()} 
              disabled={loading || !url} 
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan Repository"
              )}
            </Button>

            <div className="mt-2 flex flex-col items-center gap-3">
              <OrgLoginHint />
              {!session && (
                <p className="text-[11px] text-muted-foreground">
                  Looking for private repos?
                </p>
              )}
            </div>
          </div>
        )}

        {showRepoList && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Filter repos..." 
                className="pl-9 h-9 text-sm" 
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
              />
            </div>

            {/* remove border from repo list container */}
            <div className="overflow-y-auto rounded-md bg-secondary/20 p-2 space-y-1 max-h-[260px] custom-scrollbar">
              
              {loadingRepos ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs">Fetching from GitHub...</span>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                  No repositories found.
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleScan(repo.url)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/80 border border-transparent hover:border-border transition-all group text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      
                      <div className={cn(
                        "w-8 h-8 rounded flex items-center justify-center shrink-0",
                        repo.private ? "bg-yellow-500/10 text-yellow-500" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {repo.private ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{repo.name}</p>
                      </div>

                    </div>

                    {loading && url === repo.url ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
