import { WaitlistForm } from "@/components/waitlist-form"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />

      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 relative">
             <Image src="/troql_logo2.png" alt="Troql" width={32} height={32} className="object-contain" />
          </div>
          Troql
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative z-10">
        
        <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full text-indigo-400 bg-indigo-500/10 border-indigo-500/20">
          ✨ Public Beta Coming Soon
        </Badge>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Onboard developers <br />
          <span className="text-indigo-500">in seconds, not weeks.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Troql scans your codebase and instantly generates interactive onboarding tasks, 
          turning complex repositories into a simple roadmap.
        </p>

        {/* The Form Component */}
        <WaitlistForm />

        <div className="mt-12 flex items-center gap-4 text-sm text-muted-foreground/60">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border border-black ring-2 ring-background" />
            ))}
          </div>
          <p>Joined by 400+ engineers</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted-foreground/40">
        © 2025 Troql Inc. All rights reserved.
      </footer>
    </div>
  )
}