"use client";

import { useState, useMemo } from "react";
import { ProductOverrideForm } from "./ProductOverrideForm";
import type { Product } from "@/types/product";
import type { ProductOverride } from "@/actions/admin";

interface Props {
  allProducts: Product[];
  overrides: Record<string, ProductOverride>;
}

type FilterStatus = "all" | "active" | "hidden" | "out_of_stock" | "deleted";

const ITEMS_PER_PAGE = 12;

export function ProductCatalogManager({ allProducts, overrides }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  // Compute counts for status badges
  const counts = useMemo(() => {
    let active = 0;
    let hidden = 0;
    let outOfStock = 0;
    let deleted = 0;

    for (const p of allProducts) {
      const o = overrides[p.id];
      const isDel = Boolean(o?.is_deleted);
      const isHid = Boolean(o?.is_hidden);
      const baseInStock = p.variants && p.variants.length > 0 ? p.variants.some((v) => v.stock > 0) : true;
      const inStk = o?.in_stock !== undefined ? o.in_stock : baseInStock;

      if (isDel) {
        deleted++;
      } else {
        if (isHid) hidden++;
        if (!inStk) outOfStock++;
        if (!isHid && inStk) active++;
      }
    }

    return {
      all: allProducts.length,
      active,
      hidden,
      outOfStock,
      deleted,
    };
  }, [allProducts, overrides]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of allProducts) {
      if (p.categorySlug) set.add(p.categorySlug);
    }
    return Array.from(set).sort();
  }, [allProducts]);

  // Filter products based on search, status, and category
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const o = overrides[product.id];
      const isDel = Boolean(o?.is_deleted);
      const isHid = Boolean(o?.is_hidden);
      const baseInStock = product.variants && product.variants.length > 0 ? product.variants.some((v) => v.stock > 0) : true;
      const inStk = o?.in_stock !== undefined ? o.in_stock : baseInStock;

      // Status filter
      if (statusFilter === "active") {
        if (isDel || isHid || !inStk) return false;
      } else if (statusFilter === "hidden") {
        if (isDel || !isHid) return false;
      } else if (statusFilter === "out_of_stock") {
        if (isDel || inStk) return false;
      } else if (statusFilter === "deleted") {
        if (!isDel) return false;
      } else if (statusFilter === "all") {
        // By default on "all", hide deleted items unless explicitly on "deleted" tab
        if (isDel) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && product.categorySlug !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCategory = product.categorySlug?.toLowerCase().includes(q);
        const matchesTag = product.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCategory && !matchesTag) return false;
      }

      return true;
    });
  }, [allProducts, overrides, statusFilter, selectedCategory, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const displayedProducts = useMemo(() => {
    if (showAll) return filteredProducts;
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, safePage, showAll]);

  function handleStatusTabChange(tab: FilterStatus) {
    setStatusFilter(tab);
    setCurrentPage(1);
  }

  function handleCategoryChange(cat: string) {
    setSelectedCategory(cat);
    setCurrentPage(1);
  }

  function handleSearchChange(val: string) {
    setSearchQuery(val);
    setCurrentPage(1);
  }

  return (
    <div className="space-y-6">
      {/* ── Search and Filter Controls ── */}
      <div className="bg-paper p-5 rounded-[20px] border border-brand shadow-soft space-y-4">
        {/* Search bar & Category dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search products by title, category, or artisan tag…"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[12px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/35 transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 text-sm">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/40 hover:text-ink p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[12px] font-label text-[11.5px] uppercase tracking-wider text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper transition-all capitalize cursor-pointer font-medium"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-brand/60">
          <span className="font-label text-[10px] text-ink/45 uppercase tracking-wider mr-1 font-semibold">
            Status:
          </span>

          <button
            type="button"
            onClick={() => handleStatusTabChange("all")}
            className={`px-3 py-1.5 rounded-full font-label text-[10.5px] uppercase tracking-wider transition-all font-medium cursor-pointer ${
              statusFilter === "all"
                ? "bg-berry text-paper shadow-xs"
                : "bg-surface/70 text-ink/70 hover:text-ink border border-brand hover:border-ink/20"
            }`}
          >
            Catalog ({counts.all - counts.deleted})
          </button>

          <button
            type="button"
            onClick={() => handleStatusTabChange("active")}
            className={`px-3 py-1.5 rounded-full font-label text-[10.5px] uppercase tracking-wider transition-all font-medium cursor-pointer ${
              statusFilter === "active"
                ? "bg-emerald-700 text-paper shadow-xs"
                : "bg-surface/70 text-ink/70 hover:text-ink border border-brand hover:border-ink/20"
            }`}
          >
            ✓ Active ({counts.active})
          </button>

          <button
            type="button"
            onClick={() => handleStatusTabChange("hidden")}
            className={`px-3 py-1.5 rounded-full font-label text-[10.5px] uppercase tracking-wider transition-all font-medium cursor-pointer ${
              statusFilter === "hidden"
                ? "bg-amber-600 text-paper shadow-xs"
                : "bg-surface/70 text-ink/70 hover:text-ink border border-brand hover:border-ink/20"
            }`}
          >
            🙈 Hidden ({counts.hidden})
          </button>

          <button
            type="button"
            onClick={() => handleStatusTabChange("out_of_stock")}
            className={`px-3 py-1.5 rounded-full font-label text-[10.5px] uppercase tracking-wider transition-all font-medium cursor-pointer ${
              statusFilter === "out_of_stock"
                ? "bg-stone-700 text-paper shadow-xs"
                : "bg-surface/70 text-ink/70 hover:text-ink border border-brand hover:border-ink/20"
            }`}
          >
            Out of Stock ({counts.outOfStock})
          </button>

          <button
            type="button"
            onClick={() => handleStatusTabChange("deleted")}
            className={`px-3 py-1.5 rounded-full font-label text-[10.5px] uppercase tracking-wider transition-all font-medium cursor-pointer ${
              statusFilter === "deleted"
                ? "bg-red-700 text-paper shadow-xs"
                : "bg-surface/70 text-ink/70 hover:text-ink border border-brand hover:border-ink/20"
            }`}
          >
            🗑️ Archived ({counts.deleted})
          </button>

          {/* Quick Clear */}
          {(searchQuery || selectedCategory !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="ml-auto font-label text-[10px] text-berry hover:underline uppercase tracking-wider cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Product List Summary & View Mode ── */}
      <div className="flex items-center justify-between px-1">
        <p className="font-body text-xs text-ink/50">
          Showing <strong className="text-ink font-semibold">{filteredProducts.length}</strong>{" "}
          product{filteredProducts.length !== 1 ? "s" : ""}
          {!showAll && filteredProducts.length > ITEMS_PER_PAGE && (
            <span>
              {" "}
              (Page {safePage} of {totalPages})
            </span>
          )}
        </p>

        {filteredProducts.length > ITEMS_PER_PAGE && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="font-label text-[10px] text-berry hover:text-[#580118] uppercase tracking-wider font-semibold cursor-pointer"
          >
            {showAll ? `Show Paginated (${ITEMS_PER_PAGE}/page)` : `View All ${filteredProducts.length}`}
          </button>
        )}
      </div>

      {/* ── Products Cards ── */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-[18px] p-12 text-center bg-paper border border-brand shadow-soft">
          <p className="font-body text-sm text-ink/40">
            No products found matching the current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedProducts.map((product) => (
            <ProductOverrideForm
              key={product.id}
              product={product}
              override={overrides[product.id]}
            />
          ))}
        </div>
      )}

      {/* ── Pagination Controls ── */}
      {!showAll && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 pb-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-3 py-1.5 rounded-[10px] bg-paper border border-brand text-ink/70 font-label text-[10.5px] uppercase tracking-wider disabled:opacity-40 hover:border-berry transition-all cursor-pointer font-medium"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-8 h-8 rounded-[8px] font-label text-xs font-medium transition-all cursor-pointer ${
                  safePage === pg
                    ? "bg-berry text-paper shadow-xs"
                    : "bg-paper text-ink/60 border border-brand hover:border-ink/30"
                }`}
              >
                {pg}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-3 py-1.5 rounded-[10px] bg-paper border border-brand text-ink/70 font-label text-[10.5px] uppercase tracking-wider disabled:opacity-40 hover:border-berry transition-all cursor-pointer font-medium"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
