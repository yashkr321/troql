import { Info } from "lucide-react";

export function OrgLoginHint() {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-3 text-muted-foreground/80">
      <Info className="w-3 h-3 opacity-70" aria-hidden="true" />
      <span className="text-[11px] font-medium tracking-tight">
        Organization-owned repositories may require authentication due to SSO policies.
      </span>
    </div>
  );
}