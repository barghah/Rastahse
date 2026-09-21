"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

/**
 * AdminLoginPage — Email + password login for admin users.
 * After login, checks profiles.is_admin on the server before granting access.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Invalid email or password.");
        return;
      }

      // Verify admin flag server-side by navigating — middleware + layout will
      // validate is_admin and redirect back to /admin/login if not authorized
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#1a1410" }}
    >
      {/* Warm glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(108,2,34,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image
            src="/brand/logos/stone-clean-white.png"
            alt="RASTAH से"
            width={60}
            height={70}
            className="h-16 w-auto object-contain opacity-80"
            priority
          />
        </div>

        <p className="font-label text-[10px] text-white/30 text-center uppercase tracking-[0.3em] mb-8">
          Admin Access
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3.5 rounded-[12px] font-body text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-white/30 placeholder:text-white/25 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3.5 rounded-[12px] font-body text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-white/30 placeholder:text-white/25 transition-colors"
          />

          {error && (
            <p className="font-body text-xs text-red-400 text-center pt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-berry text-paper font-label text-[11px] uppercase tracking-widest rounded-[12px] hover:bg-[#580118] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] mt-2"
          >
            {isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="font-body text-[10px] text-white/20 text-center mt-8">
          RASTAH से — Admin Panel
        </p>
      </div>
    </div>
  );
}
