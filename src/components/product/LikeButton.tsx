"use client";

import { motion } from "framer-motion";
import { useLikesStore } from "@/stores/likes-store";

interface LikeButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "md";
}

export function LikeButton({ productId, className = "", size = "md" }: LikeButtonProps) {
  const toggleLike = useLikesStore((s) => s.toggleLike);
  const isLiked = useLikesStore((s) => s.isLiked(productId));

  const iconSize = size === "sm" ? 16 : 20;

  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLike(productId);
      }}
      whileTap={{ scale: 0.85 }}
      className={`flex items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-berry ${
        isLiked
          ? "text-berry"
          : "text-ink/30 hover:text-berry/70"
      } ${className}`}
      aria-label={isLiked ? `Unlike ${productId}` : `Like ${productId}`}
      aria-pressed={isLiked}
    >
      <motion.svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 20 20"
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.25 }}
      >
        <path d="M10 16.5s-7-4.5-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 7.5c0 4.5-7 9-7 9z" />
      </motion.svg>
    </motion.button>
  );
}
