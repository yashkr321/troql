import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
// 1. IMPORT THE NEW PROVIDER
import { Providers } from "@/components/providers"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Onboard AI - Developer Onboarding",
  description: "AI-powered developer onboarding for your repositories",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        {/* 2. WRAP EVERYTHING INSIDE PROVIDERS */}
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}