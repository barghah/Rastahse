"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export interface BrandLoaderProps {
  size?: "sm" | "md" | "lg" | "fullscreen";
  text?: string;
  className?: string;
  light?: boolean;
  showWordmark?: boolean;
  showPathHairline?: boolean;
}

/**
 * BrandLoader — Rastahse slow-craft loading animation.
 * Features the signature balanced river-carved stone crowned with
 * the gentle levitating wild berry ("Rastah se" = From the path).
 *
 * Designed to be calm, meditative, minimal, and deeply rooted in the brand identity.
 */
export function BrandLoader({
  size = "md",
  text,
  className = "",
  light = false,
  showWordmark = true,
  showPathHairline = false,
}: BrandLoaderProps) {
  // --- Micro / Inline variant (for CTA buttons, compact badges, ~18-22px) ---
  if (size === "sm") {
    return (
      <div
        className={`inline-flex items-center justify-center gap-2.5 select-none ${className}`}
        role="status"
        aria-label={text || "Loading"}
      >
        {/* Minimal 3-element trail cairn: crowning berry + balanced stone + foundation river stone */}
        <div className="relative w-4 h-5 flex flex-col items-center justify-center shrink-0">
          {/* Berry with rhythmic pulse and glow */}
          <motion.span
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.85, 1, 0.85],
              boxShadow: light
                ? [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 8px rgba(255,255,255,0.7)",
                    "0 0 0px rgba(255,255,255,0)",
                  ]
                : [
                    "0 0 0px rgba(108,2,34,0)",
                    "0 0 8px rgba(108,2,34,0.6)",
                    "0 0 0px rgba(108,2,34,0)",
                  ],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`w-2 h-2 rounded-full block ${
              light ? "bg-[#fecdd3]" : "bg-berry"
            }`}
          />
          {/* Upper balanced stone */}
          <motion.span
            animate={{
              scaleX: [0.96, 1.04, 0.96],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`w-2.5 h-[3px] rounded-full block mt-[2px] ${
              light ? "bg-white/70" : "bg-ink/50"
            }`}
          />
          {/* Foundation river stone */}
          <span
            className={`w-3.5 h-[4px] rounded-full block mt-[2px] ${
              light ? "bg-white/95" : "bg-ink/85"
            }`}
          />
        </div>

        {text && (
          <span
            className={`font-label text-[11px] uppercase tracking-[0.2em] font-medium transition-colors ${
              light ? "text-white" : "text-ink"
            }`}
          >
            {text}
          </span>
        )}
      </div>
    );
  }

  // Proportions for Medium, Large, and Fullscreen variants
  const isFullscreen = size === "fullscreen";
  const isLarge = size === "lg" || isFullscreen;

  const emblemW = isLarge ? 64 : 44;
  const emblemH = Math.round(emblemW * (844 / 481));
  const haloSize = isLarge ? 160 : 120;
  const rippleSize = isLarge ? 130 : 96;

  const content = (
    <div
      className={`flex flex-col items-center justify-center select-none ${className}`}
      role="status"
      aria-label={text || "Loading content"}
    >
      {/* The Intact River Stone & Crimson Berry Emblem with Concentric Circular Aura */}
      <div
        className="relative flex items-center justify-center pointer-events-none"
        style={{ width: emblemW, height: emblemH }}
      >
        {/* Soft radial breathing aura (geometric circle, concentric to emblem) */}
        <motion.div
          className="absolute rounded-full pointer-events-none -z-10"
          style={{
            width: haloSize,
            height: haloSize,
            left: "50%",
            top: "50%",
            marginLeft: -haloSize / 2,
            marginTop: -haloSize / 2,
            background: light
              ? "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 45%, transparent 70%)"
              : "radial-gradient(circle, rgba(108,2,34,0.2) 0%, rgba(194,161,141,0.1) 42%, transparent 72%)",
          }}
          animate={{
            scale: [0.85, 1.25, 0.85],
            opacity: [0.35, 0.8, 0.35],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Concentric resonant ripple ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none -z-10"
          style={{
            width: rippleSize,
            height: rippleSize,
            left: "50%",
            top: "50%",
            marginLeft: -rippleSize / 2,
            marginTop: -rippleSize / 2,
            border: light
              ? "1px solid rgba(255,255,255,0.25)"
              : "1px solid rgba(108,2,34,0.15)",
          }}
          animate={{
            scale: [0.92, 1.42, 0.92],
            opacity: [0.55, 0, 0.55],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Emblem with smooth organic breathing rhythm */}
        <motion.div
          animate={{
            y: [0, -3.5, 0],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="w-full h-full flex items-center justify-center filter drop-shadow-[0_4px_14px_rgba(108,2,34,0.12)]"
        >
          <Image
            src={
              light
                ? "/brand/logos/emblem-intact-white.png"
                : "/brand/logos/emblem-intact.png"
            }
            alt="Rastah emblem"
            width={481}
            height={844}
            className="w-full h-full object-contain"
            priority
          />
        </motion.div>
      </div>

      {/* Brand Wordmark & Philosophy */}
      {showWordmark && (
        <div className="mt-3.5 flex flex-col items-center text-center">
          <p
            className={`font-label tracking-[0.35em] uppercase font-light ${
              isLarge ? "text-[12px]" : "text-[10px]"
            } ${light ? "text-white/90" : "text-ink/80"}`}
          >
            RASTAH <span className="text-berry font-serif font-medium">से</span>
          </p>

          {text ? (
            <motion.p
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className={`font-body font-light mt-1.5 ${
                isLarge ? "text-xs" : "text-[11px]"
              } ${light ? "text-white/70" : "text-ink/60"}`}
            >
              {text}
            </motion.p>
          ) : null}

          {/* Flowing Path Hairline (Represents the quiet path journey) */}
          {showPathHairline && (
            <div
              className={`h-[1.5px] rounded-full overflow-hidden relative ${
                isLarge ? "w-12 mt-3" : "w-8 mt-2.5"
              } ${light ? "bg-white/20" : "bg-ink/10"}`}
            >
              <motion.div
                className="absolute inset-y-0 w-2/5 rounded-full bg-berry"
                animate={{
                  x: ["-100%", "250%"],
                }}
                transition={{
                  duration: 1.7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Fullscreen overlay container — warm cream background matching the site theme
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
        style={{ backgroundColor: "#f8f4f1" }}
      >
        {/* Very subtle warm centre glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 55%, rgba(194,161,141,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative">{content}</div>
      </div>
    );
  }

  return content;
}
