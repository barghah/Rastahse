"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { sendOtp, verifyOtp } from "@/actions/auth";

/**
 * PhoneLoginPage — Two-step phone + OTP login for Rastahse customers.
 *
 * Step 1: Enter mobile number (auto-prefixed +91)
 * Step 2: Enter 6-digit OTP received by SMS
 * On success: redirect to /account
 */
export default function PhoneLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formattedPhone = `+91${phone.replace(/\D/g, "").slice(0, 10)}`;

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    startTransition(async () => {
      const result = await sendOtp(formattedPhone);
      if (result.error) {
        setError(result.error);
      } else {
        setStep("otp");
      }
    });
  }

  function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    startTransition(async () => {
      const result = await verifyOtp(formattedPhone, otp);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/account");
        router.refresh();
      }
    });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ backgroundColor: "#faf8f5" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image
            src="/brand/logos/logo-primary.png"
            alt="RASTAH से"
            width={100}
            height={100}
            className="h-20 w-auto object-contain"
            priority
          />
        </div>

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone-step"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-hand text-3xl text-ink text-center mb-1">
                Sign in
              </h1>
              <p className="font-body text-xs text-ink/50 text-center mb-8">
                Enter your mobile number to receive an OTP
              </p>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="flex items-center border border-ink/15 rounded-[12px] overflow-hidden bg-paper focus-within:border-berry transition-colors">
                  <span className="px-3 py-3.5 font-label text-sm text-ink/50 border-r border-ink/10 bg-surface/50 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="flex-1 px-3 py-3.5 font-body text-sm text-ink bg-transparent outline-none placeholder:text-ink/30"
                    autoFocus
                    autoComplete="tel-national"
                    required
                  />
                </div>

                {error && (
                  <p className="font-body text-xs text-red-600 text-center">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending || phone.length < 10}
                  className="w-full py-3.5 bg-berry text-paper font-label text-[11px] uppercase tracking-widest rounded-[12px] hover:bg-[#580118] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                >
                  {isPending ? "Sending OTP…" : "Send OTP"}
                </button>
              </form>

              <p className="font-body text-[11px] text-ink/40 text-center mt-6 leading-relaxed">
                We&apos;ll send a one-time password via SMS.
                <br />
                No account needed — just your number.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-hand text-3xl text-ink text-center mb-1">
                Enter OTP
              </h1>
              <p className="font-body text-xs text-ink/50 text-center mb-8">
                Sent to <strong className="text-ink/70">+91 {phone}</strong>
              </p>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full px-4 py-3.5 border border-ink/15 rounded-[12px] font-label text-xl text-ink text-center tracking-[0.5em] bg-paper outline-none focus:border-berry transition-colors"
                  autoFocus
                  autoComplete="one-time-code"
                  required
                />

                {error && (
                  <p className="font-body text-xs text-red-600 text-center">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending || otp.length !== 6}
                  className="w-full py-3.5 bg-berry text-paper font-label text-[11px] uppercase tracking-widest rounded-[12px] hover:bg-[#580118] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                >
                  {isPending ? "Verifying…" : "Verify & Sign In"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError(null);
                  }}
                  className="w-full text-center font-label text-[10px] text-ink/40 hover:text-berry transition-colors uppercase tracking-wider pt-1"
                >
                  ← Change number
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
