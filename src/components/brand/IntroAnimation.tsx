"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/**
 * IntroAnimation — "The Path reveals itself."
 *
 * Sequence (total ≈ 2.6 s):
 *  0.20 – 0.80  River stone rises from below, settles
 *  0.55 – 1.20  Wild berry drops from above with spring bounce
 *  0.95 – 1.65  Wordmark letters write in one by one
 *  1.35 – 2.20  Thin gradient path line sweeps left → right
 *  1.95 – 2.30  Tagline "Curated objects with a story" fades in
 *  2.40 – 2.70  Whole screen fades out → site is revealed
 *
 * Background: site paper/surface (#f8f4f1) — warm cream, matches the theme.
 * Text & elements use ink colours, berry accent for से and path line.
 *
 * Rules:
 *  - Shown once per session (sessionStorage key: rastah_intro_seen)
 *  - Fully skippable on tap / press Escape
 *  - Respects prefers-reduced-motion (skips entirely)
 */

const WORDMARK_PRIMARY = "RASTAH";
const WORDMARK_SE = "से";
const TAGLINE = "Curated objects with a story";

export function IntroAnimation() {
  const [phase, setPhase] = useState<"idle" | "active" | "exit">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    if (sessionStorage.getItem("rastah_intro_seen")) return;
    sessionStorage.setItem("rastah_intro_seen", "1");

    setPhase("active");
    timerRef.current = setTimeout(() => setPhase("exit"), 2600);

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
          style={{ backgroundColor: "#f8f4f1" }}
          initial={{ opacity: 0 }}
          animate={phase === "active" ? { opacity: 1 } : { opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: phase === "exit" ? 0.4 : 0.3,
            ease: "easeInOut",
          }}
          onClick={dismiss}
          onKeyDown={(e) => e.key === "Escape" && dismiss()}
          role="dialog"
          aria-label="Intro animation — tap or press Escape to skip"
          tabIndex={0}
        >
          {/* Subtle warm vignette — like light through a window */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(194,161,141,0.08) 0%, transparent 80%)",
            }}
          />

          {/* ── Core composition ── */}
          <div className="relative flex flex-col items-center">

            {/* ── Stone + Berry Cairn ── */}
            <div
              className="relative flex items-end justify-center"
              style={{ width: 180, height: 220 }}
            >
              {/* River stone — rises from below */}
              <motion.div
                className="absolute bottom-4"
                initial={{ y: 30, opacity: 0, scale: 0.92 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src="/brand/logos/stone-only.png"
                  alt="Rastahse stone"
                  width={432}
                  height={505}
                  className="object-contain"
                  style={{ width: 130, height: "auto" }}
                  priority
                />
              </motion.div>

              {/* Subtle ground shadow */}
              <motion.div
                className="absolute bottom-1 rounded-full"
                style={{
                  width: 100,
                  height: 8,
                  background:
                    "radial-gradient(ellipse at center, rgba(49,49,48,0.08) 0%, transparent 70%)",
                }}
                initial={{ scaleX: 0.5, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
              />

              {/* Wild berry — drops with spring bounce */}
              <motion.div
                className="absolute z-10"
                style={{ top: 0, left: "50%", marginLeft: -22 }}
                initial={{ y: -90, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.55,
                  duration: 0.65,
                  ease: [0.34, 1.56, 0.64, 1],
                  opacity: { duration: 0.25, delay: 0.55 },
                }}
              >
                {/* Gentle hover after landing */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    delay: 1.25,
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Image
                    src="/brand/motifs/fruit.png"
                    alt=""
                    width={162}
                    height={205}
                    className="object-contain"
                    aria-hidden="true"
                    style={{ width: 44, height: "auto" }}
                    priority
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* ── Wordmark ── */}
            <div className="mt-5 flex items-baseline gap-2.5">
              {/* "RASTAH" — letters stagger in */}
              <div className="flex">
                {WORDMARK_PRIMARY.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    className="font-label font-light"
                    style={{
                      fontSize: "clamp(22px, 5vw, 30px)",
                      letterSpacing: "0.38em",
                      lineHeight: 1,
                      color: "#4e4e4e",
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.95 + i * 0.07,
                      duration: 0.35,
                      ease: "easeOut",
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>

              {/* "से" — in berry, slight delay after RASTAH finishes */}
              <motion.span
                className="font-serif font-medium"
                style={{
                  fontSize: "clamp(20px, 4.5vw, 28px)",
                  color: "#6c0222",
                  lineHeight: 1,
                  letterSpacing: "0.04em",
                }}
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 1.42,
                  duration: 0.4,
                  ease: [0.34, 1.3, 0.64, 1],
                }}
              >
                {WORDMARK_SE}
              </motion.span>
            </div>

            {/* ── Sweeping path line ── */}
            <div
              className="mt-5 relative overflow-hidden rounded-full"
              style={{
                width: 140,
                height: 1,
                background: "rgba(49,49,48,0.08)",
              }}
            >
              {/* Moving sweep */}
              <motion.div
                className="absolute inset-y-0 rounded-full"
                style={{
                  width: "60%",
                  background:
                    "linear-gradient(90deg, transparent, #6c0222, #c2a18d, transparent)",
                }}
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ delay: 1.35, duration: 0.9, ease: "easeInOut" }}
              />
              {/* Residual gentle glow after sweep */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(108,2,34,0.18)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.1, duration: 0.3 }}
              />
            </div>

            {/* ── Tagline ── */}
            <motion.p
              className="mt-4 font-body font-light text-center"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                color: "rgba(49,49,48,0.38)",
                textTransform: "uppercase",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.95, duration: 0.5, ease: "easeOut" }}
            >
              {TAGLINE}
            </motion.p>
          </div>

          {/* ── Skip hint ── */}
          <motion.p
            className="absolute bottom-8 font-label text-center"
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "rgba(49,49,48,0.22)",
              textTransform: "uppercase",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.4 }}
          >
            Tap to skip
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
