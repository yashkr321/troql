"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Terminal, Search, Cpu, GitBranch, Play, FileCode } from "lucide-react"
import { FadeInUp, FadeIn } from "@/components/animations"

export default function LandingPage() {
  
  // Function to smooth scroll to "How it works"
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="sticky top-0 w-full z-50 border-b border-white/5 bg-[#0B0B0C]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
            <div className="relative w-8 h-8">
                <Image 
                src="/troql_logo2.png" // Make sure this matches your file name in the public folder
                alt="Troql Logo" 
                fill
                className="object-contain"
                />
            </div>
            Troql
          </div>
          <div className="flex items-center gap-4">
            {/* "Sign In" goes to waitlist because public users can't login yet */}
            <Link href="/waitlist" className="hidden md:block">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">Sign In</Button>
            </Link>
            <Link href="/waitlist">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 font-medium px-5 shadow-lg shadow-indigo-500/20">
                Join Waitlist
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-32 px-6 border-b border-white/5 overflow-hidden">
         {/* Background Glow */}
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

        {/* UPDATED GRID: Changed from lg:grid-cols-2 to give more space to the video (5fr text / 7fr video) */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-16 items-center">
          <div className="text-left">
            <FadeInUp delay={0.1}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                Understand code <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">in seconds.</span>
              </h1>
            </FadeInUp>
            <FadeInUp delay={0.2}>
              <p className="text-xl text-zinc-400 mb-8 max-w-lg leading-relaxed">
                Stop reading stale documentation. Troql scans your repository and generates an interactive onboarding map.
              </p>
            </FadeInUp>
            <FadeInUp delay={0.3}>
              <div className="flex flex-wrap gap-4">
                <Link href="/waitlist">
                    <Button size="lg" className="h-14 px-8 bg-white text-black hover:bg-zinc-200 font-bold text-lg">
                        Get Early Access
                    </Button>
                </Link>
                
                {/* "How it works" button instead of "View Demo" */}
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={scrollToHowItWorks}
                  className="h-14 px-8 border-white/10 hover:bg-white/5 font-medium text-lg"
                >
                    How it works
                </Button>
              </div>
              <p className="mt-6 text-sm text-zinc-500 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Works with public & private repos
              </p>
            </FadeInUp>
          </div>

          {/* Right Side: The Real Product Video */}
          <FadeIn delay={0.4} className="relative">
             {/* UPDATED VIDEO CONTAINER: 
                 1. Removed group-hover:border-indigo-500/30 to stop the hover effect.
                 2. Made base border subtler (border-zinc-800/50).
                 3. Because grid col span increased, this will naturally be larger.
             */}
             <div className="relative rounded-2xl bg-[#0B0B0C] border border-zinc-800/50 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
                
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  /* Added pointer-events-none to disable hover controls from browser */
                  className="w-full h-full object-cover pointer-events-none"
                >
                  <source src="/demo.mp4" type="video/mp4" />
                </video>

                {/* UPDATED: Removed the "Live Preview" Badge div completely */}
             </div>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-6 border-b border-white/5 bg-[#0E0E10]">
        <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-zinc-400">From URL to Onboarding in 3 steps.</p>
        </div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
             <FadeIn delay={0.1} className="p-8 rounded-2xl bg-[#0B0B0C] border border-white/5 relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">1</div>
                <h3 className="text-xl font-bold mb-2">Connect Repo</h3>
                <p className="text-zinc-400 text-sm">Paste your GitHub repository link. Troql supports TS, JS, Python, and Go.</p>
             </FadeIn>
             <FadeIn delay={0.2} className="p-8 rounded-2xl bg-[#0B0B0C] border border-white/5 relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">2</div>
                <h3 className="text-xl font-bold mb-2">AI Scan</h3>
                <p className="text-zinc-400 text-sm">We analyze your file structure, dependencies, and git history to understand the logic.</p>
             </FadeIn>
             <FadeIn delay={0.3} className="p-8 rounded-2xl bg-[#0B0B0C] border border-white/5 relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">3</div>
                <h3 className="text-xl font-bold mb-2">Start Onboarding</h3>
                <p className="text-zinc-400 text-sm">Get an interactive roadmap and a chat interface to ask questions about the code.</p>
             </FadeIn>
        </div>
      </section>

      {/* FEATURE 1: The Map */}
      <section className="py-24 px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <FadeInUp>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
                    <GitBranch className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Don't guess the architecture. See it.</h2>
                <p className="text-lg text-zinc-400 leading-relaxed mb-6">
                    New engineers usually spend weeks mentally mapping out how `auth` connects to `database`. Troql generates this map instantly, visualizing your services and dependencies.
                </p>
            </FadeInUp>
            <FadeIn className="bg-zinc-900/50 rounded-2xl aspect-video border border-white/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/5"></div>
                <GitBranch className="w-20 h-20 text-zinc-700" />
            </FadeIn>
        </div>
      </section>
      
      {/* Search Feature */}
      <section className="py-24 px-6 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <FadeIn className="order-2 md:order-1 bg-zinc-900/50 rounded-2xl aspect-video border border-white/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-500/5"></div>
                <Search className="w-20 h-20 text-zinc-700" />
            </FadeIn>
            <FadeInUp className="order-1 md:order-2">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
                    <Search className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Ask questions, get code answers.</h2>
                <p className="text-lg text-zinc-400 leading-relaxed mb-6">
                    You can't "Ctrl+F" for logic. With Troql, you can ask <i>"Where is the user session handled?"</i> and get a direct link to the exact file and lines of code.
                </p>
            </FadeInUp>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Onboard faster.</h2>
            <p className="text-xl text-zinc-400 mb-10">Join other developers skipping the documentation headache.</p>
            <div className="flex justify-center gap-4">
                <Link href="/waitlist">
                    <Button size="lg" className="h-14 px-8 bg-white text-black hover:bg-zinc-200 font-bold text-lg rounded-full">
                        Join the Waitlist
                    </Button>
                </Link>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-zinc-600 text-sm bg-[#0B0B0C] text-center">
        <p>© 2025 Troql Inc. Built in San Francisco.</p>
      </footer>

    </div>
  )
}