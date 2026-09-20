import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts, getPublicProducts } from "@/lib/products";
import { ProductDetailView } from "@/components/product/ProductDetailView";

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
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product, 4);

  return <ProductDetailView product={product} relatedProducts={related} />;
}
