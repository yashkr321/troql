"use client"

import { useState, useEffect } from "react"
import { 
  X, Check, AlertTriangle, FileCode, GitCommit, 
  ArrowRight, ShieldAlert, History 
} from "lucide-react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// --- TYPES (Matching Backend) ---
export interface EditProposal {
  file_path: string;
  type: "UPDATE" | "CREATE";
  diff: string;
  risk_analysis: {
    level: "High" | "Medium" | "Low";
    reason: string;
    affected_flows: string[];
  };
  summary: string;
  rollback_plan: string;
}

interface EditProposalModalProps {
  open: boolean
  onClose: () => void
  onApprove: () => void // Phase 4 Step 4 trigger
  proposal: EditProposal | null
  isApplying?: boolean
}

export function EditProposalModal({ 
  open, 
  onClose, 
  onApprove, 
  proposal, 
  isApplying = false 
}: EditProposalModalProps) {
  const [highRiskConfirmed, setHighRiskConfirmed] = useState(false);

  // Reset confirmation state when modal re-opens
  useEffect(() => {
    if (open) setHighRiskConfirmed(false);
  }, [open]);

  if (!proposal) return null;

  const isHighRisk = proposal.risk_analysis.level === "High";
  // The 'Apply' button is locked if High Risk AND box not checked
  const canApprove = !isHighRisk || highRiskConfirmed;

  // Simple Diff Parser for Visualization
  const renderDiff = (diff: string) => {
    return diff.split('\n').map((line, i) => {
      // Header lines
      if (line.startsWith('+++') || line.startsWith('---')) {
        return <div key={i} className="text-muted-foreground font-bold opacity-70 select-none">{line}</div>;
      }
      // Meta lines
      if (line.startsWith('@@')) {
        return <div key={i} className="text-purple-400 font-mono my-1 opacity-80 text-xs select-none">{line}</div>;
      }
      // Additions
      if (line.startsWith('+')) {
        return <div key={i} className="bg-green-500/10 text-green-600 dark:text-green-400 border-l-2 border-green-500 pl-2 pr-2">{line}</div>;
      }
      // Deletions
      if (line.startsWith('-')) {
        return <div key={i} className="bg-red-500/10 text-red-600 dark:text-red-400 border-l-2 border-red-500 pl-2 pr-2 opacity-80 decoration-slice line-through decoration-red-500/50">{line}</div>;
      }
      // Context lines
      return <div key={i} className="text-muted-foreground pl-2.5 opacity-60">{line}</div>;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden outline-none">
        
        {/* 1. HEADER: File & Type */}
        <DialogHeader className="p-6 pb-4 border-b border-border/40 bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                <FileCode className="w-5 h-5 text-primary" />
                <span className="font-mono text-base">{proposal.file_path}</span>
                <Badge variant={proposal.type === "CREATE" ? "default" : "secondary"} className="text-[10px] h-5">
                  {proposal.type}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground/80">
                {proposal.summary}
              </DialogDescription>
            </div>
            
            {/* Risk Badge */}
            <div className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 shadow-sm",
              isHighRisk 
                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
            )}>
              {isHighRisk ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {proposal.risk_analysis.level} Impact
            </div>
          </div>

          {/* Affected Flows Warning (Only if relevant) */}
          {proposal.risk_analysis.affected_flows.length > 0 && (
             <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 rounded-md text-sm text-amber-800 dark:text-amber-200 flex gap-2.5 items-start animate-in fade-in slide-in-from-top-1">
                <GitCommit className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <span className="font-semibold text-amber-900 dark:text-amber-100">Caution:</span> This change affects {proposal.risk_analysis.affected_flows.length} critical flows.
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {proposal.risk_analysis.affected_flows.map(f => (
                        <span key={f} className="px-1.5 py-0.5 bg-white/60 dark:bg-black/20 rounded text-[10px] font-mono border border-amber-200/50 dark:border-amber-800/50">
                            {f}
                        </span>
                    ))}
                  </div>
                </div>
             </div>
          )}
        </DialogHeader>

        {/* 2. BODY: Diff Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950/50 relative">
           <ScrollArea className="flex-1">
               <div className="p-6 space-y-6">
                  
                  {/* Diff Block */}
                  <div className="rounded-md border border-border overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                     <div className="bg-muted/30 px-3 py-2 border-b text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                        <span>Unified Diff Preview</span>
                     </div>
                     <div className="p-4 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed">
                        {renderDiff(proposal.diff)}
                     </div>
                  </div>

                  {/* Rollback Plan */}
                  <div className="flex items-start gap-3 text-sm text-muted-foreground px-1 py-2 rounded-lg border border-transparent hover:bg-muted/30 transition-colors">
                     <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                        <History className="w-4 h-4" />
                     </div>
                     <div>
                        <span className="font-medium text-foreground block mb-0.5">Rollback Plan</span>
                        <span className="leading-relaxed">{proposal.rollback_plan}</span>
                     </div>
                  </div>
               </div>
           </ScrollArea>
        </div>

        {/* 3. FOOTER: Actions */}
        <DialogFooter className="p-4 border-t border-border/40 bg-muted/20 flex-col sm:flex-row gap-3 sm:gap-0 items-center justify-between">
           
           <div className="flex-1 flex items-center justify-start w-full">
              {isHighRisk && (
                 <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md border border-red-100 dark:border-red-900/30">
                    <Checkbox 
                        id="risk-confirm" 
                        checked={highRiskConfirmed}
                        onCheckedChange={(c) => setHighRiskConfirmed(!!c)}
                        className="border-red-400 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <label
                        htmlFor="risk-confirm"
                        className="text-xs font-medium leading-none cursor-pointer text-red-900 dark:text-red-200"
                    >
                        I verify that I have reviewed the risks above.
                    </label>
                 </div>
              )}
           </div>

           <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="ghost" onClick={onClose} disabled={isApplying}>
                 Cancel
              </Button>
              <Button 
                onClick={onApprove} 
                disabled={!canApprove || isApplying}
                className={cn(
                    "gap-2 min-w-[140px]",
                    isHighRisk ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary"
                )}
              >
                 {isApplying ? (
                    <>Processing...</>
                 ) : (
                    <>
                       Approve Changes <ArrowRight className="w-4 h-4 opacity-80" />
                    </>
                 )}
              </Button>
           </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}