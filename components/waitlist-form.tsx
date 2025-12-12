"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check, Loader2 } from "lucide-react"

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus("loading")

    // Replace this URL with your actual Formspree URL
    const FORMSPREE_URL = "https://formspree.io/f/xldqawkr"

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus("success")
        setEmail("")
      } else {
        setStatus("error")
      }
    } catch (error) {
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 animate-in fade-in zoom-in duration-300">
        <Check className="w-8 h-8 mb-2" />
        <p className="font-semibold">You're on the list!</p>
        <p className="text-sm opacity-80">We'll notify you when your access is ready.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm mx-auto">
      <div className="relative">
        <Input
          type="email"
          placeholder="Enter your work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className="bg-secondary/30 border-border/50 h-12 rounded-xl px-4 focus-visible:ring-indigo-500"
          required
        />
      </div>
      <Button 
        type="submit" 
        disabled={status === "loading"}
        className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
      >
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Join Early Access
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
      {status === "error" && (
        <p className="text-red-400 text-xs text-center">Something went wrong. Please try again.</p>
      )}
    </form>
  )
}
