"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  className?: string;
  variant?: "sidebar" | "compact" | "drawer";
}

export function AdminSignOutButton({ className = "", variant = "sidebar" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Ignore error and proceed to login
      }
      router.push("/admin/login");
      router.refresh();
    });
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        title="Sign Out of Admin"
        className={`p-2 rounded-[10px] text-ink/50 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer ${className}`}
      >
        <span className="text-sm">🚪</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[12px] font-label text-[11px] uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200/80 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-semibold shadow-xs ${className}`}
    >
      <span>🚪</span>
      <span>{isPending ? "Signing Out…" : "Log Out of Admin"}</span>
    </button>
  );
}
