import React from "react"
import { logoMark } from "./FoodSaathiLogo"

/**
 * The Food Saathi rider "on the way": the scooter bobs on a road while speed
 * lines stream behind it. CSS-only so it is safe in Suspense fallbacks and
 * fast-unmounting overlays.
 */
export default function ScooterLoader({ label = "", size = 120, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <div className="relative" style={{ width: size * 1.35, height: size }}>
        {/* speed lines */}
        <div className="absolute left-0 top-[38%] flex flex-col gap-[7px]">
          {[0.75, 1, 0.6].map((w, i) => (
            <span
              key={i}
              className="fs-speed-line block h-[4px] rounded-full bg-[#F2541B]"
              style={{ width: size * 0.28 * w, animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <img
          src={logoMark}
          alt=""
          draggable={false}
          className="absolute right-0 top-0 h-full w-auto select-none animate-fs-ride"
        />
        {/* road */}
        <div className="absolute -bottom-1 left-[18%] right-0 h-[3px] overflow-hidden rounded-full bg-[#F1E2D0]">
          <div className="h-full w-1/3 rounded-full bg-[#FFA51F] fs-road" />
        </div>
      </div>
      {label ? <p className="font-script text-base text-[#6B4A38]">{label}</p> : null}
      <style>{`
        @keyframes fs-road-move { 0% { transform: translateX(300%); } 100% { transform: translateX(-120%); } }
        .fs-road { animation: fs-road-move 1.1s linear infinite; }
      `}</style>
    </div>
  )
}
