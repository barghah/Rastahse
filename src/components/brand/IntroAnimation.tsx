"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/**
 * IntroAnimation — Bespoke architectural loading screen inspired by modern high-end ateliers.
 *
 * Key Design Attributes:
 *  - Framing: Thin architectural viewport borders with corner crosshairs & micro-metadata.
 *  - Emblem: Intact river-carved stone + wild crimson berry emblem (no cropped artifacts).
 *  - Typography: Authentic hand-drawn RASTAH wordmark with berry "से" accent.
 *  - Zero Sliding Bar: Clean, confident, pure brand mark revelation.
 *  - Exit: Smooth architectural curtain / shutter wipe upward (y: -100%), unveiling the page.
 *  - Zero 1st-glance flash: Integrates with synchronous HTML veil in layout.tsx.
 */

export function IntroAnimation() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "active" | "exit">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only play on the homepage ("/")
    if (pathname !== "/") {
      document.documentElement.classList.remove("intro-pending");
      return;
    }

    // Check if user prefers reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      document.documentElement.classList.remove("intro-pending");
      return;
    }

    // Check if intro was already seen this session
    if (sessionStorage.getItem("rastah_intro_seen")) {
      document.documentElement.classList.remove("intro-pending");
      return;
    }

    // Mark as seen so internal navigation doesn't replay
    sessionStorage.setItem("rastah_intro_seen", "1");

    // Activate interactive Framer Motion animation
    setPhase("active");

    // Hold for ~1.85s then start architectural curtain wipe exit
    timerRef.current = setTimeout(() => {
      document.documentElement.classList.remove("intro-pending");
      setPhase("exit");
    }, 1850);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (pathname !== "/") return null;

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    document.documentElement.classList.remove("intro-pending");
    setPhase("exit");
  };

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          key="intro-screen"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none"
          style={{
            backgroundColor: "#f8f4f1",
            pointerEvents: phase === "active" ? "auto" : "none",
          }}
          initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          animate={
            phase === "active"
              ? { opacity: 1, scale: 1, filter: "blur(0px)" }
              : { opacity: 0, scale: 1.04, filter: "blur(6px)" }
          }
          exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
          transition={{
            duration: 0.85,
            ease: [0.16, 1, 0.3, 1], // Smooth organic blend-in dissolve
          }}
          onAnimationComplete={() => {
            if (phase === "exit") {
              setPhase("idle");
            }
          }}
          onClick={dismiss}
          onKeyDown={(e) => (e.key === "Escape" || e.key === "Enter") && dismiss()}
          role="dialog"
          aria-label="Welcome to Rastah — Curated objects with a story"
          tabIndex={0}
        >
          {/* ── Architectural Viewport Frame (Inspired by high-end studio portfolios) ── */}
          <div className="absolute inset-3 sm:inset-5 md:inset-7 border border-[#1a1410]/12 pointer-events-none rounded-[2px]" />

          {/* Corner Crosshairs & Editorial Metadata */}
          {/* Top-Left */}
          <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 flex items-center gap-2 pointer-events-none">
            <span className="text-[#1a1410]/40 text-[10px] font-mono leading-none">+</span>
            <span className="font-label text-[9px] sm:text-[10px] tracking-[0.25em] text-[#1a1410]/50 uppercase font-medium">
              RASTAH ARCHIVE
            </span>
          </div>

          {/* Top-Right */}
          <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 flex items-center gap-2 pointer-events-none">
            <span className="font-label text-[9px] sm:text-[10px] tracking-[0.22em] text-[#1a1410]/50 uppercase font-medium">
              OBJECTS WITH A STORY
            </span>
            <span className="text-[#1a1410]/40 text-[10px] font-mono leading-none">+</span>
          </div>

          {/* Bottom-Left */}
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-4 sm:left-6 md:left-8 flex items-center gap-2 pointer-events-none">
            <span className="text-[#1a1410]/40 text-[10px] font-mono leading-none">+</span>
            <span className="font-label text-[9px] sm:text-[10px] tracking-[0.22em] text-[#1a1410]/45 uppercase">
              EST. 2024 / EDITION 01
            </span>
          </div>

          {/* Bottom-Right (Interactive Skip Button) */}
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              className="font-label text-[9px] sm:text-[10px] tracking-[0.25em] text-[#1a1410]/60 hover:text-[#6c0222] transition-colors uppercase font-medium px-1.5 py-0.5 rounded cursor-pointer"
            >
              [ ENTER ✕ ]
            </button>
            <span className="text-[#1a1410]/40 text-[10px] font-mono leading-none pointer-events-none">+</span>
          </div>

          {/* ── Centerpiece: Pure Brand Revelation ── */}
          <div className="relative flex flex-col items-center justify-center px-4 max-w-sm sm:max-w-md text-center">
            {/* The Intact River Stone & Crimson Berry Emblem */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.15,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Gentle breathing movement once settled */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{
                  delay: 0.85,
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <Image
                  src="/brand/logos/emblem-intact.png"
                  alt="Rastah emblem — River stone with crimson wild berry"
                  width={433}
                  height={808}
                  className="w-[105px] sm:w-[130px] md:w-[145px] h-auto object-contain select-none drop-shadow-xs"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Authentic Brand Wordmark ("RASTAH से") */}
            <motion.div
              className="mt-6 sm:mt-7 flex items-center justify-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Image
                src="/brand/logos/wordmark-intact.png"
                alt="RASTAH से"
                width={571}
                height={150}
                className="w-[155px] sm:w-[185px] md:w-[205px] h-auto object-contain select-none"
                priority
              />
            </motion.div>

            {/* Refined Philosophical Subtitle */}
            <motion.p
              className="mt-3.5 sm:mt-4 font-label text-[9.5px] sm:text-[10.5px] tracking-[0.28em] text-[#1a1410]/50 uppercase font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: 0.85,
                duration: 0.5,
                ease: "easeOut",
              }}
            >
              Curated objects with a story
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
