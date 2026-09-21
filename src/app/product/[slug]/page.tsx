import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts, getPublicProducts } from "@/lib/products";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = getPublicProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} — Handcrafted ${product.origin || "India"}`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const baseProduct = getProductBySlug(slug);
  if (!baseProduct) notFound();

  // Clone product so we don't mutate static JSON in memory
  const product = { ...baseProduct };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const { data: override } = await supabase
        .from("product_overrides")
        .select("*")
        .eq("product_id", product.id)
        .maybeSingle();

      if (override?.is_hidden || override?.is_deleted) {
        notFound();
      }
      if (override?.price_override !== null && override?.price_override !== undefined) {
        product.price = Number(override.price_override);
      }
      if (override?.description_override) {
        product.description = override.description_override;
      }
      if (override?.in_stock === false && product.variants?.length > 0) {
        product.variants = product.variants.map((v) => ({ ...v, stock: 0 }));
      }
    } catch {
      // In case of transient network error, proceed with base product
    }
  }

  const related = getRelatedProducts(product, 4);

  return <ProductDetailView product={product} relatedProducts={related} />;
}

