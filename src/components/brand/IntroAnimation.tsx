"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/**
 * IntroAnimation — berry settles on top of the stone mark.
 * Shown once per session (sessionStorage), skippable, under 1s,
 * never blocks content (page renders behind it).
 * Respects prefers-reduced-motion.
 */
export function IntroAnimation() {
  const [visible, setVisible] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // Check reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return; // skip entirely
    setPrefersReduced(mq.matches);

    // Only show once per session
    if (sessionStorage.getItem("rastah_intro_seen")) return;
    sessionStorage.setItem("rastah_intro_seen", "1");

    setVisible(true);

    // Auto-dismiss after 900ms
    const timer = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(timer);
  }, []);

  if (prefersReduced) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-paper cursor-pointer"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setVisible(false)}
          onKeyDown={(e) => e.key === "Escape" && setVisible(false)}
          role="dialog"
          aria-label="Intro animation — press Escape or tap to skip"
          tabIndex={0}
        >
          <div className="relative flex flex-col items-center select-none">
            {/* Stone mark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Image
                src="/brand/logos/mark-large.png"
                alt="Rastahse stone mark"
                width={200}
                height={200}
                priority
                className="object-contain"
                style={{ maxWidth: "200px" }}
              />
            </motion.div>

            {/* Berry drop */}
            <motion.div
              className="absolute"
              style={{ top: -20, left: "50%", translateX: "-50%" }}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1], // spring-ish
              }}
            >
              <Image
                src="/brand/motifs/fruit.png"
                alt=""
                width={32}
                height={32}
                className="object-contain"
                aria-hidden="true"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
