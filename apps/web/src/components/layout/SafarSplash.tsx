import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type SafarSplashProps = {
  /** Full-screen boot overlay vs inline route loader */
  mode?: "fullscreen" | "inline";
  /** Called when animation completes */
  onFinish?: () => void;
  /** Minimum time visible (ms) */
  duration?: number;
};

const TAGLINES = [
  { text: "Travel Smarter.", accent: false },
  { text: "Travel Safer.", accent: true },
] as const;

export function SafarSplash({
  mode = "fullscreen",
  onFinish,
  duration = 2600,
}: SafarSplashProps) {
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const swap = window.setTimeout(() => setTaglineIdx(1), 900);
    const hide = window.setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, duration);
    return () => {
      window.clearTimeout(swap);
      window.clearTimeout(hide);
    };
  }, [duration, onFinish]);

  const isFullscreen = mode === "fullscreen";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="safar-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={
            isFullscreen
              ? "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0a0c]"
              : "flex min-h-[50vh] flex-col items-center justify-center py-16"
          }
          aria-live="polite"
          aria-label="Safar is loading"
        >
          {/* Subtle ambient glow */}
          {isFullscreen && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(59,130,246,0.12), transparent 70%)",
              }}
            />
          )}

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.72, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.img
              src="/safar-logo.png"
              alt="Safar"
              className={
                isFullscreen
                  ? "h-24 w-24 object-contain sm:h-28 sm:w-28"
                  : "h-16 w-16 object-contain sm:h-20 sm:w-20"
              }
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Brand name */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={
              isFullscreen
                ? "relative mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl"
                : "relative mt-3 text-xl font-bold tracking-tight text-white"
            }
          >
            Safar
          </motion.p>

          {/* Tagline crossfade */}
          <div
            className={
              isFullscreen
                ? "relative mt-2 h-8 overflow-hidden sm:h-9"
                : "relative mt-1.5 h-7 overflow-hidden"
            }
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={taglineIdx}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={
                  isFullscreen
                    ? `text-center text-base font-semibold sm:text-lg ${
                        TAGLINES[taglineIdx].accent ? "text-[#3B82F6]" : "text-[#A1A1AA]"
                      }`
                    : `text-center text-sm font-semibold ${
                        TAGLINES[taglineIdx].accent ? "text-[#3B82F6]" : "text-[#A1A1AA]"
                      }`
                }
              >
                {TAGLINES[taglineIdx].text}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Loading bar — fullscreen only */}
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="relative mt-8 h-0.5 w-32 overflow-hidden rounded-full bg-white/10 sm:w-40"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#22C55E]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: duration / 1000, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
