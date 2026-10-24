import React from "react"
import { motion } from "framer-motion"
import logoFull from "@/assets/logo.png"
import logoMark from "@/assets/foodsaathi-mark-transparent.png"

export const BRAND_NAME = "Food Saathi"
export const BRAND_TAGLINE = "Khushiyon ka Delivery Partner"
export { logoFull, logoMark }

/**
 * "Food" in cocoa + "Saathi" in orange, the same split the logo uses.
 * `light` flips "Food" to white for use on orange / dark backgrounds.
 */
export function SaathiWordmark({ className = "", size = "text-3xl", light = false, tagline = false, taglineClassName = "" }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className={`font-display font-extrabold tracking-tight ${size}`}>
        <span className={light ? "text-white" : "text-[#3A1C10] dark:text-[#FBEFE0]"}>Food</span>
        <span className={light ? "text-[#FFC93C]" : "text-[#F2541B]"}>Saathi</span>
      </span>
      {tagline && (
        <span className={`font-script mt-1 text-[0.8em] ${light ? "text-white/85" : "text-[#6B4A38] dark:text-[#C9AE97]"} ${taglineClassName}`}>
          {BRAND_TAGLINE}
        </span>
      )}
    </span>
  )
}

/**
 * Brand logo.
 *  - variant="full":     the full square logo artwork (scooter + wordmark + tagline)
 *  - variant="mark":     the scooter rider only, transparent background
 *  - variant="lockup":   scooter mark next to the text wordmark
 * `animated` adds a gentle idle "riding" bob.
 */
export default function FoodSaathiLogo({
  variant = "lockup",
  className = "",
  imgClassName = "",
  animated = false,
  light = false,
  size = "text-2xl",
  tagline = false,
  alt = BRAND_NAME,
}) {
  const ride = animated
    ? { animate: { y: [0, -3, 0], rotate: [0, -1.5, 0] }, transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" } }
    : {}

  if (variant === "full") {
    return (
      <motion.img
        src={logoFull}
        alt={alt}
        draggable={false}
        className={`select-none object-contain ${imgClassName || className}`}
        {...ride}
      />
    )
  }

  if (variant === "mark") {
    return (
      <motion.img
        src={logoMark}
        alt={alt}
        draggable={false}
        className={`select-none object-contain ${imgClassName || className}`}
        {...ride}
      />
    )
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <motion.img
        src={logoMark}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`h-10 w-auto select-none object-contain ${imgClassName}`}
        {...ride}
      />
      <SaathiWordmark size={size} light={light} tagline={tagline} />
      <span className="sr-only">{alt}</span>
    </span>
  )
}
