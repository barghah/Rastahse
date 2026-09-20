import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getCategoryBySlug, getProductsByCategory, getVisibleCategories } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionDivider, BackgroundMotif } from "@/components/brand/SectionDivider";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = getVisibleCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} — Curated Handcrafted Objects`,
    description: `Browse authentic handcrafted ${category.name.toLowerCase()} curated by Rastahse from regional master artisans across India.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products = getProductsByCategory(slug);
  const otherCategories = getVisibleCategories().filter((c) => c.slug !== slug);

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Category Hero Header */}
      <section className="bg-surface/70 border-b border-brand py-14 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-label text-[10px] text-ink/50">
            <Link href="/" className="hover:text-berry transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-berry transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-ink font-medium">{category.name}</span>
          </nav>

          {/* Category Icon */}
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] bg-paper border border-brand/80 flex items-center justify-center shadow-soft mb-6 p-4 relative"
            style={{ boxShadow: `0 8px 24px ${category.fruitColor}15` }}
          >
            {category.iconPath && (
              <Image
                src={category.iconPath}
                alt={category.name}
                width={72}
                height={72}
                className="w-14 h-14 object-contain"
                priority
              />
            )}
          </div>

          <h1 className="font-label text-2xl sm:text-3xl text-ink tracking-widest font-light uppercase">
            {category.name}
          </h1>

          <p className="font-body text-sm sm:text-base text-ink/70 mt-3 max-w-xl leading-relaxed">
            {category.slug === "apparel" && "Handwoven textiles, carryalls, bandanas, and heirloom pashminas carrying generational traditions."}
            {category.slug === "ceramic" && "Hand-thrown stoneware and Jaipur blue pottery shaped with minerals and patience."}
            {category.slug === "home-decor" && "Tribal rugs, brass mirrors, hand-bound journals, and ambient light pieces with a soul."}
            {category.slug === "jewelry" && "Ritual bronze collars, Konyak beadwork, and artisan silver shaped with timeless precision."}
          </p>

          <span className="font-label text-[10px] text-ink/40 mt-4">
            {products.length} {products.length === 1 ? "Object" : "Objects"} Found
          </span>
        </div>
      </section>

      {/* Products Grid with Ambient Craft Watermark */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 overflow-hidden">
        <BackgroundMotif
          motif={
            category.slug === "apparel"
              ? "river"
              : category.slug === "ceramic"
              ? "mountain"
              : category.slug === "home-decor"
              ? "path"
              : "waves"
          }
          position="top-right"
          opacity={0.035}
        />

        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-hand text-2xl text-ink/60">No objects currently listed in this category.</p>
            <Link
              href="/shop"
              className="inline-block mt-4 font-label text-[10px] text-berry underline underline-offset-4"
            >
              Browse all items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        )}
      </section>

      <SectionDivider className="my-2" />

      {/* Explore Other Categories */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="font-label text-[10px] uppercase tracking-widest text-center text-ink/50 mb-8">
          Explore Other Crafts
        </h2>
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {otherCategories.map((other) => (
            <Link
              key={other.slug}
              href={`/category/${other.slug}`}
              className="flex flex-col items-center gap-2 group p-3 rounded-[16px] hover:bg-surface transition-colors"
            >
              <div className="w-16 h-16 rounded-[16px] bg-paper border border-brand flex items-center justify-center group-hover:border-berry/30 transition-all p-2.5">
                {other.iconPath && (
                  <Image
                    src={other.iconPath}
                    alt={other.name}
                    width={48}
                    height={48}
                    className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
                  />
                )}
              </div>
              <span className="font-label text-[9px] text-ink/70 group-hover:text-berry text-center">
                {other.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
