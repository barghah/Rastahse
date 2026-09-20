"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function NotFoundContent() {
  return (
    <div className="min-h-[80svh] bg-paper flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full text-center">
        {/* Brand cairn mark — faint watermark */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex justify-center mb-8"
        >
          <div className="relative w-24 h-24">
            <Image
              src="/brand/logos/logo-primary.png"
              alt="RASTAH से"
              fill
              sizes="96px"
              className="object-contain opacity-20"
            />
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="font-label text-[9px] text-berry mb-3"
        >
          Path not found
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-hand text-7xl sm:text-8xl text-ink mb-4"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="font-body text-sm text-ink/60 leading-relaxed max-w-sm mx-auto mb-10"
        >
          The trail ends here. This page may have moved or never existed.
          Let&apos;s find your way back.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/"
            className="px-7 py-3 bg-berry text-paper font-label text-[10px] rounded-[12px] hover:bg-[#580118] transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="px-7 py-3 bg-surface border border-brand text-ink font-label text-[10px] rounded-[12px] hover:border-berry hover:text-berry transition-all"
          >
            Browse the Collection
          </Link>
        </motion.div>

        {/* Ambient path motif */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.04 }}
          transition={{ delay: 0.6 }}
          className="mt-16 pointer-events-none select-none"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/motifs/path.svg" alt="" className="w-40 h-auto mx-auto" />
        </motion.div>
      </div>
    </div>
  );
}
