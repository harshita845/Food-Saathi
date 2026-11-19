import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const HANDLE = 56; // w-14
const PAD = 6; // p-1.5
const CONFIRM_AT = 0.75; // fraction of the track needed to confirm

/**
 * ActionSlider - "Swipe to Confirm".
 * Drag position lives in a motion value (no React re-render per frame), so the handle and
 * the fill move together at 60fps. Race-condition safe: isAcceptingRef prevents double-fire.
 */
export const ActionSlider = ({
  label = "Slide to Confirm",
  onConfirm,
  disabled = false,
  color = "bg-green-600",
  successLabel = "Confirmed ✓"
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [maxX, setMaxX] = useState(240);
  const containerRef = useRef(null);
  const isAcceptingRef = useRef(false);

  const x = useMotionValue(0);
  const fillWidth = useTransform(x, (v) => v + HANDLE + PAD);
  const labelOpacity = useTransform(x, [0, Math.max(1, maxX * 0.6)], [1, 0]);

  // Measure the real track width (and keep it right on resize / rotation).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => setMaxX(Math.max(0, el.offsetWidth - HANDLE - PAD * 2));
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  const snapBack = useCallback(() => {
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
  }, [x]);

  // Reset when disabled (e.g. order was claimed by another rider).
  useEffect(() => {
    if (disabled) {
      setIsSuccess(false);
      isAcceptingRef.current = false;
      x.set(0);
    }
  }, [disabled, x]);

  const handleDragEnd = async (_event, info) => {
    if (disabled || isSuccess || isAcceptingRef.current) return;

    const progress = maxX > 0 ? x.get() / maxX : 0;
    const flungRight = info.velocity.x > 800 && progress > 0.4;
    if (progress < CONFIRM_AT && !flungRight) {
      snapBack();
      return;
    }

    // Lock BEFORE any async work to prevent double accept.
    isAcceptingRef.current = true;
    setIsSuccess(true);
    animate(x, maxX, { type: 'spring', stiffness: 600, damping: 40 });
    try { navigator.vibrate?.(30); } catch {}

    if (onConfirm) {
      try {
        await onConfirm();
      } catch {
        // On failure, reset so the rider can retry.
        isAcceptingRef.current = false;
        setIsSuccess(false);
        snapBack();
      }
    }
  };

  const canDrag = !disabled && !isSuccess;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[68px] rounded-full p-1.5 overflow-hidden bg-gray-950 shadow-lg shadow-black/10 select-none"
    >
      {/* Progress fill follows the handle exactly */}
      <motion.div
        className={`absolute inset-y-0 left-0 ${color} rounded-full`}
        style={{ width: isSuccess ? '100%' : fillWidth, opacity: disabled ? 0 : 1 }}
      />

      {/* Label fades as the handle moves */}
      <motion.div
        style={{ opacity: isSuccess ? 0 : labelOpacity }}
        className={`pointer-events-none absolute inset-y-0 left-[76px] right-5 flex items-center justify-center text-center font-bold text-[11px] uppercase tracking-[0.14em] leading-none whitespace-nowrap ${
          disabled ? 'text-white/70' : 'text-white/90'
        }`}
      >
        {disabled ? 'Action Locked' : label}
      </motion.div>

      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-y-0 left-5 right-[76px] flex items-center justify-center text-center text-white font-bold text-sm uppercase tracking-[0.14em] leading-none z-30"
          >
            {successLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Handle */}
      <motion.div
        drag={canDrag ? 'x' : false}
        dragConstraints={{ left: 0, right: maxX }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, touchAction: 'none' }}
        whileTap={canDrag ? { scale: 0.96 } : undefined}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center z-20 shadow-xl will-change-transform ${
          canDrag ? 'cursor-grab active:cursor-grabbing' : ''
        } ${disabled ? 'bg-gray-200 text-gray-400' : isSuccess ? 'bg-white text-green-600' : 'bg-white text-gray-950'}`}
      >
        <ChevronRight className="w-8 h-8" />
      </motion.div>
    </div>
  );
};

export default ActionSlider;
