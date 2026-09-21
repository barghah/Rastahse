"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/types/product";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    if (isOpen) {
      window.addEventListener("keydown", handler);
      // Trap focus — move focus into drawer
      setTimeout(() => drawerRef.current?.focus(), 50);
    }
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closeCart]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!mounted) return null;

  const total = totalPrice();
  const hasItems = items.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-[90] drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed right-0 top-0 bottom-0 z-[91] w-full max-w-sm bg-paper flex flex-col focus:outline-none shadow-[-4px_0_32px_rgba(49,49,48,0.1)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand">
              <h2 className="font-label text-[11px] text-ink">Your Cart</h2>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-surface rounded-[8px] transition-colors"
                aria-label="Close cart"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!hasItems ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 20 20" fill="none" className="text-ink/30" aria-hidden="true">
                      <path d="M2 2h2l2.5 9h9l1.5-6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="8.5" cy="16.5" r="1.5" fill="currentColor" />
                      <circle cx="14.5" cy="16.5" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-hand text-lg text-ink/60">Your cart is empty</p>
                    <p className="font-body text-sm text-ink/40 mt-1">Find something worth keeping.</p>
                  </div>
                  <Link href="/shop" onClick={closeCart}>
                    <Button variant="outline" size="sm" className="mt-2">Browse the shop</Button>
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4" aria-label="Cart items">
                  {items.map((item) => (
                    <li key={`${item.productId}-${item.variantId}`} className="flex gap-3 pb-4 border-b border-brand last:border-0">
                      {/* Image */}
                      <div className="w-16 h-20 rounded-[8px] overflow-hidden flex-shrink-0 bg-surface">
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={64}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="font-body text-sm text-ink hover:text-berry transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <p className="font-label text-[9px] text-ink/50 mt-0.5">{item.variantName}</p>
                        )}
                        <p className="font-label text-[11px] text-berry mt-1">{formatPrice(item.price)}</p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-brand hover:border-berry hover:text-berry transition-colors text-sm"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="font-label text-[11px] w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-brand hover:border-berry hover:text-berry transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>

                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="ml-auto p-1 text-ink/30 hover:text-berry transition-colors"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {hasItems && (
              <div className="px-5 py-4 border-t border-brand space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-label text-[10px] text-ink/60">Subtotal</span>
                  <span className="font-label text-sm text-ink">{formatPrice(total)}</span>
                </div>
                <p className="font-body text-xs text-ink/40">Shipping calculated at checkout</p>
                <Link href="/checkout" onClick={closeCart}>
                  <Button fullWidth size="lg">Proceed to Checkout</Button>
                </Link>
                <Link href="/cart" onClick={closeCart}>
                  <Button variant="ghost" fullWidth size="sm">View Full Cart</Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
