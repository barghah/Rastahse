export type CategorySlug =
  | "bags"
  | "footwear"
  | "souvenirs"
  | "apparel"
  | "jewelry"
  | "ceramic"
  | "home-decor";

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Path to icon — PNG for brand originals, SVG component key for new ones */
  iconPath?: string;
  /** Key used to render the SVG icon component for new categories */
  iconComponent?: "BagsIcon" | "FootwearIcon" | "SouvenirsIcon";
  /** One of the 4 brand category fruit colours */
  fruitColor: string;
  visible: boolean;
  sortOrder: number;
}

export interface ProductImage {
  url: string;
  alt: string;
  blurDataUrl?: string;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  lowStockThreshold: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** "Why we picked this" story */
  story: string;
  curatorNote?: string;
  /** Price in paise (rupees × 100) */
  price: number;
  /** Compare-at price in paise (for strikethrough) */
  comparePrice?: number;
  categorySlug: CategorySlug;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  curated: boolean;
  curatedOrder?: number;
  visible: boolean;
  /** One-of-a-kind item flag */
  oneOfOne: boolean;
  origin?: string;
  createdAt: string;
  updatedAt?: string;
}

export type StockStatus = "in_stock" | "low_stock" | "sold_out";

export function getStockStatus(variant: ProductVariant): StockStatus {
  if (variant.stock <= 0) return "sold_out";
  if (variant.stock <= variant.lowStockThreshold) return "low_stock";
  return "in_stock";
}

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
