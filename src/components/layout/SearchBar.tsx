"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAllTags, searchProducts } from "@/lib/products";
import type { Product } from "@/types/product";
import { formatPrice } from "@/types/product";
import Image from "next/image";

interface SearchBarProps {
  open: boolean;
  onClose: () => void;
}

export function SearchBar({ open, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const allTags = getAllTags();

  // Auto-focus
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setTagSuggestions([]);
    }
  }, [open]);

  // Debounced search — 150ms
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTagSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const q = query.trim();

      // Tag autocomplete
      if (q.startsWith("#") || q.length >= 2) {
        const normalised = q.startsWith("#") ? q.slice(1) : q;
        const matchingTags = allTags.filter((t) =>
          t.toLowerCase().includes(normalised.toLowerCase())
        );
        setTagSuggestions(matchingTags.slice(0, 6));
      } else {
        setTagSuggestions([]);
      }

      // Product search
      const found = searchProducts(q);
      setResults(found.slice(0, 5));
    }, 150);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleTagClick = (tag: string) => {
    const name = tag.startsWith("#") ? tag.slice(1) : tag;
    onClose();
    router.push(`/tag/${name}`);
  };

  const hasResults = results.length > 0 || tagSuggestions.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Search panel */}
          <motion.div
            className="fixed top-0 left-0 right-0 z-[101] bg-paper shadow-[0_4px_20px_rgba(49,49,48,0.12)]"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="flex items-center gap-3">
                {/* Search icon */}
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-ink/40 flex-shrink-0" aria-hidden="true">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M13.5 13.5 L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>

                <input
                  ref={inputRef}
                  type="search"
                  placeholder="Search or try #handmade, #kerala…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 font-body text-base text-ink bg-transparent outline-none placeholder:text-ink/30"
                  aria-label="Search products"
                />

                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-surface rounded-[8px] transition-colors"
                  aria-label="Close search"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Results */}
              {hasResults && (
                <div className="mt-4 pb-4 border-t border-brand pt-4 space-y-4">
                  {/* Tag suggestions */}
                  {tagSuggestions.length > 0 && (
                    <div>
                      <p className="font-label text-[10px] text-ink/40 mb-2">Hashtags</p>
                      <div className="flex flex-wrap gap-2">
                        {tagSuggestions.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className="px-3 py-1 bg-surface hover:bg-mist rounded-full font-label text-[10px] text-ink transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product results */}
                  {results.length > 0 && (
                    <div>
                      <p className="font-label text-[10px] text-ink/40 mb-2">Products</p>
                      <div className="space-y-3">
                        {results.map((product) => (
                          <Link
                            key={product.id}
                            href={`/product/${product.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 group hover:bg-surface rounded-[12px] p-2 -mx-2 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-[8px] overflow-hidden flex-shrink-0 bg-surface">
                              {product.images[0] && (
                                <Image
                                  src={product.images[0].url}
                                  alt={product.images[0].alt}
                                  width={40}
                                  height={50}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-sm text-ink truncate group-hover:text-berry transition-colors">
                                {product.name}
                              </p>
                              <p className="font-label text-[10px] text-ink/50">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {query.trim() && !hasResults && (
                <p className="mt-4 text-center font-body text-sm text-ink/40 pb-4">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
