import React, { useRef, useEffect, useState, useCallback } from "react";
import { ChevronRight, Loader2 } from "lucide-react";

/**
 * SlideToAcceptSlider
 * High-performance, hardware-accelerated swipe slider with 0 React re-renders during drag.
 * Uses Pointer Events API + setPointerCapture for 100% fluid 60/120 FPS dragging on mobile and desktop.
 */
export default function SlideToAcceptSlider({
  onAccept,
  countdown = 180,
  maxCountdown = 180,
  isAccepting = false,
  formatTime,
}) {
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const fillRef = useRef(null);
  const labelRef = useRef(null);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isAcceptedRef = useRef(false);

  // Helper to compute max travel distance
  const getMaxTravel = useCallback(() => {
    if (!containerRef.current || !handleRef.current) return 240;
    const containerWidth = containerRef.current.offsetWidth || 320;
    const handleWidth = handleRef.current.offsetWidth || 44;
    // 8px margin/padding on each side
    return Math.max(containerWidth - handleWidth - 16, 60);
  }, []);

  // Reset handle position when isAccepting resets to false
  useEffect(() => {
    if (!isAccepting && !isDraggingRef.current) {
      isAcceptedRef.current = false;
      currentXRef.current = 0;
      if (handleRef.current) {
        handleRef.current.style.transition = "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)";
        handleRef.current.style.transform = "translate3d(0px, 0, 0)";
      }
      if (fillRef.current) {
        fillRef.current.style.transition = "width 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)";
        fillRef.current.style.width = "0px";
      }
      if (labelRef.current) {
        labelRef.current.style.transition = "opacity 0.2s ease";
        labelRef.current.style.opacity = "1";
      }
    }
  }, [isAccepting]);

  const onPointerDown = (e) => {
    if (isAccepting || isAcceptedRef.current) return;

    // Capture pointer so all subsequent moves and release are caught even outside the element
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    isDraggingRef.current = true;
    startXRef.current = e.clientX - currentXRef.current;

    // Disable transitions during direct drag for instant 1:1 response
    if (handleRef.current) handleRef.current.style.transition = "none";
    if (fillRef.current) fillRef.current.style.transition = "none";
    if (labelRef.current) labelRef.current.style.transition = "none";
  };

  const onPointerMove = (e) => {
    if (!isDraggingRef.current || isAccepting || isAcceptedRef.current) return;

    const maxTravel = getMaxTravel();
    const rawX = e.clientX - startXRef.current;
    // Clamp between 0 and maxTravel with a tiny bit of rubber-band damping
    const clampedX = Math.max(0, Math.min(rawX, maxTravel));
    currentXRef.current = clampedX;

    // Hardware-accelerated GPU translate
    if (handleRef.current) {
      handleRef.current.style.transform = `translate3d(${clampedX}px, 0, 0)`;
    }
    if (fillRef.current) {
      fillRef.current.style.width = `${clampedX + 24}px`;
    }
    if (labelRef.current) {
      const progress = clampedX / maxTravel;
      // Fade label smoothly as user drags across
      labelRef.current.style.opacity = String(Math.max(0.05, 1 - progress * 1.5));
    }
  };

  const onPointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (isAccepting || isAcceptedRef.current) return;

    const maxTravel = getMaxTravel();
    const threshold = maxTravel * 0.65; // 65% swipe to accept

    if (currentXRef.current >= threshold) {
      // Completed swipe!
      isAcceptedRef.current = true;
      currentXRef.current = maxTravel;

      // Animate handle smoothly to end
      if (handleRef.current) {
        handleRef.current.style.transition = "transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)";
        handleRef.current.style.transform = `translate3d(${maxTravel}px, 0, 0)`;
      }
      if (fillRef.current) {
        fillRef.current.style.transition = "width 0.16s cubic-bezier(0.16, 1, 0.3, 1)";
        fillRef.current.style.width = "100%";
      }
      if (labelRef.current) {
        labelRef.current.style.transition = "opacity 0.15s ease";
        labelRef.current.style.opacity = "0";
      }

      // Trigger accept callback
      if (typeof onAccept === "function") {
        onAccept();
      }
    } else {
      // Released before threshold: spring back to start
      currentXRef.current = 0;
      if (handleRef.current) {
        handleRef.current.style.transition = "transform 0.26s cubic-bezier(0.25, 1, 0.5, 1)";
        handleRef.current.style.transform = "translate3d(0px, 0, 0)";
      }
      if (fillRef.current) {
        fillRef.current.style.transition = "width 0.26s cubic-bezier(0.25, 1, 0.5, 1)";
        fillRef.current.style.width = "0px";
      }
      if (labelRef.current) {
        labelRef.current.style.transition = "opacity 0.2s ease";
        labelRef.current.style.opacity = "1";
      }
    }
  };

  const timerPercent = Math.max(0, Math.min(100, (countdown / maxCountdown) * 100));

  return (
    <div
      ref={containerRef}
      className="relative h-14 w-full rounded-2xl bg-gray-900 overflow-hidden select-none touch-none shadow-inner"
    >
      {/* Countdown progress layer (animates smoothly as countdown ticks down) */}
      <div
        className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-1000 ease-linear"
        style={{ width: `${timerPercent}%` }}
      />

      {/* Dynamic swipe fill layer */}
      <div
        ref={fillRef}
        className="absolute inset-y-0 left-0 bg-white/20 pointer-events-none"
        style={{ width: "0px" }}
      />

      {/* Centered label */}
      <div
        ref={labelRef}
        className="absolute inset-0 flex items-center justify-center px-14 pointer-events-none z-10 transition-opacity"
      >
        <span className="text-sm font-semibold text-white tracking-wide text-center drop-shadow-sm truncate">
          {isAccepting
            ? "Accepting order..."
            : `Slide to accept (${typeof formatTime === "function" ? formatTime(countdown) : `${countdown}s`})`}
        </span>
      </div>

      {/* Swipeable Handle Button */}
      <div
        ref={handleRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-md cursor-grab active:cursor-grabbing transition-shadow active:shadow-lg ${
          isAccepting ? "cursor-not-allowed opacity-80" : ""
        }`}
        style={{
          transform: "translate3d(0px, 0, 0)",
          touchAction: "none",
        }}
        aria-label="Slide to accept order"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {isAccepting ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        ) : (
          <ChevronRight className="w-6 h-6 stroke-[3] text-blue-600 transition-transform" />
        )}
      </div>
    </div>
  );
}
