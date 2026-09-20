"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionDivider } from "@/components/brand/SectionDivider";
import { submitContactMessage } from "@/actions/contact";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await submitContactMessage(form);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Hero */}
      <section className="bg-surface/50 border-b border-brand py-14 sm:py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="font-label text-[10px] text-berry mb-3">Get in touch</p>
          <h1 className="font-hand text-4xl sm:text-5xl text-ink leading-tight">
            Say hello.
          </h1>
          <p className="font-body text-sm text-ink/60 mt-3 max-w-md mx-auto leading-relaxed">
            We&apos;re real people — Afeedha and Salman — and we read every
            message ourselves. Whether it&apos;s about a piece, a custom order,
            or just a kind word, we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 grid md:grid-cols-5 gap-12 md:gap-16">
        {/* Contact info */}
        <aside className="md:col-span-2 space-y-8">
          <div className="space-y-5">
            <ContactItem
              icon={
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 5l7 5 7-5M3 5h14v12H3V5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              label="Email us"
              value="hello@rastahse.com"
              href="mailto:hello@rastahse.com"
            />
            <ContactItem
              icon={
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 6.5C2 13.956 7.044 19 14.5 19l1.5-3.5-3-1.5-1 2c-2.5-.5-5-3-5.5-5.5l2-1L7 6.5 3.5 5.5 2 6.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              label="WhatsApp"
              value="+91 98765 43210"
              href="https://wa.me/919876543210"
            />
            <ContactItem
              icon={
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="10" cy="10" r="7" />
                  <path d="M10 6v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              label="Response time"
              value="Within 24–48 hours"
            />
          </div>

          <div className="p-5 rounded-[20px] bg-surface border border-brand">
            <p className="font-label text-[9px] text-berry mb-2">Custom Orders</p>
            <p className="font-body text-xs text-ink/70 leading-relaxed">
              Looking for a specific craft, bulk gifting, or a personalized piece?
              Let us know and we&apos;ll connect you directly with the artisan.
            </p>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4 pt-2">
            <a
              href="https://instagram.com/rastahse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full bg-surface border border-brand flex items-center justify-center text-ink/60 hover:text-berry hover:border-berry transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="https://twitter.com/rastahse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              className="w-10 h-10 rounded-full bg-surface border border-brand flex items-center justify-center text-ink/60 hover:text-berry hover:border-berry transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </aside>

        {/* Form */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {status === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-surface border border-brand flex items-center justify-center text-berry mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="font-hand text-3xl text-ink mb-2">Message received.</h2>
                <p className="font-body text-sm text-ink/60 max-w-sm leading-relaxed">
                  Thank you for reaching out. We&apos;ll get back to you within 24–48 hours.
                </p>
                <button
                  onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setStatus("idle"); }}
                  className="mt-6 font-label text-[10px] text-berry hover:underline"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    label="Your Name"
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    placeholder="Ravi Shankar"
                    required
                  />
                  <FormField
                    label="Email Address"
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    placeholder="ravi@example.com"
                    required
                  />
                </div>
                <FormField
                  label="Subject"
                  id="contact-subject"
                  type="text"
                  value={form.subject}
                  onChange={(v) => setForm((f) => ({ ...f, subject: v }))}
                  placeholder="Custom order, product query, collaboration..."
                />
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="font-label text-[9px] text-ink/60 block">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 rounded-[14px] bg-surface border border-brand font-body text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-berry transition-colors resize-none"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={status === "sending"}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 bg-berry text-paper font-label text-[10px] rounded-[14px] hover:bg-[#580118] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {status === "sending" ? (
                    <>
                      <span className="w-3.5 h-3.5 border border-paper/50 border-t-paper rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send Message"
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SectionDivider motif="path" className="py-8 max-w-2xl mx-auto" />
    </div>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-surface border border-brand flex items-center justify-center text-ink/50 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="font-label text-[9px] text-ink/40 mb-0.5">{label}</p>
        <p className="font-body text-sm text-ink">{value}</p>
      </div>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="block hover:opacity-80 transition-opacity">
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}

function FormField({
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="font-label text-[9px] text-ink/60 block">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-[14px] bg-surface border border-brand font-body text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-berry transition-colors"
      />
    </div>
  );
}
