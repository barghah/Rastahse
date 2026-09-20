import type { SVGProps } from "react";

export type MotifName = "river" | "mountain" | "waves" | "path";

interface SectionDividerProps {
  motif?: MotifName;
  color?: string;
  className?: string;
  flip?: boolean;
}

/**
 * SectionDivider — A quiet, minimal artisanal section separator.
 * Displays a delicate hairline with a centered berry dot indicator.
 * Never creates large empty blocks or vertical voids.
 */
export function SectionDivider({
  className = "",
}: SectionDividerProps) {
  return (
    <div
      className={`w-full flex items-center justify-center py-6 px-4 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <div className="w-full max-w-xs h-px bg-ink/10 relative flex items-center justify-center">
        <BerryDot size={5} className="absolute" />
      </div>
    </div>
  );
}

/**
 * BackgroundMotif — Renders the brand brush motifs (river, mountain, waves, path)
 * as subtle, organic ambient watermarks behind product grids and content.
 * Grounded in slow craft and paper textures without displacing any content.
 */
interface BackgroundMotifProps {
  motif?: MotifName;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center";
  opacity?: number;
  className?: string;
  flip?: boolean;
}

export function BackgroundMotif({
  motif = "river",
  position = "top-right",
  opacity = 0.035,
  className = "",
  flip = false,
}: BackgroundMotifProps) {
  const positionClasses = {
    "top-right": "-right-16 md:-right-24 top-4 md:top-12",
    "top-left": "-left-16 md:-left-24 top-4 md:top-12",
    "bottom-right": "-right-16 md:-right-24 bottom-4 md:bottom-12",
    "bottom-left": "-left-16 md:-left-24 bottom-4 md:bottom-12",
    center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  }[position];

  return (
    <div
      className={`absolute w-[360px] sm:w-[480px] md:w-[680px] pointer-events-none select-none -z-10 overflow-hidden ${positionClasses} ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/brand/motifs/${motif}.svg`}
        alt=""
        className="w-full h-auto object-contain"
        style={{
          transform: flip ? "scaleX(-1)" : undefined,
        }}
      />
    </div>
  );
}

/** Berry dot — used as hover/active or divider indicator */
interface BerryDotProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
export function BerryDot({ size = 8, className = "", ...props }: BerryDotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill="none"
      className={`inline-block flex-shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      <circle cx="4" cy="4" r="3.5" fill="var(--berry)" />
    </svg>
  );
}
