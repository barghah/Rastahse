"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/types/product";
import { formatPrice, getStockStatus } from "@/types/product";
import { LikeButton } from "./LikeButton";
import { useCartStore } from "@/stores/cart-store";
import { useToastStore } from "@/stores/toast-store";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const defaultVariant = product.variants[0];
  const stockStatus = defaultVariant ? getStockStatus(defaultVariant) : "sold_out";
  const isSoldOut = stockStatus === "sold_out";
  const isLowStock = stockStatus === "low_stock";

  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.showToast);
  const [isAdded, setIsAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant || isSoldOut || isAdded) return;

    addItem(product, defaultVariant, 1);
    setIsAdded(true);
    showToast({
      title: "Added to Bag",
      description: `${product.name} (${defaultVariant.name})`,
      imageUrl: product.images[0]?.url,
    });

    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col"
    >
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-berry focus-visible:outline-offset-2 rounded-[16px]"
        aria-label={`View ${product.name}`}
      >
        {/* Image container */}
        <div className="relative aspect-product overflow-hidden rounded-[16px] bg-surface border-brand shadow-soft transition-all duration-500 ease-out group-hover:border-ink/20">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt}
              fill
              className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${
                isSoldOut ? "opacity-60" : ""
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-surface flex items-center justify-center">
              <span className="font-label text-[9px] text-ink/30">No image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {product.oneOfOne && (
              <span className="px-2.5 py-0.5 bg-berry text-paper font-label text-[9px] rounded-full shadow-xs">
                One of One
              </span>
            )}
            {isSoldOut && (
              <span className="px-2.5 py-0.5 bg-ink text-paper font-label text-[9px] rounded-full shadow-xs">
                Sold Out
              </span>
            )}
            {isLowStock && !isSoldOut && (
              <span className="px-2.5 py-0.5 bg-kraft text-ink font-label text-[9px] rounded-full shadow-xs">
                Only {defaultVariant?.stock} left
              </span>
            )}
          </div>

          {/* Like button */}
          <div className="absolute top-2.5 right-2.5 z-10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <LikeButton
              productId={product.id}
              size="sm"
              className="w-8 h-8 bg-paper/90 backdrop-blur-sm shadow-soft hover:bg-paper"
            />
          </div>

          {/* Quick Add Button overlay */}
          {!isSoldOut && defaultVariant && (
            <div className="absolute bottom-2.5 inset-x-2.5 z-10 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-200 ease-out">
              <motion.button
                onClick={handleQuickAdd}
                whileTap={{ scale: 0.98 }}
                disabled={isAdded}
                className={`w-full py-2 px-3 rounded-[10px] font-label text-[10px] flex items-center justify-center gap-1.5 backdrop-blur-md transition-colors duration-200 ${
                  isAdded
                    ? "bg-berry text-paper shadow-xs"
                    : "bg-paper/95 text-ink hover:bg-berry hover:text-paper shadow-soft"
                }`}
                aria-label={`Add ${product.name} to cart`}
              >
                <AnimatePresence mode="wait">
                  {isAdded ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="inline-flex items-center gap-1.5 font-medium"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 8.5l3.5 3.5L13 4" />
                      </svg>
                      Added to Bag
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="inline-flex items-center gap-1"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M8 3v10M3 8h10" />
                      </svg>
                      Add to Bag
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 px-0.5">
          {/* Category & Origin tag */}
          <div className="flex items-center gap-1.5 font-label text-[9px] text-ink/45 mb-1 truncate">
            <span className="capitalize">{product.categorySlug}</span>
            {product.origin && (
              <>
                <span>·</span>
                <span className="truncate">{product.origin}</span>
              </>
            )}
          </div>

          {/* Name */}
          <h3 className="font-body text-sm text-ink leading-snug line-clamp-2 group-hover:text-berry transition-colors font-medium">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="font-label text-[12px] text-ink font-medium">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && (
              <span className="font-label text-[10px] text-ink/30 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Hashtags (first 2) */}
          <div className="flex flex-wrap gap-1 mt-2">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="font-label text-[8px] text-ink/40 bg-surface px-1.5 py-0.5 rounded-[4px]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
