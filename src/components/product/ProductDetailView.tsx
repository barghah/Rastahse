"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Product, ProductVariant } from "@/types/product";
import { formatPrice, getStockStatus } from "@/types/product";
import { LikeButton } from "@/components/product/LikeButton";
import { ProductCard } from "@/components/product/ProductCard";
import { useCartStore } from "@/stores/cart-store";
import { useToastStore } from "@/stores/toast-store";
import { Button } from "@/components/ui/Button";
import { BrandLoader } from "@/components/ui/BrandLoader";

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const showToast = useToastStore((s) => s.showToast);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || { id: "default", name: "Standard", stock: 5, lowStockThreshold: 2 }
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"story" | "craft" | "shipping">("story");

  const stockStatus = getStockStatus(selectedVariant);
  const isSoldOut = stockStatus === "sold_out";
  const isLowStock = stockStatus === "low_stock";

  const handleAddToCart = () => {
    if (isSoldOut || isAdding) return;

    setIsAdding(true);
    setTimeout(() => {
      addItem(product, selectedVariant, quantity);
      setIsAdding(false);
      setJustAdded(true);
      showToast({
        title: "Added to Bag",
        description: `${product.name} (${selectedVariant.name}) × ${quantity}`,
        imageUrl: product.images[0]?.url,
      });

      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    }, 300);
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    addItem(product, selectedVariant, quantity);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-paper pb-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-[10px] text-ink/50">
          <Link href="/" className="hover:text-berry transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/category/${product.categorySlug}`} className="hover:text-berry transition-colors capitalize">
            {product.categorySlug}
          </Link>
          <span>/</span>
          <span className="text-ink truncate max-w-[200px] font-medium">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Left: Product Images */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-product sm:aspect-[4/3] lg:aspect-[1/1] w-full rounded-[24px] overflow-hidden bg-surface border border-brand shadow-soft group">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-label text-ink/30">
                  No Image
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.oneOfOne && (
                  <span className="px-3 py-1 bg-berry text-paper font-label text-[10px] rounded-full shadow-md">
                    One of One
                  </span>
                )}
                {product.origin && (
                  <span className="px-3 py-1 bg-paper/90 backdrop-blur-sm text-ink font-label text-[10px] rounded-full border border-brand shadow-sm flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-berry">
                      <path d="M6 1a3.5 3.5 0 0 0-3.5 3.5C2.5 7.5 6 11 6 11s3.5-3.5 3.5-6.5A3.5 3.5 0 0 0 6 1z" fill="currentColor" />
                      <circle cx="6" cy="4.5" r="1.2" fill="white" />
                    </svg>
                    {product.origin}
                  </span>
                )}
              </div>

              {/* Like Button */}
              <div className="absolute top-4 right-4 z-10">
                <LikeButton
                  productId={product.id}
                  size="md"
                  className="w-10 h-10 bg-paper/90 backdrop-blur-md shadow-soft"
                />
              </div>
            </div>
          </div>

          {/* Right: Product Info & Purchase Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Category */}
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href={`/category/${product.categorySlug}`}
                  className="font-label text-[10px] text-berry uppercase tracking-widest hover:underline"
                >
                  {product.categorySlug}
                </Link>
                {product.origin && (
                  <>
                    <span className="text-ink/30 text-xs">·</span>
                    <span className="font-label text-[10px] text-ink/60">{product.origin}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="font-hand text-3xl sm:text-4xl text-ink leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="font-label text-2xl text-ink font-medium">
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && (
                  <span className="font-label text-sm text-ink/40 line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
                <span className="font-label text-[9px] text-ink/50 bg-surface px-2 py-0.5 rounded-[6px]">
                  Taxes Included
                </span>
              </div>

              {/* Curator note quote if available */}
              {product.curatorNote && (
                <div className="mt-5 p-3.5 rounded-[12px] bg-surface/80 border-l-2 border-berry text-ink/80">
                  <p className="font-body text-xs italic leading-relaxed">
                    &ldquo;{product.curatorNote}&rdquo;
                  </p>
                  <p className="font-label text-[8px] text-ink/50 mt-1 uppercase tracking-wider">
                    — Curator&apos;s Note
                  </p>
                </div>
              )}

              {/* Variants Picker */}
              {product.variants.length > 1 && (
                <div className="mt-6">
                  <label className="font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-2">
                    Variant: <span className="text-ink font-medium">{selectedVariant.name}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <motion.button
                        key={v.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3.5 py-2 rounded-[10px] font-label text-[10px] border transition-all ${
                          selectedVariant.id === v.id
                            ? "border-berry bg-berry/5 text-berry font-medium shadow-xs"
                            : "border-brand bg-paper text-ink/80 hover:border-ink/30"
                        }`}
                      >
                        {v.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status Indicator */}
              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSoldOut ? "bg-red-500" : isLowStock ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                  }`}
                />
                <span className="font-label text-[10px] text-ink/70">
                  {isSoldOut
                    ? "Currently sold out"
                    : isLowStock
                    ? `Heirloom craft — Only ${selectedVariant.stock} available`
                    : "In stock, ready to dispatch"}
                </span>
              </div>

              {/* Quantity Selector & Add to Bag */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Quantity */}
                  <div className="flex items-center rounded-[12px] border border-brand bg-surface/50 p-1">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isSoldOut}
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center text-ink hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed text-base font-medium transition-colors"
                      aria-label="Decrease quantity"
                    >
                      −
                    </motion.button>
                    <span className="w-8 text-center font-label text-[12px] text-ink font-medium">
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                      disabled={quantity >= selectedVariant.stock || isSoldOut}
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center text-ink hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed text-base font-medium transition-colors"
                      aria-label="Increase quantity"
                    >
                      +
                    </motion.button>
                  </div>

                  {/* Add to Bag Button with Micro-Animation */}
                  <div className="flex-1">
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={isSoldOut || isAdding}
                      whileTap={isSoldOut ? undefined : { scale: 0.985 }}
                      className={`w-full h-11 px-6 rounded-[12px] font-label text-[11px] flex items-center justify-center gap-2 tracking-wider uppercase transition-colors duration-200 ${
                        isSoldOut
                          ? "bg-surface text-ink/40 cursor-not-allowed border border-brand"
                          : justAdded
                          ? "bg-berry text-paper shadow-soft"
                          : "bg-berry text-paper hover:bg-[#580118] shadow-soft"
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {justAdded ? (
                          <motion.span
                            key="added-state"
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -2 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="inline-flex items-center gap-1.5 font-medium"
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M3 8.5l3.5 3.5L13 4" />
                            </svg>
                            Added to Bag
                          </motion.span>
                        ) : isAdding ? (
                          <motion.span
                            key="adding-state"
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -2 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="inline-flex items-center gap-2"
                          >
                            <BrandLoader size="sm" text="Placing in Bag..." light={true} />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="normal-state"
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -2 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="inline-flex items-center gap-2"
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M2 2h2l2.5 9h9l1.5-6H6" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="8.5" cy="16.5" r="1.5" fill="currentColor" />
                              <circle cx="14.5" cy="16.5" r="1.5" fill="currentColor" />
                            </svg>
                            Add to Bag
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>

                {/* Buy Now Button */}
                {!isSoldOut && (
                  <motion.button
                    onClick={handleBuyNow}
                    whileTap={{ scale: 0.97 }}
                    className="w-full h-11 rounded-[12px] bg-surface text-ink hover:bg-mist/70 border border-brand font-label text-[11px] uppercase tracking-wider transition-colors"
                  >
                    Buy Now with 1-Click
                  </motion.button>
                )}
              </div>

              {/* Assurance points */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-brand font-label text-[9px] text-ink/60">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-berry">
                    <path d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>100% Artisan Handmade</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-berry">
                    <path d="M3 10h14M7 15l-4-5 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Dispatched via Air (3–5 days)</span>
                </div>
              </div>
            </div>

            {/* Accordion Tabs for Story, Craft & Shipping */}
            <div className="mt-8 border-t border-brand pt-6">
              <div className="flex gap-2 border-b border-brand pb-2">
                {(["story", "craft", "shipping"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`font-label text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-[8px] transition-colors ${
                      activeTab === tab
                        ? "bg-surface text-berry font-medium"
                        : "text-ink/50 hover:text-ink"
                    }`}
                  >
                    {tab === "story" ? "The Story" : tab === "craft" ? "Artisanship" : "Shipping & Care"}
                  </button>
                ))}
              </div>

              <div className="pt-4 font-body text-xs sm:text-sm text-ink/80 leading-relaxed min-h-[100px]">
                {activeTab === "story" && (
                  <div>
                    <p>{product.story || product.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {product.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/shop?tag=${encodeURIComponent(tag)}`}
                          className="font-label text-[9px] text-berry bg-surface px-2 py-0.5 rounded-[6px] hover:bg-berry hover:text-paper transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "craft" && (
                  <div className="space-y-2">
                    <p>
                      <strong>Origin:</strong> {product.origin || "India"}
                    </p>
                    <p>
                      <strong>Authenticity:</strong> Each item is crafted individually by generational artisans. Variations in weave, glaze, grain, and color are authentic signatures of the handmade process.
                    </p>
                    <p>
                      <strong>Fair Compensation:</strong> We purchase directly from independent master creators and self-help cooperatives.
                    </p>
                  </div>
                )}

                {activeTab === "shipping" && (
                  <div className="space-y-2">
                    <p>
                      <strong>Complimentary Packing:</strong> Wrapped in unbleached kraft paper and tied with natural jute string.
                    </p>
                    <p>
                      <strong>Delivery Time:</strong> Express air delivery across India within 3–5 business days. Real-time SMS and email tracking provided upon dispatch.
                    </p>
                    <p>
                      <strong>Returns:</strong> 7-day hassle-free replacement for transit damage.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-brand pt-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="font-label text-[10px] text-berry uppercase tracking-wider mb-1">
                  Craft Traditions
                </p>
                <h2 className="font-hand text-2xl sm:text-3xl text-ink">
                  More objects you may cherish.
                </h2>
              </div>
              <Link
                href={`/category/${product.categorySlug}`}
                className="font-label text-[10px] text-ink/60 hover:text-berry transition-colors flex items-center gap-1"
              >
                View all {product.categorySlug} →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
