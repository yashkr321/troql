"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface AnimationProps {
  children: ReactNode
  delay?: number
  className?: string
}

// A smooth fade up effect for text blocks
export function FadeInUp({ children, delay = 0, className = "" }: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }} // Triggers slightly before the element hits the bottom of screen
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }} // "Vercel-like" easing curve
      className={className}
    >
      {children}
    </motion.div>
  )
}

// A simpler fade in for larger sections
export function FadeIn({ children, delay = 0, className = "" }: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// A container for lists that makes items stagger in one by one
export function StaggerContainer({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.15, // The delay between each item appearing
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// The item inside a staggered list
export function StaggerItem({ children, className = "" }: { children: ReactNode, className?: string }) {
    return (
      <motion.div  // <--- The Fix: Changed to motion.div
        variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
        }}
        className={className}
      >
        {children}
      </motion.div>
    )
  }