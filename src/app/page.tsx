import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCuratedProducts, getVisibleCategories, getTrendingTags } from "@/lib/products";
import { heroSection, brandStory, site, trendingHashtags } from "@content/site";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionDivider, BackgroundMotif } from "@/components/brand/SectionDivider";
import { FadeUp } from "@/components/ui/index";
import { CategoryRow } from "@/components/brand/CategoryRow";

export const metadata: Metadata = {
  title: `${site.wordmark} — ${site.shortTagline}`,
  description: site.description,
};

export default function HomePage() {
  const curatedProducts = getCuratedProducts();
  const categories = getVisibleCategories();
  const trending = getTrendingTags(8);

  return (
    <>
      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90svh] flex flex-col items-center justify-center px-4 pt-10 pb-20 overflow-hidden bg-paper">
        {/* Background motif — very subtle */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-end overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/motifs/mountain.svg" alt="" className="w-full h-auto" aria-hidden="true" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          <FadeUp>
            <Image
              src="/brand/logos/logo-primary.png"
              alt="RASTAH से logo"
              width={280}
              height={280}
              priority
              className="w-48 sm:w-64 h-auto object-contain mb-8"
            />
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="font-hand text-4xl sm:text-5xl md:text-6xl text-ink leading-tight whitespace-pre-line">
              {heroSection.headline}
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="font-body text-base text-ink/60 mt-5 max-w-md leading-relaxed">
              {heroSection.subheadline}
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <Link
              href={heroSection.ctaHref}
              className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-berry text-paper rounded-[12px] font-label text-[11px] hover:bg-[#580118] active:scale-[0.98] transition-all duration-200"
            >
              {heroSection.cta}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </FadeUp>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30">
          <div className="w-px h-10 bg-ink" />
          <p className="font-label text-[8px] text-ink">Scroll</p>
        </div>
      </section>

      {/* ─── Category Row ────────────────────────────────────────────────────── */}
      <CategoryRow categories={categories} />

      {/* ─── Subtle Divider ─────────────────────────────────────────────────── */}
      <SectionDivider className="my-2" />

      {/* ─── Curated Picks with Ambient Brand River & Path Watermarks ────────── */}
      <section className="relative py-16 px-4 max-w-7xl mx-auto overflow-hidden" aria-labelledby="curated-heading">
        {/* Ambient Brand River & Path Motifs directly behind the products */}
        <BackgroundMotif motif="river" position="top-right" opacity={0.04} />
        <BackgroundMotif motif="path" position="bottom-left" opacity={0.035} />

        <FadeUp>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-label text-[10px] text-berry mb-2">Curated Picks</p>
              <h2 id="curated-heading" className="font-hand text-3xl sm:text-4xl text-ink">
                Things worth keeping.
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden sm:inline-flex font-label text-[10px] text-ink/50 hover:text-berry transition-colors items-center gap-1.5"
            >
              View all
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </FadeUp>

        <ProductGrid products={curatedProducts} />

        <div className="text-center mt-10 sm:hidden">
          <Link href="/shop" className="font-label text-[10px] text-ink/50 hover:text-berry transition-colors">
            View all products →
          </Link>
        </div>
      </section>

      {/* ─── Subtle Divider ─────────────────────────────────────────────────── */}
      <SectionDivider className="my-2" />

      {/* ─── Trending Hashtags ───────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-surface" aria-labelledby="trending-heading">
        <div className="max-w-3xl mx-auto text-center">
          <FadeUp>
            <h2 id="trending-heading" className="font-label text-[10px] text-ink/40 mb-6">
              Trending Right Now
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="flex flex-wrap justify-center gap-2">
              {(trending.length > 0 ? trending : trendingHashtags).map((tag) => {
                const name = tag.startsWith("#") ? tag.slice(1) : tag;
                return (
                  <Link
                    key={tag}
                    href={`/tag/${name}`}
                    className="px-4 py-2 bg-paper border-brand rounded-full font-label text-[10px] text-ink/60 hover:border-berry hover:text-berry hover:bg-surface transition-all duration-200"
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </Link>
                );
              })}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ─── Brand Story Strip ───────────────────────────────────────────────── */}
      <section className="py-20 px-4" aria-labelledby="brand-story-heading">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Motif image */}
            <FadeUp>
              <div className="relative">
                <div className="rounded-[20px] bg-surface p-8 flex items-center justify-center">
                  <Image
                    src="/brand/logos/logo-primary.png"
                    alt="Rastahse stone mark"
                    width={320}
                    height={400}
                    className="w-full h-auto object-contain opacity-85"
                  />
                </div>
                {/* Berry fruit accent */}
                <div className="absolute -top-4 -right-4 opacity-60">
                  <Image
                    src="/brand/motifs/fruit.png"
                    alt=""
                    width={48}
                    height={48}
                    className="object-contain"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </FadeUp>

            {/* Text */}
            <div className="space-y-6">
              <FadeUp delay={0.1}>
                <p className="font-label text-[10px] text-berry mb-3">Our Story</p>
                <h2 id="brand-story-heading" className="font-hand text-3xl sm:text-4xl text-ink leading-snug">
                  {brandStory.headline}
                </h2>
              </FadeUp>

              {brandStory.body.map((paragraph, i) => (
                <FadeUp key={i} delay={0.15 + i * 0.08}>
                  <p className="font-body text-sm text-ink/65 leading-relaxed">
                    {paragraph}
                  </p>
                </FadeUp>
              ))}

              <FadeUp delay={0.4}>
                <p className="font-label text-[9px] text-ink/30 pt-2">
                  {brandStory.motifCaption}
                </p>
              </FadeUp>

              <FadeUp delay={0.45}>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 font-label text-[10px] text-berry hover:gap-3 transition-all"
                >
                  Read the full story
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Subtle Divider ─────────────────────────────────────────────────── */}
      <SectionDivider className="my-2" />
    </>
  );
}
