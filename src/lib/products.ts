/**
 * lib/products.ts
 * Single source of truth for product and category data.
 * Fully backed by Supabase PostgreSQL with cached ISR queries and tag-based revalidation.
 * Falls back safely to content/products.json if Supabase is offline.
 */

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { Product, Category, CategorySlug, ProductImage, ProductVariant } from "@/types/product";
import fallbackData from "@content/products.json";

const fallbackProducts = fallbackData.products as Product[];
const fallbackCategories = fallbackData.categories as Category[];

// ─── Data Mappers ─────────────────────────────────────────────────────────────

interface DbVariant {
  id: string;
  sku: string;
  variant_name: string;
  price_delta: number;
  total_stock: number;
  withheld_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  weight_grams?: number | null;
}

interface DbImage {
  id: string;
  url: string;
  alt_text?: string | null;
  width?: number | null;
  height?: number | null;
  sort_order?: number | null;
  is_primary?: boolean | null;
}

interface DbCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon_path?: string | null;
  fruit_color?: string | null;
  sort_order?: number | null;
  is_visible?: boolean | null;
}

interface DbProductRow {
  id: string;
  sku: string;
  slug: string;
  name: string;
  origin?: string | null;
  artisan_name?: string | null;
  description?: string | null;
  story?: string | null;
  curator_note?: string | null;
  category_id?: string | null;
  base_price: number;
  compare_price?: number | null;
  cost_price?: number | null;
  gst_rate?: number | null;
  hsn_code?: string | null;
  barcode?: string | null;
  weight_grams?: number | null;
  length_cm?: number | null;
  breadth_cm?: number | null;
  height_cm?: number | null;
  tags?: string[] | null;
  status: "draft" | "active" | "archived";
  is_curated?: boolean | null;
  curated_order?: number | null;
  is_one_of_one?: boolean | null;
  is_hidden?: boolean | null;
  is_deleted?: boolean | null;
  created_at: string;
  updated_at?: string | null;
  categories?: DbCategory | null;
  product_variants?: DbVariant[] | null;
  product_images?: DbImage[] | null;
}

export function mapDbCategory(c: DbCategory): Category {
  return {
    slug: c.slug as CategorySlug,
    name: c.name,
    iconPath: c.icon_path ?? undefined,
    fruitColor: c.fruit_color ?? "#6c0222",
    visible: Boolean(c.is_visible),
    sortOrder: c.sort_order ?? 0,
  };
}

export function mapDbProduct(row: DbProductRow): Product {
  const images: ProductImage[] = (row.product_images || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => ({
      url: img.url,
      alt: img.alt_text || row.name,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
    }));

  const variants: ProductVariant[] = (row.product_variants || []).map((v) => ({
    id: v.id,
    name: v.variant_name,
    sku: v.sku,
    stock: v.available_stock, // Storefront operates strictly on available_stock
    totalStock: v.total_stock,
    withheldStock: v.withheld_stock,
    availableStock: v.available_stock,
    priceDelta: v.price_delta,
    lowStockThreshold: v.low_stock_threshold,
    weightGrams: v.weight_grams,
  }));

  const categorySlug = (row.categories?.slug as CategorySlug) || "apparel";

  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    origin: row.origin ?? undefined,
    artisanName: row.artisan_name ?? undefined,
    description: row.description ?? "",
    story: row.story ?? "",
    curatorNote: row.curator_note ?? undefined,
    price: Number(row.base_price),
    comparePrice: row.compare_price ? Number(row.compare_price) : undefined,
    costPrice: row.cost_price ? Number(row.cost_price) : undefined,
    gstRate: row.gst_rate ? Number(row.gst_rate) : 0,
    hsnCode: row.hsn_code ?? undefined,
    barcode: row.barcode ?? undefined,
    weightGrams: row.weight_grams ?? undefined,
    lengthCm: row.length_cm ? Number(row.length_cm) : undefined,
    breadthCm: row.breadth_cm ? Number(row.breadth_cm) : undefined,
    heightCm: row.height_cm ? Number(row.height_cm) : undefined,
    categorySlug,
    categoryId: row.category_id ?? undefined,
    tags: row.tags ?? [],
    status: row.status,
    images: images.length > 0 ? images : [{ url: "/brand/placeholders/product.svg", alt: row.name }],
    variants: variants.length > 0 ? variants : [{
      id: `${row.id}-default`,
      name: "Standard",
      sku: row.sku,
      stock: 0,
      lowStockThreshold: 2,
    }],
    curated: Boolean(row.is_curated),
    curatedOrder: row.curated_order ?? undefined,
    visible: row.status === "active" && !row.is_hidden && !row.is_deleted,
    oneOfOne: Boolean(row.is_one_of_one),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

// ─── Cached Database Fetchers ─────────────────────────────────────────────────

async function fetchCategoriesFromDb(): Promise<Category[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fallbackCategories;
  }

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return fallbackCategories;
    }

    return (data as DbCategory[]).map(mapDbCategory);
  } catch (err) {
    console.error("[lib/products] fetchCategoriesFromDb error:", err);
    return fallbackCategories;
  }
}

