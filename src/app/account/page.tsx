"use client";

import Link from "next/link";
import { useLikesStore } from "@/stores/likes-store";
import { getPublicProducts } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";

export default function AccountPage() {
  const likedIds = useLikesStore((s) => s.likedIds);
  const allProducts = getPublicProducts();
  const likedProducts = allProducts.filter((p) => likedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-paper pb-24">
      <section className="bg-surface/50 border-b border-brand py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-paper border border-brand mx-auto flex items-center justify-center text-berry mb-4 shadow-soft">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="7" r="3.5" />
              <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-hand text-3xl sm:text-4xl text-ink">My Rastah Account</h1>
          <p className="font-body text-xs sm:text-sm text-ink/60 mt-1">
            Curated wishlist, orders, and delivery details.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Wishlist / Saved Items */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-brand">
            <div>
              <h2 className="font-hand text-2xl text-ink">Saved Objects (Wishlist)</h2>
              <p className="font-label text-[10px] text-ink/50 uppercase tracking-wider">
                {likedProducts.length} {likedProducts.length === 1 ? "Item" : "Items"} Saved
              </p>
            </div>
            <Link href="/shop" className="font-label text-[10px] text-berry hover:underline uppercase">
              Discover More →
            </Link>
          </div>

          {likedProducts.length === 0 ? (
            <div className="py-14 text-center bg-surface/50 rounded-[20px] border border-brand p-8">
              <p className="font-body text-sm text-ink/60">
                You haven&apos;t saved any craft objects yet.
              </p>
              <p className="font-body text-xs text-ink/40 mt-1">
                Tap the heart on any piece to curate your private wishlist.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-block px-5 py-2 rounded-[10px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {likedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
