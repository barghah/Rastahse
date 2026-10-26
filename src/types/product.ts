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
  sku: string;
  stock: number; // Available stock (total - withheld)
  totalStock?: number;
  withheldStock?: number;
  availableStock?: number;
  priceDelta?: number;
  lowStockThreshold: number;
  weightGrams?: number | null;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  origin?: string;
  artisanName?: string;
  description: string;
  /** "Why we picked this" story */
  story: string;
  curatorNote?: string;
  /** Price in paise (rupees × 100) */
  price: number;
  /** Compare-at price in paise (for strikethrough) */
  comparePrice?: number | null;
  costPrice?: number | null;
  gstRate?: number;
  hsnCode?: string | null;
  barcode?: string | null;
  weightGrams?: number | null;
  lengthCm?: number | null;
  breadthCm?: number | null;
  heightCm?: number | null;
  categorySlug: CategorySlug | string;
  categoryId?: string | null;
  tags: string[];
  status?: "draft" | "active" | "archived";
  images: ProductImage[];
  variants: ProductVariant[];
  curated: boolean;
  curatedOrder?: number;
  visible: boolean;
  /** One-of-a-kind item flag */
  oneOfOne: boolean;
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
