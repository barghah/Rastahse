"use client";

import { useTransition } from "react";
import { signOut } from "@/actions/auth";

/**
 * SignOutButton — client component wrapping the signOut server action.
 */
export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => signOut())}
      disabled={isPending}
      className="shrink-0 px-4 py-2 border border-ink/15 rounded-[10px] font-label text-[10px] uppercase tracking-wider text-ink/50 hover:border-berry hover:text-berry transition-all duration-200 disabled:opacity-50"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
