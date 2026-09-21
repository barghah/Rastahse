"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/**
 * IntroAnimation — "The Stone breathes."
 *
 * Simple, meditative sequence (total ≈ 1.8 s):
 *  0.10 – 0.70  Full logo mark (stone + berry as one) rises gently from below
 *  0.60 – 1.10  Thin berry hairline spreads outward from centre
 *  0.90 – 1.30  "RASTAH से" fades in whole — no letter-by-letter
 *  1.80          Whole screen fades out → site revealed
 *
 * Rules:
 *  - Once per session (sessionStorage key: rastah_intro_seen)
 *  - Tap anywhere or press Escape to skip
 *  - Respects prefers-reduced-motion (skips entirely)
 */

export function IntroAnimation() {
  const [phase, setPhase] = useState<"idle" | "active" | "exit">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    if (sessionStorage.getItem("rastah_intro_seen")) return;
    sessionStorage.setItem("rastah_intro_seen", "1");

    setPhase("active");
    timerRef.current = setTimeout(() => setPhase("exit"), 1800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("exit");
  };

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{ backgroundColor: "#1a1410" }}
          initial={{ opacity: 0 }}
          animate={phase === "active" ? { opacity: 1 } : { opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === "exit" ? 0.35 : 0.25, ease: "easeInOut" }}
          onClick={dismiss}
          onKeyDown={(e) => e.key === "Escape" && dismiss()}
          role="dialog"
          aria-label="Intro — tap to skip"
          tabIndex={0}
        >
          {/* Warm candlelight glow — very subtle */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 55% 45% at 50% 52%, rgba(108,2,34,0.14) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center">
            {/* ── Full logo mark — stone + berry as one settled unit ── */}
            <motion.div
              initial={{ y: 22, opacity: 0, scale: 0.93 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src="/brand/logos/logo-primary.png"
                alt="Rastahse"
                width={200}
                height={240}
                priority
                className="object-contain"
                style={{ width: 130, height: "auto" }}
              />
            </motion.div>

            {/* ── Berry hairline — spreads outward from centre like a root ── */}
            <div
              className="relative flex items-center justify-center"
              style={{ width: 120, height: 1, marginTop: 20 }}
            >
              <motion.div
                className="absolute"
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, #b5495e 40%, #b5495e 60%, transparent)",
                  borderRadius: 1,
                }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 90, opacity: 0.8 }}
                transition={{ delay: 0.6, duration: 0.55, ease: "easeOut" }}
              />
            </div>

            {/* ── Wordmark — fades in as one, no typewriter ── */}
            <motion.div
              className="flex items-baseline gap-2.5"
              style={{ marginTop: 14 }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.45, ease: "easeOut" }}
            >
              <span
                className="font-label font-light"
                style={{
                  fontSize: 16,
                  letterSpacing: "0.38em",
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                RASTAH
              </span>
              <span
                className="font-serif font-medium"
                style={{
                  fontSize: 15,
                  color: "#b5495e",
                  letterSpacing: "0.04em",
                }}
              >
                से
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
