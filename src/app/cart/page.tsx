"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/types/product";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const total = totalPrice();
  const freeShippingThreshold = 200000; // ₹2,000
  const progressToFree = Math.min(100, Math.round((total / freeShippingThreshold) * 100));

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Header */}
      <section className="bg-surface/50 border-b border-brand py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-hand text-3xl sm:text-4xl text-ink">Your Shopping Bag</h1>
          <p className="font-body text-xs sm:text-sm text-ink/60 mt-1">
            Objects crafted with time, selected for longevity.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {items.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface mx-auto flex items-center justify-center text-ink/30">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2h2l2.5 9h9l1.5-6H6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="16.5" r="1.5" fill="currentColor" />
                <circle cx="14.5" cy="16.5" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <h2 className="font-hand text-2xl text-ink/70">Your bag is currently empty</h2>
            <p className="font-body text-xs text-ink/40 max-w-sm mx-auto">
              Explore our collection of pottery, tribal jewellery, handwoven textiles, and Kashmiri pashminas.
            </p>
            <Link
              href="/shop"
              className="inline-block mt-4 px-6 py-2.5 rounded-[12px] bg-berry text-paper font-label text-[11px] uppercase tracking-wider hover:bg-[#580118] transition-colors"
            >
              Explore the Shop
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Free Shipping Bar */}
            <div className="p-4 rounded-[14px] bg-surface border border-brand text-xs font-body text-ink">
              {total >= freeShippingThreshold ? (
                <p className="text-emerald-800 font-medium flex items-center gap-2">
                  <span>✓</span> You have unlocked complimentary express shipping & gift packaging across India!
                </p>
              ) : (
                <div>
                  <p className="text-ink/80">
                    Add <span className="font-medium text-berry">{formatPrice(freeShippingThreshold - total)}</span> more to qualify for complimentary express air shipping.
                  </p>
                  <div className="w-full h-1.5 bg-paper rounded-full mt-2 overflow-hidden border border-brand/40">
                    <div
                      className="h-full bg-berry rounded-full transition-all duration-500"
                      style={{ width: `${progressToFree}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="divide-y divide-brand border-y border-brand">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="py-6 flex gap-4 sm:gap-6 items-center">
                  <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-[12px] bg-surface overflow-hidden flex-shrink-0 border border-brand/60">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={96}
                        height={112}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-body text-sm sm:text-base text-ink hover:text-berry transition-colors font-medium line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="font-label text-[10px] text-ink/50 mt-0.5">{item.variantName}</p>
                    <p className="font-label text-xs sm:text-sm text-berry mt-1 font-semibold">
                      {formatPrice(item.price)}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center rounded-[8px] border border-brand bg-surface">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-ink hover:bg-mist/50 transition-colors text-sm"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-label text-[11px] text-ink">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="w-7 h-7 flex items-center justify-center text-ink hover:bg-mist/50 transition-colors text-sm disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="font-label text-[10px] text-ink/40 hover:text-berry transition-colors underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-label text-sm sm:text-base text-ink font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Checkout */}
            <div className="p-6 rounded-[20px] bg-surface border border-brand space-y-4">
              <div className="flex justify-between font-label text-sm text-ink">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between font-label text-xs text-ink/60">
                <span>Shipping</span>
                <span>{total >= freeShippingThreshold ? "Complimentary" : "Calculated at checkout"}</span>
              </div>
              <div className="pt-3 border-t border-brand flex justify-between font-label text-base text-ink font-semibold">
                <span>Estimated Total</span>
                <span className="text-berry">{formatPrice(total)}</span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link href="/shop" className="flex-1">
                  <button className="w-full py-3.5 rounded-[12px] bg-paper text-ink font-label text-[11px] uppercase tracking-wider hover:bg-mist/60 border border-brand transition-colors">
                    Continue Shopping
                  </button>
                </Link>
                <Link href="/checkout" className="flex-1">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 rounded-[12px] bg-berry text-paper font-label text-[11px] uppercase tracking-wider hover:bg-[#580118] transition-colors shadow-soft"
                  >
                    Proceed to Checkout
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
