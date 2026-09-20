import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductsByTag, getAllTags } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionDivider, BackgroundMotif } from "@/components/brand/SectionDivider";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({
    tag: tag.startsWith("#") ? tag.slice(1) : tag,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const display = `#${decodeURIComponent(tag)}`;
  return {
    title: `${display} — RASTAH से`,
    description: `Handcrafted objects tagged ${display} — curated by Rastahse.`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const tagWithHash = decoded.startsWith("#") ? decoded : `#${decoded}`;
  const products = getProductsByTag(tagWithHash);

  if (products.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-paper pb-24 relative overflow-hidden">
      <BackgroundMotif motif="mountain" position="top-right" opacity={0.03} />

      {/* Header */}
      <section className="bg-surface/50 border-b border-brand py-12 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center justify-center gap-2 font-label text-[10px] text-ink/50">
            <Link href="/" className="hover:text-berry transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-berry transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-ink">{tagWithHash}</span>
          </nav>
          <p className="font-label text-[9px] text-berry mb-2">Curated by tag</p>
          <h1 className="font-hand text-4xl sm:text-5xl text-ink">{tagWithHash}</h1>
          <p className="font-body text-sm text-ink/60 mt-2">
            {products.length} handcrafted {products.length === 1 ? "piece" : "pieces"}
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProductGrid products={products} />

        <div className="mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-label text-[10px] text-ink/50 hover:text-berry transition-colors"
          >
            ← View all crafts
          </Link>
        </div>
      </section>

      <SectionDivider className="my-2" />
    </div>
  );
}
