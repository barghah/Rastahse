"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useToastStore } from "@/stores/toast-store";
import { useCartStore } from "@/stores/cart-store";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const openCart = useCartStore((s) => s.openCart);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto bg-paper/95 backdrop-blur-md border border-brand rounded-[14px] p-3 shadow-[0_4px_20px_rgba(49,49,48,0.08)] flex items-center gap-3 text-ink"
          >
            {toast.imageUrl ? (
              <div className="w-12 h-12 rounded-[10px] overflow-hidden bg-surface flex-shrink-0 border border-brand/50">
                <Image
                  src={toast.imageUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-berry/10 text-berry flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 10l4 4L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-body text-xs font-medium text-ink leading-tight">
                {toast.title}
              </p>
              {toast.description && (
                <p className="font-label text-[10px] text-ink/50 mt-0.5 truncate">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                removeToast(toast.id);
                openCart();
              }}
              className="px-2.5 py-1.5 bg-surface hover:bg-berry hover:text-paper rounded-[8px] font-label text-[9px] text-ink transition-colors flex-shrink-0"
            >
              View Bag
            </button>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-ink/30 hover:text-ink transition-colors p-1"
              aria-label="Dismiss notification"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
