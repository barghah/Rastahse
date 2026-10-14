/**
 * lib/catalog.ts  (server-side only)
 * Database-backed catalogue. Reads `db_products` (+ `product_overrides`) from
 * Supabase and exposes the same query helpers as lib/products.ts, but async.
 * Falls back to content/products.json when Supabase is not configured,
 * unreachable, or the table has no rows yet — so the storefront never goes blank.
 */
import { cache } from "react";
import data from "@content/products.json";
import { createAdminClient } from "@/lib/supabase/server";
import type { Product, CategorySlug } from "@/types/product";

const jsonProducts = data.products as Product[];

interface DbRow {
  id: string;
  sku: string;
  title: string;
  slug: string;
  category: string;
  price: number;
  stock: number;
  description: string | null;
  tags: string[] | null;
  images: Array<{ url: string; alt?: string; width?: number; height?: number }> | null;
  is_visible: boolean;
  created_at: string | null;
  updated_at: string | null;
  story?: string | null;
  curator_note?: string | null;
  compare_price?: number | null;
  origin?: string | null;
  variants?: Array<{ id: string; name: string; sku?: string; lowStockThreshold?: number }> | null;
  curated?: boolean | null;
  curated_order?: number | null;
  one_of_one?: boolean | null;
}

interface OverrideRow {
  product_id: string;
  price_override: number | null;
  description_override: string | null;
  in_stock: boolean | null;
  is_hidden: boolean | null;
  is_deleted: boolean | null;
}

function mapRow(r: DbRow): Product {
  const stock = Number(r.stock) || 0;
  const variants =
    r.variants && r.variants.length > 0
      ? r.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          stock,
          lowStockThreshold: v.lowStockThreshold ?? 2,
        }))
      : [{ id: `${r.id}-variant`, name: "Standard", sku: r.sku, stock, lowStockThreshold: 2 }];

  return {
    id: r.id,
    slug: r.slug,
    name: r.title,
    description: r.description ?? "",
    story: r.story ?? "",
    curatorNote: r.curator_note ?? undefined,
    price: r.price,
    comparePrice: r.compare_price ?? undefined,
    categorySlug: (r.category as CategorySlug) || "bags",
    tags: r.tags ?? [],
    images: (r.images ?? []).map((img) => ({
      url: img.url,
      alt: img.alt || r.title,
      width: img.width,
      height: img.height,
    })),
    variants,
    curated: Boolean(r.curated),
    curatedOrder: r.curated_order ?? undefined,
    visible: r.is_visible,
    oneOfOne: Boolean(r.one_of_one),
    origin: r.origin ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? undefined,
  };
}

/**
 * Every product (hidden / archived included, no overrides applied) for the admin
 * panel, which applies and displays overrides itself. Falls back to the JSON
 * catalogue when the database has no products.
 */
export async function loadAdminProducts(): Promise<{ products: Product[]; fromDb: boolean }> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = await createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (admin.from("db_products") as any)
        .select("*")
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as DbRow[];
      if (!error && rows.length > 0) return { products: rows.map(mapRow), fromDb: true };
    } catch {
      // fall through to JSON
    }
  }
  return { products: jsonProducts.filter((p) => p.visible), fromDb: false };
}

/** All storefront-visible products, with admin overrides applied. */
export const loadProducts = cache(async (): Promise<Product[]> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonProducts.filter((p) => p.visible);
  }

  try {
    const admin = await createAdminClient();
    const [productsRes, overridesRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin.from("db_products") as any).select("*").order("created_at", { ascending: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin.from("product_overrides") as any).select("*"),
    ]);

    const rows = (productsRes.data ?? []) as DbRow[];
    if (productsRes.error || rows.length === 0) {
      return jsonProducts.filter((p) => p.visible);
    }

    const overrides = new Map<string, OverrideRow>(
      ((overridesRes.data ?? []) as OverrideRow[]).map((o) => [o.product_id, o])
    );

    return rows
      .map(mapRow)
      .filter((p) => p.visible)
      .flatMap((p) => {
        const o = overrides.get(p.id);
        if (!o) return [p];
        if (o.is_hidden || o.is_deleted) return [];
        const next = { ...p };
        if (o.price_override !== null && o.price_override !== undefined) {
          next.price = Number(o.price_override);
        }
        if (o.description_override) next.description = o.description_override;
        if (o.in_stock === false) {
          next.variants = next.variants.map((v) => ({ ...v, stock: 0 }));
        }
        return [next];
      });
  } catch {
    return jsonProducts.filter((p) => p.visible);
  }
});

export async function getPublicProducts(): Promise<Product[]> {
  return loadProducts();
}

export async function getCuratedProducts(): Promise<Product[]> {
  return (await loadProducts())
    .filter((p) => p.curated)
    .sort((a, b) => (a.curatedOrder ?? 99) - (b.curatedOrder ?? 99));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await loadProducts()).find((p) => p.slug === slug);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  return (await loadProducts()).filter((p) => p.categorySlug === categorySlug);
}

export async function getProductsByTag(tag: string): Promise<Product[]> {
  const normalised = tag.startsWith("#") ? tag : `#${tag}`;
  return (await loadProducts()).filter((p) => p.tags.includes(normalised));
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return (await loadProducts()).filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export async function getTrendingTags(limit = 8): Promise<string[]> {
  const counts: Record<string, number> = {};
  for (const p of await loadProducts()) {
    for (const tag of p.tags) counts[tag] = (counts[tag] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return (await loadProducts())
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.categorySlug === product.categorySlug ||
          p.tags.some((t) => product.tags.includes(t)))
    )
    .slice(0, limit);
}

export async function getAllTags(): Promise<string[]> {
  const set = new Set<string>();
  for (const p of await loadProducts()) for (const tag of p.tags) set.add(tag);
  return Array.from(set).sort();
}
