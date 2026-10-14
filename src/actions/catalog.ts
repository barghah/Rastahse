"use server";

import { searchProducts, getAllTags } from "@/lib/catalog";
import type { Product } from "@/types/product";

/** Public storefront search used by the header SearchBar. */
export async function searchCatalog(
  query: string
): Promise<{ products: Product[]; tags: string[] }> {
  const q = query.trim();
  if (!q) return { products: [], tags: [] };

  let tags: string[] = [];
  if (q.startsWith("#") || q.length >= 2) {
    const needle = (q.startsWith("#") ? q.slice(1) : q).toLowerCase();
    tags = (await getAllTags()).filter((t) => t.toLowerCase().includes(needle)).slice(0, 6);
  }

  const products = (await searchProducts(q)).slice(0, 5);
  return { products, tags };
}
