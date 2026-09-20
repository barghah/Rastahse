"use client";

import { useState } from "react";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";

export default function BrandLoaderShowcase() {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [btn1Loading, setBtn1Loading] = useState(false);
  const [btn2Loading, setBtn2Loading] = useState(false);
  const [btn3Loading, setBtn3Loading] = useState(false);
  const [customText, setCustomText] = useState("Walking the quiet path...");

  const triggerBtn1 = () => {
    setBtn1Loading(true);
    setTimeout(() => setBtn1Loading(false), 2400);
  };

  const triggerBtn2 = () => {
    setBtn2Loading(true);
    setTimeout(() => setBtn2Loading(false), 2400);
  };

  const triggerBtn3 = () => {
    setBtn3Loading(true);
    setTimeout(() => setBtn3Loading(false), 2400);
  };

  const triggerFullscreen = () => {
    setShowFullscreen(true);
    setTimeout(() => setShowFullscreen(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 md:py-16">
        {/* Header Intro */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="font-label text-xs uppercase tracking-[0.3em] text-berry font-medium">
            Brand Identity In Motion
          </span>
          <h1 className="font-hand text-3xl md:text-4xl text-ink mt-2">
            Rastahse Loading Animations
          </h1>
          <p className="font-body text-sm text-ink/70 mt-3 leading-relaxed">
            Every loading state is crafted around the brand cairn — the ancient trail marker of
            balanced river stones crowned with a wild berry. Meditative, quiet, and reflective of slow commerce.
          </p>
        </div>

        {/* Live Controls & Test Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Large / Page Transition */}
          <div className="bg-white/80 rounded-2xl p-6 border border-ink/8 shadow-xs flex flex-col items-center justify-between min-h-[340px] text-center relative overflow-hidden">
            <span className="self-start font-label text-[10px] uppercase tracking-widest text-ink/40">
              01 &middot; Page / Route Loader
            </span>

            <div className="my-auto py-4">
              <BrandLoader size="lg" text={customText} />
            </div>

            <button
              onClick={triggerFullscreen}
              className="w-full py-2.5 rounded-lg border border-ink/15 font-label text-[10px] uppercase tracking-widest hover:border-berry hover:text-berry transition-colors cursor-pointer"
            >
              Test Fullscreen (3s)
            </button>
          </div>

          {/* Card 2: Medium / Component Suspense */}
          <div className="bg-white/80 rounded-2xl p-6 border border-ink/8 shadow-xs flex flex-col items-center justify-between min-h-[340px] text-center">
            <span className="self-start font-label text-[10px] uppercase tracking-widest text-ink/40">
              02 &middot; Component / Drawer Loader
            </span>

            <div className="my-auto py-4">
              <BrandLoader size="md" text="Gathering handcrafted objects..." />
            </div>

            <div className="w-full text-center">
              <span className="font-label text-[10px] text-ink/40 uppercase tracking-wider">
                Used in Filters, Search & Cart Drawer
              </span>
            </div>
          </div>

          {/* Card 3: Micro / Button Interactions */}
          <div className="bg-white/80 rounded-2xl p-6 border border-ink/8 shadow-xs flex flex-col items-center justify-between min-h-[340px]">
            <span className="self-start font-label text-[10px] uppercase tracking-widest text-ink/40">
              03 &middot; Micro Button Loaders
            </span>

            <div className="flex flex-col gap-3 w-full my-auto max-w-[240px]">
              {/* Primary Berry Button */}
              <button
                onClick={triggerBtn1}
                disabled={btn1Loading}
                className="w-full py-3.5 px-4 rounded-xl bg-berry text-white font-label text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#580118] transition-all cursor-pointer shadow-xs disabled:opacity-90"
              >
                {btn1Loading ? (
                  <BrandLoader size="sm" text="Placing in Bag..." light={true} />
                ) : (
                  <span>Add to Bag</span>
                )}
              </button>

              {/* White Paper Button */}
              <button
                onClick={triggerBtn2}
                disabled={btn2Loading}
                className="w-full py-3.5 px-4 rounded-xl bg-white border border-ink/15 text-ink font-label text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-berry transition-all cursor-pointer shadow-xs disabled:opacity-90"
              >
                {btn2Loading ? (
                  <BrandLoader size="sm" text="Updating Bag..." light={false} />
                ) : (
                  <span>Update Quantity</span>
                )}
              </button>

              {/* Kraft Accent Button */}
              <button
                onClick={triggerBtn3}
                disabled={btn3Loading}
                className="w-full py-3.5 px-4 rounded-xl bg-kraft text-ink font-label text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-kraft-deep hover:text-white transition-all cursor-pointer shadow-xs disabled:opacity-90"
              >
                {btn3Loading ? (
                  <BrandLoader size="sm" text="Securing Order..." light={false} />
                ) : (
                  <span>Checkout Now</span>
                )}
              </button>
            </div>

            <span className="font-label text-[10px] text-ink/40 uppercase tracking-wider text-center">
              Click buttons to test micro-motion
            </span>
          </div>
        </div>

        {/* Custom Text Interactive Tester */}
        <div className="mt-8 bg-surface rounded-2xl p-6 border border-ink/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left w-full sm:w-auto">
            <h3 className="font-label text-xs uppercase tracking-widest text-ink">
              Custom Status Message
            </h3>
            <p className="font-body text-xs text-ink/60 mt-0.5">
              Preview how different artisanal messages look under the logo mark.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Preparing your package..."
              className="bg-white border border-ink/15 rounded-lg px-3 py-2 font-body text-xs text-ink focus:outline-none focus:border-berry w-full sm:w-64"
            />
            <button
              onClick={() => setCustomText("Walking the quiet path...")}
              className="px-3 py-2 rounded-lg bg-ink/5 hover:bg-ink/10 font-label text-[10px] uppercase tracking-wider text-ink/70 shrink-0"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Philosophy Note */}
        <div className="mt-12 text-center max-w-lg mx-auto border-t border-ink/8 pt-8">
          <p className="font-hand text-xl text-ink/70">
            &ldquo;A marker on the path reminds the traveler to pause, breathe, and trust the journey.&rdquo;
          </p>
          <span className="block font-label text-[9px] uppercase tracking-[0.25em] text-ink/40 mt-2">
            Afeedha Sherin & Salman Roshan &middot; Founders
          </span>
        </div>
      </main>

      {/* Fullscreen Overlay Preview */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-paper/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 cursor-pointer"
            onClick={() => setShowFullscreen(false)}
          >
            <BrandLoader size="fullscreen" text={customText} />
            <span className="font-label text-[10px] uppercase tracking-widest text-ink/30 mt-8">
              Click anywhere to dismiss preview
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
