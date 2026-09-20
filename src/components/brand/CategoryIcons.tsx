"use client";
// Brand icon components for new categories (placeholder — replace with designer's artwork)
// All follow brand rule: flat charcoal silhouette + small dotted berry on top, no outline, no gradient.

interface IconProps {
  className?: string;
  fruitColor?: string;
}

/** PLACEHOLDER: Bags icon — flat charcoal tote silhouette + berry dot */
export function BagsIcon({ className = "w-10 h-10", fruitColor = "#48010d" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      {/* PLACEHOLDER: replace with designer's icon */}
      {/* Berry dot */}
      <circle cx="32" cy="10" r="5" fill={fruitColor} />
      {/* Tote bag body */}
      <path
        d="M14 28 Q12 26 12 24 L12 52 Q12 54 14 54 L50 54 Q52 54 52 52 L52 24 Q52 22 50 24 Z"
        fill="#313130"
      />
      {/* Handles */}
      <path
        d="M22 28 Q22 18 32 18 Q42 18 42 28"
        stroke="#313130"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** PLACEHOLDER: Footwear icon — flat charcoal chappal silhouette + berry dot */
export function FootwearIcon({ className = "w-10 h-10", fruitColor = "#57253e" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      {/* PLACEHOLDER: replace with designer's icon */}
      {/* Berry dot */}
      <circle cx="32" cy="10" r="5" fill={fruitColor} />
      {/* Chappal sole */}
      <ellipse cx="32" cy="46" rx="22" ry="7" fill="#313130" />
      {/* Strap */}
      <path
        d="M16 38 Q24 30 32 32 Q40 34 48 28"
        stroke="#313130"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** PLACEHOLDER: Souvenirs icon — flat charcoal ornament silhouette + berry dot */
export function SouvenirsIcon({ className = "w-10 h-10", fruitColor = "#0f1b37" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      {/* PLACEHOLDER: replace with designer's icon */}
      {/* Berry dot */}
      <circle cx="32" cy="10" r="5" fill={fruitColor} />
      {/* Small ornament / diya shape */}
      <path
        d="M18 54 Q32 28 46 54 Z"
        fill="#313130"
      />
      <ellipse cx="32" cy="54" rx="14" ry="4" fill="#313130" />
    </svg>
  );
}
