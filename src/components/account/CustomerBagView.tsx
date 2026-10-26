"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/types/product";

export function CustomerBagView() {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCartStore();
  const subtotal = totalPrice();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center bg-surface/40 rounded-[20px] border border-brand/70 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-paper border border-brand flex items-center justify-center text-lg">
          👜
        </div>
        <h3 className="font-hand text-2xl text-ink">Your Bag is Empty</h3>
        <p className="font-body text-xs text-ink/50 max-w-sm mx-auto">
          Explore our collection of hand-printed shawls, traditional pottery, and artisan homeware.
        </p>
        <Link
          href="/shop"
          className="mt-2 inline-block px-6 py-2.5 rounded-[10px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider hover:bg-[#580118] transition-colors shadow-soft"
        >
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-brand">
        <div>
          <h2 className="font-hand text-2xl text-ink">My Bag & Stored Selection</h2>
          <p className="font-label text-[10px] text-ink/50 uppercase tracking-wider mt-0.5">
            {items.length} {items.length === 1 ? "piece" : "pieces"} awaiting acquisition
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="font-label text-[10px] uppercase tracking-wider text-ink/40 hover:text-red-700 cursor-pointer underline underline-offset-4"
        >
          Clear Bag
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-3">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="bg-paper p-4 rounded-[16px] border border-brand flex items-center gap-4 shadow-card"
            >
              <div className="w-16 h-16 rounded-[10px] bg-surface border border-brand/50 overflow-hidden shrink-0">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-ink/30">
                    🎨
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-body text-xs sm:text-sm font-semibold text-ink truncate">{item.name}</p>
                <p className="font-label text-[10px] text-ink/50 mt-0.5">{item.variantName}</p>
                <p className="font-label text-xs text-berry font-medium mt-1">
                  {formatPrice(item.price)}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center border border-brand rounded-[8px] bg-surface">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center text-ink/60 hover:text-ink text-xs cursor-pointer"
                >
                  −
                </button>
                <span className="w-7 text-center font-label text-xs text-ink">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-ink/60 hover:text-ink text-xs cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeItem(item.productId, item.variantId)}
                className="w-8 h-8 rounded-full hover:bg-surface text-ink/40 hover:text-red-700 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Quick Checkout Card */}
        <div className="lg:col-span-4">
          <div className="bg-paper p-5 rounded-[20px] border border-brand shadow-card space-y-4 sticky top-28">
            <h3 className="font-label text-[11px] uppercase tracking-wider text-ink font-semibold pb-2 border-b border-brand">
              Bag Summary
            </h3>

            <div className="space-y-2 text-xs font-body">
              <div className="flex justify-between text-ink/70">
                <span>Subtotal</span>
                <span className="font-label text-ink">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>Standard Express Shipping</span>
                <span className="font-label text-ink">
                  {subtotal > 200000 ? "FREE" : "₹150"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-brand flex justify-between items-center">
              <span className="font-label text-xs uppercase tracking-wider text-ink font-bold">Total</span>
              <span className="font-label text-base text-berry font-bold">
                {formatPrice(subtotal + (subtotal > 200000 ? 0 : 15000))}
              </span>
            </div>

            <Link href="/checkout" className="block pt-2">
              <button
                type="button"
                className="w-full py-3 rounded-[12px] bg-berry text-paper font-label text-[10px] uppercase tracking-widest hover:bg-[#580118] transition-colors shadow-soft cursor-pointer font-semibold"
              >
                Proceed to Checkout →
              </button>
            </Link>

            <p className="font-label text-[9px] uppercase tracking-wider text-ink/40 text-center">
              256-Bit Encrypted &middot; Insured Delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
