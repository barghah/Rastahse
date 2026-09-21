"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * AdminLoginPage — Email + password login for admin users in Rastah's signature light paper theme.
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

      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      {/* Background ambient warmth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 40%, rgba(194,161,141,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md bg-paper border border-brand shadow-soft rounded-[24px] p-8 sm:p-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-auto mb-4">
            <Image
              src="/brand/logos/emblem-intact.png"
              alt="RASTAH emblem"
              width={433}
              height={808}
              className="w-full h-auto object-contain select-none"
              priority
            />
          </div>
          <Image
            src="/brand/logos/wordmark-intact.png"
            alt="RASTAH से"
            width={571}
            height={150}
            className="w-36 h-auto object-contain select-none mb-2"
            priority
          />
          <p className="font-label text-[10px] text-ink/40 uppercase tracking-[0.28em] mt-1">
            Admin Access
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-medium">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@rastahse.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-[12px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
            />
          </div>

          <div>
            <label className="font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-medium">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-[12px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-[10px] bg-red-50 border border-red-200">
              <p className="font-body text-xs text-red-600 text-center font-medium">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-berry text-paper font-label text-[11px] uppercase tracking-widest rounded-[12px] hover:bg-[#580118] disabled:opacity-50 transition-all duration-200 active:scale-[0.99] shadow-sm cursor-pointer mt-2"
          >
            {isPending ? "Authenticating…" : "Sign In to Admin"}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-brand flex items-center justify-between">
          <Link
            href="/"
            className="font-label text-[10px] text-ink/50 hover:text-berry transition-colors uppercase tracking-wider"
          >
            ← Return to Store
          </Link>
          <span className="font-body text-[10px] text-ink/30">
            RASTAH Archive
          </span>
        </div>
      </div>
    </div>
  );
}