async function fetchProductsFromDb(): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fallbackProducts;
  }

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories ( id, slug, name, icon_path, fruit_color, sort_order, is_visible ),
        product_variants ( id, sku, variant_name, price_delta, total_stock, withheld_stock, available_stock, low_stock_threshold, weight_grams ),
        product_images ( id, url, alt_text, width, height, sort_order, is_primary )
      `)
      .eq("status", "active")
      .eq("is_hidden", false)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return fallbackProducts;
    }

    return (data as unknown as DbProductRow[]).map(mapDbProduct);
  } catch (err) {
    console.error("[lib/products] fetchProductsFromDb error:", err);
    return fallbackProducts;
  }
}

// Next.js Tag-based cached getters
export const getCachedCategories = unstable_cache(
  fetchCategoriesFromDb,
  ["all-categories-cache"],
  { revalidate: 60, tags: ["categories"] }
);

export const getCachedProducts = unstable_cache(
  fetchProductsFromDb,
  ["public-products-cache"],
  { revalidate: 60, tags: ["products"] }
);

// ─── Public Categories Access API ─────────────────────────────────────────────

export async function getVisibleCategories(): Promise<Category[]> {
  const cats = await getCachedCategories();
  return cats.filter((c) => c.visible).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getAllCategories(): Promise<Category[]> {
  const cats = await getCachedCategories();
  return cats.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const cats = await getCachedCategories();
  return cats.find((c) => c.slug === slug);
}

// ─── Public Products Access API ───────────────────────────────────────────────

export async function getPublicProducts(): Promise<Product[]> {
  const prods = await getCachedProducts();
  return prods.filter((p) => p.visible);
}

export async function getCuratedProducts(): Promise<Product[]> {
  const prods = await getCachedProducts();
  return prods
    .filter((p) => p.visible && p.curated)
    .sort((a, b) => (a.curatedOrder ?? 99) - (b.curatedOrder ?? 99));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const prods = await getCachedProducts();
  return prods.find((p) => p.slug === slug && p.visible);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const prods = await getCachedProducts();
  return prods.filter((p) => p.visible && p.categorySlug === categorySlug);
}

export async function getProductsByTag(tag: string): Promise<Product[]> {
  const normalised = tag.startsWith("#") ? tag : `#${tag}`;
  const prods = await getCachedProducts();
  return prods.filter((p) => p.visible && p.tags.includes(normalised));
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const prods = await getCachedProducts();
  return prods.filter((p) => {
    if (!p.visible) return false;
    const inSku = p.sku.toLowerCase().includes(q);
    const inName = p.name.toLowerCase().includes(q);
    const inDesc = p.description.toLowerCase().includes(q);
    const inTags = p.tags.some((t) => t.toLowerCase().includes(q));
    return inSku || inName || inDesc || inTags;
  });
}

export async function getTrendingTags(limit = 8): Promise<string[]> {
  const prods = await getCachedProducts();
  const tagCounts: Record<string, number> = {};
  for (const p of prods) {
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

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const prods = await getCachedProducts();
  return prods
    .filter(
      (p) =>
        p.visible &&
        p.id !== product.id &&
        (p.categorySlug === product.categorySlug ||
          p.tags.some((t) => product.tags.includes(t)))
    )
    .slice(0, limit);
}

export async function getAllTags(): Promise<string[]> {
  const prods = await getCachedProducts();
  const tagSet = new Set<string>();
  for (const p of prods) {
    if (!p.visible) continue;
    for (const tag of p.tags) tagSet.add(tag);
  }
  return Array.from(tagSet).sort();
}

// ─── Admin Full Catalogue Loader ──────────────────────────────────────────────

/**
 * Loads ALL products including drafts, hidden, and archived for the admin panel.
 */
export async function loadAdminProducts(): Promise<{ products: Product[]; fromDb: boolean }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { products: fallbackProducts, fromDb: false };
  }

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories ( id, slug, name, icon_path, fruit_color, sort_order, is_visible ),
        product_variants ( id, sku, variant_name, price_delta, total_stock, withheld_stock, available_stock, low_stock_threshold, weight_grams ),
        product_images ( id, url, alt_text, width, height, sort_order, is_primary )
      `)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return { products: fallbackProducts, fromDb: false };
    }

    return {
      products: (data as unknown as DbProductRow[]).map(mapDbProduct),
      fromDb: true,
    };
  } catch (err) {
    console.error("[lib/products] loadAdminProducts error:", err);
    return { products: fallbackProducts, fromDb: false };
  }
}
