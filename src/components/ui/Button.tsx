"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { BrandLoader } from "@/components/ui/BrandLoader";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-berry text-paper hover:bg-[#580118] shadow-soft hover:shadow-[0_4px_16px_rgba(108,2,34,0.18)] disabled:opacity-50",
  secondary:
    "bg-surface text-ink hover:bg-mist/60 border-brand disabled:opacity-50",
  ghost:
    "bg-transparent text-ink hover:bg-surface disabled:opacity-50",
  outline:
    "bg-transparent text-berry border border-berry hover:bg-berry hover:text-paper disabled:opacity-50",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-4 text-xs",
  md: "h-10 px-6 text-xs",
  lg: "h-12 px-8 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    disabled,
    children,
    className = "",
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.985 }}
      whileHover={isDisabled ? undefined : { y: -0.5 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-[12px] font-label",
        "transition-colors duration-200 cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-berry focus-visible:outline-offset-2",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...(props as HTMLMotionProps<"button">)}
    >
      {loading ? (
        <BrandLoader
          size="sm"
          light={variant === "primary"}
        />
      ) : (
        children
      )}
    </motion.button>
  );
});

