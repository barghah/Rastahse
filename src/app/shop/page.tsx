"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getPublicProducts, getVisibleCategories, getAllTags } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { BackgroundMotif } from "@/components/brand/SectionDivider";
import type { CategorySlug } from "@/types/product";

export default function ShopPage() {
  const allProducts = useMemo(() => getPublicProducts(), []);
  const categories = useMemo(() => getVisibleCategories(), []);
  const allTags = useMemo(() => getAllTags().slice(0, 12), []);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">("featured");

  // Filter products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== "all" && product.categorySlug !== selectedCategory) {
        return false;
      }
      // Tag filter
      if (selectedTag && !product.tags.includes(selectedTag)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        const matchesOrigin = product.origin?.toLowerCase().includes(q) ?? false;
        const matchesTag = product.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesOrigin && !matchesTag) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (a.curatedOrder ?? 99) - (b.curatedOrder ?? 99);
    });
  }, [allProducts, selectedCategory, selectedTag, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-paper pb-24 relative overflow-hidden">
      {/* Ambient Brand Motifs behind the product catalog */}
      <BackgroundMotif motif="river" position="top-right" opacity={0.035} />
      <BackgroundMotif motif="path" position="bottom-left" opacity={0.03} />

      {/* Header */}
      <section className="bg-surface/50 border-b border-brand py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center justify-center gap-2 font-label text-[10px] text-ink/50">
            <Link href="/" className="hover:text-berry transition-colors">Home</Link>
            <span>/</span>
            <span className="text-ink font-medium">Shop</span>
          </nav>
          <h1 className="font-hand text-4xl sm:text-5xl text-ink">
            The Full Collection
          </h1>
          <p className="font-body text-sm text-ink/70 mt-2 max-w-lg mx-auto">
            Fifty-one handmade objects from master artisans across Kashmir, Nagaland, Rajasthan, Kerala, and beyond.
          </p>
        </div>
      </section>

      {/* Filter and Controls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none sm:justify-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full font-label text-[10px] uppercase tracking-wider flex-shrink-0 transition-all ${
              selectedCategory === "all"
                ? "bg-berry text-paper shadow-soft"
                : "bg-surface text-ink/70 hover:bg-mist/70 border border-brand"
            }`}
          >
            All Crafts ({allProducts.length})
          </motion.button>

          {categories.map((cat) => (
            <motion.button
              key={cat.slug}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-1.5 rounded-full font-label text-[10px] uppercase tracking-wider flex items-center gap-2 flex-shrink-0 transition-all ${
                selectedCategory === cat.slug
                  ? "bg-berry text-paper shadow-soft"
                  : "bg-surface text-ink/70 hover:bg-mist/70 border border-brand"
              }`}
            >
              {cat.iconPath && (
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src={cat.iconPath}
                    alt=""
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <span>{cat.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Search, Tag chips, and Sort Bar */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-y border-brand">
          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search craft, region, material..."
              className="w-full pl-9 pr-4 py-2 rounded-[12px] bg-surface border border-brand text-xs font-body text-ink placeholder:text-ink/40 focus:outline-none focus:border-berry transition-colors"
            />
            <svg
              className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 20 20"
            >
              <circle cx="9" cy="9" r="6" strokeWidth="1.5" />
              <path d="M13.5 13.5L17 17" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink/40 hover:text-ink p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Popular Tag Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-[8px] font-label text-[9px] flex-shrink-0 transition-colors ${
                  selectedTag === tag
                    ? "bg-ink text-paper"
                    : "bg-surface text-ink/60 hover:bg-mist/70"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <span className="font-label text-[10px] text-ink/50 uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surface border border-brand rounded-[10px] px-3 py-1.5 font-label text-[10px] text-ink focus:outline-none focus:border-berry"
            >
              <option value="featured">Curated & Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Additions</option>
            </select>
          </div>
        </div>

        {/* Results Counter and Active Filter indicators */}
        <div className="mt-4 flex items-center justify-between font-label text-[10px] text-ink/50">
          <span>Showing {filteredProducts.length} handcrafted pieces</span>
          {(selectedCategory !== "all" || selectedTag || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedTag(null);
                setSearchQuery("");
              }}
              className="text-berry hover:underline flex items-center gap-1"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Product Grid */}
        <div className="mt-8">
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-surface mx-auto flex items-center justify-center text-ink/30 mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <p className="font-hand text-2xl text-ink/60">No objects match your selection</p>
              <p className="font-body text-xs text-ink/40 mt-1">Try another craft category or clearing search terms.</p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedTag(null);
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 bg-berry text-paper font-label text-[10px] rounded-[10px] uppercase tracking-wider"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {filteredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 8} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
