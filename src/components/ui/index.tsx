"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-mist rounded-[12px] animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-product w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "berry" | "ink" | "surface" | "kraft";
  className?: string;
}

export function Badge({ children, variant = "surface", className = "" }: BadgeProps) {
  const variants = {
    berry: "bg-berry text-paper",
    ink: "bg-ink text-paper",
    surface: "bg-surface text-ink",
    kraft: "bg-kraft text-ink",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full font-label text-[10px] tracking-[0.2em] ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Fade-up animation wrapper */
interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}
export function FadeUp({ children, delay = 0, className = "" }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggered grid container */
interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
}
export function StaggerGrid({ children, className = "" }: StaggerGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Item variant for StaggerGrid */
export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};
