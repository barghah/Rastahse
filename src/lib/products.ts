/**
 * lib/products.ts
 * Single source of truth for product/category access.
 * Currently reads from content/products.json (Phase a–d).
 * Phase (f): switch to Supabase queries behind the same interface.
 */

import data from "@content/products.json";
import type { Product, Category } from "@/types/product";

const allProducts = data.products as Product[];
const allCategories = data.categories as Category[];

// ─── Categories ───────────────────────────────────────────────────────────────

export function getVisibleCategories(): Category[] {
  return allCategories
    .filter((c) => c.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAllCategories(): Category[] {
  return allCategories.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return allCategories.find((c) => c.slug === slug);
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function getPublicProducts(): Product[] {
  return allProducts.filter((p) => p.visible);
}

export function getCuratedProducts(): Product[] {
  return allProducts
    .filter((p) => p.visible && p.curated)
    .sort((a, b) => (a.curatedOrder ?? 99) - (b.curatedOrder ?? 99));
}

export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug && p.visible);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return allProducts.filter(
    (p) => p.visible && p.categorySlug === categorySlug
  );
}

export function getProductsByTag(tag: string): Product[] {
  const normalised = tag.startsWith("#") ? tag : `#${tag}`;
  return allProducts.filter(
    (p) => p.visible && p.tags.includes(normalised)
  );
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return allProducts.filter((p) => {
    if (!p.visible) return false;
    const inName = p.name.toLowerCase().includes(q);
    const inDesc = p.description.toLowerCase().includes(q);
    const inTags = p.tags.some((t) => t.toLowerCase().includes(q));
    return inName || inDesc || inTags;
  });
}

export function getTrendingTags(limit = 8): string[] {
  const tagCounts: Record<string, number> = {};
  for (const p of allProducts) {
    if (!p.visible) continue;
    for (const tag of p.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return allProducts
    .filter(
      (p) =>
        p.visible &&
        p.id !== product.id &&
        (p.categorySlug === product.categorySlug ||
          p.tags.some((t) => product.tags.includes(t)))
    )
    .slice(0, limit);
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  for (const p of allProducts) {
    if (!p.visible) continue;
    for (const tag of p.tags) tagSet.add(tag);
  }
  return Array.from(tagSet).sort();
}
