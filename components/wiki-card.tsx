"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
// 1. Import Next.js Image component
import Image from "next/image"

interface WikiCardProps {
  repoName?: string
  stack?: string
}

interface Message {
  role: "user" | "ai"
  content: string
}

export function WikiCard({ repoName = "this repo", stack = "Unknown" }: WikiCardProps) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleAsk = async () => {
    if (!question.trim()) return

    const newMessages: Message[] = [...messages, { role: "user", content: question }]
    setMessages(newMessages)
    setQuestion("")
    setLoading(true)

    try {
      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, repoName, stack }),
      })
      const data = await res.json()

      setMessages([...newMessages, { role: "ai", content: data.answer || "I couldn't find an answer in the codebase." }])
    } catch (err) {
      setMessages([...newMessages, { role: "ai", content: "Sorry, I had trouble connecting to the brain." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border flex flex-col h-full shadow-sm relative overflow-hidden rounded-none border-0 border-l-0">
      
      {/* HEADER */}
      <CardHeader className="pb-3 p-4 border-b border-border/40 bg-card z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* 2. REPLACED SPARKLE ICON WITH LOGO */}
          <div className="w-8 h-8 shrink-0">
            <Image 
              src="/troql_logo2.png" 
              alt="Troql AI" 
              width={32} 
              height={32} 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              CodeWiki
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                Beta
              </Badge>
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0 bg-gradient-to-b from-background to-secondary/10">
        
        {/* MESSAGES AREA */}
        <div className={cn(
            "flex-1 overflow-y-auto p-4 space-y-6",
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}>
            
            {/* MINIMAL WELCOME SCREEN */}
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                        <Sparkles className="w-16 h-16 text-indigo-500 relative z-10 fill-indigo-500/10" />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3 text-foreground">
                        Hi there!
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base max-w-[280px] leading-relaxed">
                        Ask me any questions about the code
                    </p>
                </div>
            )}

            {/* Chat Messages */}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-border/50 shadow-sm",
                  m.role === "user" ? "bg-blue-600 text-white" : "bg-card text-indigo-500"
                )}>
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={cn(
                  "p-3.5 rounded-2xl text-sm max-w-[85%] shadow-sm leading-relaxed",
                  m.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-sm" 
                    : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                )}>
                    {m.content.split("`").map((part, idx) => 
                        idx % 2 === 1 ? (
                          <code key={idx} className={cn(
                            "px-1 py-0.5 rounded text-xs font-mono mx-0.5",
                            m.role === "user" ? "bg-white/20" : "bg-secondary"
                          )}>
                            {part}
                          </code>
                        ) : part
                    )}
                </div>
              </div>
            ))}

            {loading && (
               <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-card border border-border/50 text-indigo-500 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                 </div>
                 <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border/50 text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                 </div>
               </div>
            )}
            
            <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-3 bg-card border-t border-border shrink-0">
          <div className="relative flex items-center">
            <Input 
              placeholder="Ask about this repository..." 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={loading}
              className="pr-10 h-11 bg-secondary/30 border-transparent focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 shadow-none rounded-xl"
            />
            <Button 
                size="icon" 
                variant="ghost"
                className="absolute right-1 w-8 h-8 hover:bg-primary/10 hover:text-primary rounded-lg" 
                onClick={() => handleAsk()}
                disabled={loading || !question}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-[10px] text-center text-muted-foreground/40 mt-2">
            AI can make mistakes. Review generated code.
          </div>
        </div>

      </CardContent>
    </Card>
  )
}