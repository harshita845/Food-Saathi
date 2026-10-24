import React from "react"
import { motion } from "framer-motion"

/** Shared framer-motion presets so every Food Saathi screen moves the same way. */
export const spring = { type: "spring", stiffness: 380, damping: 30 }
export const softSpring = { type: "spring", stiffness: 160, damping: 20 }

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export const stagger = (staggerChildren = 0.07, delayChildren = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

/** Route-level enter animation. Enter-only (no exit) so nested routers never stall. */
export function AnimatedPage({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Lift-on-hover, squish-on-tap card wrapper. */
export function TapCard({ children, className = "", as = "div", ...rest }) {
  const Comp = motion[as] || motion.div
  return (
    <Comp
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  )
}

/** Floating food emoji used as decoration on hero / auth screens. */
export function FloatingFoods({ items = ["🍕", "🍔", "🍛", "🥟", "🍩", "🌯"], className = "" }) {
  const spots = [
    { left: "6%", top: "12%" },
    { left: "84%", top: "10%" },
    { left: "12%", top: "70%" },
    { left: "88%", top: "62%" },
    { left: "48%", top: "4%" },
    { left: "70%", top: "86%" },
  ]
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {items.slice(0, spots.length).map((emoji, i) => (
        <motion.span
          key={i}
          className="absolute select-none text-3xl md:text-4xl"
          style={spots[i]}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0.55, 0.9, 0.55], y: [0, -14, 0], rotate: [0, i % 2 ? 10 : -10, 0], scale: 1 }}
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  )
}
