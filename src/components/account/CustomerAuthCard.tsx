"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { customerSignInAction, customerSignUpAction } from "@/actions/customer-auth";

export function CustomerAuthCard() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await customerSignInAction({
        email: signInEmail,
        password: signInPassword,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await customerSignUpAction({
        email: signUpEmail,
        password: signUpPassword,
        fullName: signUpName,
        phone: signUpPhone || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Could not complete registration.");
        setIsLoading(false);
        return;
      }

      setSuccessMsg(res.message || "Account created! Signing you in...");
      setTimeout(() => {
        router.refresh();
      }, 700);
    } catch {
      setErrorMsg("An unexpected error occurred during signup.");
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="bg-paper rounded-[24px] border border-brand p-6 sm:p-8 shadow-card space-y-6">
        {/* Brand insignia */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-surface border border-brand flex items-center justify-center">
            <Image
              src="/brand/logos/stone-only.png"
              alt="Rastah Emblem"
              width={28}
              height={28}
              className="w-7 h-7 object-contain opacity-70"
            />
          </div>
          <h1 className="font-hand text-3xl text-ink">Collector Sanctuary</h1>
          <p className="font-body text-xs text-ink/60 max-w-xs">
            Save delivery addresses, track packages live, and access your order history.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-surface p-1 rounded-[12px] border border-brand/50">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-center rounded-[9px] font-label text-[11px] uppercase tracking-wider transition-all ${
              tab === "signin"
                ? "bg-paper text-ink font-semibold shadow-soft"
                : "text-ink/50 hover:text-ink"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-center rounded-[9px] font-label text-[11px] uppercase tracking-wider transition-all ${
              tab === "signup"
                ? "bg-paper text-ink font-semibold shadow-soft"
                : "text-ink/50 hover:text-ink"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50/80 border border-red-200 rounded-[12px] text-red-700 text-xs font-body flex items-start gap-2">
            <span className="shrink-0 text-sm">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-[12px] text-emerald-800 text-xs font-body flex items-start gap-2">
            <span className="shrink-0 text-sm">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="collector@rastah.com"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-surface border border-brand text-xs font-body text-ink placeholder:text-ink/30 focus:outline-none focus:border-berry"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-label text-[10px] uppercase tracking-wider text-ink/60">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-surface border border-brand text-xs font-body text-ink placeholder:text-ink/30 focus:outline-none focus:border-berry"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-[12px] bg-berry text-paper font-label text-[11px] uppercase tracking-widest hover:bg-[#580118] transition-colors disabled:opacity-50 shadow-soft cursor-pointer font-medium"
            >
              {isLoading ? "Signing in..." : "Access Account"}
            </button>
          </form>
        )}

        {/* Create Account Form */}
        {tab === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-surface border border-brand text-xs font-body text-ink placeholder:text-ink/30 focus:outline-none focus:border-berry"
              />
            </div>

            <div>
              <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="aarav@example.com"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-surface border border-brand text-xs font-body text-ink placeholder:text-ink/30 focus:outline-none focus:border-berry"
              />
            </div>

            <div>
              <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                Phone Number <span className="text-ink/40 font-normal lowercase">(for delivery updates)</span>
              </label>
              <input
                type="tel"
                value={signUpPhone}
                onChange={(e) => setSignUpPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-surface border border-brand text-xs font-body text-ink placeholder:text-ink/30 focus:outline-none focus:border-berry"
              />
            </div>

            <div>
              <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                Password <span className="text-ink/40 font-normal lowercase">(min. 6 characters)</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-surface border border-brand text-xs font-body text-ink placeholder:text-ink/30 focus:outline-none focus:border-berry"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-[12px] bg-berry text-paper font-label text-[11px] uppercase tracking-widest hover:bg-[#580118] transition-colors disabled:opacity-50 shadow-soft cursor-pointer font-medium"
            >
              {isLoading ? "Creating Account..." : "Create Account & Continue"}
            </button>
          </form>
        )}

        {/* Perks badge list */}
        <div className="pt-4 border-t border-brand/60 space-y-2">
          <p className="font-label text-[9px] uppercase tracking-wider text-ink/40 text-center">
            Collector Privileges
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-[10px] bg-surface/50 border border-brand/40">
              <span className="block text-sm">📍</span>
              <span className="font-label text-[8.5px] uppercase tracking-wider text-ink/70">
                Max 3 Addresses
              </span>
            </div>
            <div className="p-2 rounded-[10px] bg-surface/50 border border-brand/40">
              <span className="block text-sm">📦</span>
              <span className="font-label text-[8.5px] uppercase tracking-wider text-ink/70">
                Live Tracking
              </span>
            </div>
            <div className="p-2 rounded-[10px] bg-surface/50 border border-brand/40">
              <span className="block text-sm">⚡</span>
              <span className="font-label text-[8.5px] uppercase tracking-wider text-ink/70">
                1-Click Bag
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
