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
  showPathHairline = true,
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
          {/* Berry with gentle breathing hover */}
          <motion.span
            animate={{
              y: [-1.5, 0.5, -1.5],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`w-1.5 h-1.5 rounded-full block ${
              light ? "bg-[#fecdd3]" : "bg-berry"
            }`}
          />
          {/* Upper balanced stone */}
          <motion.span
            animate={{
              scaleX: [0.96, 1.04, 0.96],
            }}
            transition={{
              duration: 1.6,
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

  // --- Proportions for Medium, Large, and Fullscreen variants ---
  const isFullscreen = size === "fullscreen";
  const isLarge = size === "lg" || isFullscreen;

  // Cairn container dimensions
  const containerW = isLarge ? 88 : 56;
  const containerH = isLarge ? 104 : 70;
  const stoneW = isLarge ? 70 : 44;
  const berryW = isLarge ? 30 : 19;
  const berryLeftOffset = isLarge ? -15 : -9.5;
  const berryTop = isLarge ? -14 : -9;
  const shadowW = isLarge ? 52 : 34;

  const content = (
    <div
      className={`flex flex-col items-center justify-center select-none ${className}`}
      role="status"
      aria-label={text || "Loading content"}
    >
      {/* The Cairn: River-carved stone + Hovering balanced berry */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: containerW, height: containerH }}
      >
        {/* River-carved foundation stone */}
        <div
          className="absolute bottom-2 flex items-center justify-center pointer-events-none"
          style={{ width: stoneW }}
        >
          <Image
            src={
              light
                ? "/brand/logos/stone-clean-white.png"
                : "/brand/logos/stone-clean.png"
            }
            alt="Rastah river stone"
            width={432}
            height={505}
            className="w-full h-auto object-contain"
            priority
          />
        </div>

        {/* Crowned wild berry with meditative levitation */}
        <motion.div
          animate={{
            y: [0, -5, 0],
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute z-10 pointer-events-none"
          style={{
            top: berryTop,
            left: "50%",
            marginLeft: berryLeftOffset,
            width: berryW,
          }}
        >
          <Image
            src="/brand/motifs/fruit-clean.png"
            alt="Rastah berry"
            width={162}
            height={205}
            className="w-full h-auto object-contain drop-shadow-xs"
            priority
          />
        </motion.div>

        {/* Ground shadow responding to breathing cairn */}
        <motion.div
          animate={{
            scaleX: [1, 0.92, 1],
            opacity: [0.65, 0.35, 0.65],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 rounded-full pointer-events-none"
          style={{
            width: shadowW,
            height: isLarge ? 6 : 4,
            background: light
              ? "radial-gradient(ellipse at center, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)"
              : "radial-gradient(ellipse at center, rgba(49,49,48,0.18) 0%, rgba(49,49,48,0) 70%)",
          }}
        />
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

  // Fullscreen overlay container — deep warm dark background matching the intro animation
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
        style={{ backgroundColor: "#1a1410" }}
      >
        {/* Warm radial glow behind the mark */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 55%, rgba(108,2,34,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="relative">{content}</div>
      </div>
    );
  }

  return content;
}
