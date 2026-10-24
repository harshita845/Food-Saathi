import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logoMark, BRAND_TAGLINE } from './brand/FoodSaathiLogo';

export default function SplashScreen({ onFinish }) {
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    // Rider drives in, wordmark pops, then the whole scene zooms away
    const timer = setTimeout(() => {
      setIsFinishing(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 550);
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const foods = ['🍕', '🍔', '🍛', '🍩', '🥟', '🌮'];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden fs-cream-bg">
      <AnimatePresence mode="wait">
        {!isFinishing && (
          <motion.div
            key="splash-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease: [0.45, 0, 0.55, 1] }}
            className="relative flex h-full w-full items-center justify-center"
          >
            {/* Orange arc from the logo */}
            <motion.svg
              viewBox="0 0 400 220"
              className="absolute left-1/2 top-1/2 w-[min(90vw,520px)] -translate-x-1/2 -translate-y-[78%]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.path
                d="M30 210 Q200 -60 370 210"
                fill="none"
                stroke="#F2541B"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.15 }}
              />
            </motion.svg>

            {/* Floating food */}
            {foods.map((f, i) => (
              <motion.span
                key={f}
                className="absolute select-none text-3xl md:text-5xl"
                style={{ left: `${8 + (i * 16) % 84}%`, top: i % 2 ? '78%' : '16%' }}
                initial={{ opacity: 0, scale: 0, rotate: -20 }}
                animate={{ opacity: 0.85, scale: 1, rotate: 0, y: [0, -12, 0] }}
                transition={{ delay: 0.5 + i * 0.08, y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } }}
              >
                {f}
              </motion.span>
            ))}

            <div className="relative flex w-full flex-col items-center text-center">
              {/* Rider drives in from the left */}
              <motion.div
                initial={{ x: '-120vw' }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 70, damping: 14, delay: 0.1 }}
                className="relative"
              >
                <motion.img
                  src={logoMark}
                  alt="Food Saathi"
                  draggable={false}
                  className="h-44 w-auto select-none md:h-60"
                  animate={{ y: [0, -4, 0], rotate: [0, -1.5, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* puff of smoke */}
                <motion.span
                  className="absolute -left-4 bottom-4 h-6 w-6 rounded-full bg-[#F1E2D0]"
                  animate={{ x: [-4, -40], opacity: [0.8, 0], scale: [0.6, 1.6] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
                />
              </motion.div>

              <motion.h1
                initial={{ y: 24, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.9 }}
                className="font-display mt-2 select-none text-6xl font-extrabold tracking-tight md:text-8xl"
              >
                <span className="text-[#3A1C10]">Food</span>
                <span className="text-[#F2541B]">Saathi</span>
              </motion.h1>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.25, duration: 0.5 }}
                className="font-script mt-2 text-xl text-[#3A1C10] md:text-2xl"
              >
                {BRAND_TAGLINE}
              </motion.p>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.45, duration: 0.5 }}
                className="mt-1 h-[3px] w-40 origin-left rounded-full bg-[#F2541B]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
