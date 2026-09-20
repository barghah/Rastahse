import Image from "next/image";
import Link from "next/link";
import { SectionDivider } from "@/components/brand/SectionDivider";

export const metadata = {
  title: "Our Story — RASTAH से",
  description: "The journey of Rastahse by Afeedha Sherin and Salman Roshan — curating meaningful handmade objects across India's traditional craft trails.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Hero */}
      <section className="relative py-16 sm:py-24 px-4 bg-surface/60 border-b border-brand text-center">
        <div className="max-w-3xl mx-auto">
          <p className="font-label text-[10px] text-berry uppercase tracking-widest mb-3">
            Our Journey
          </p>
          <h1 className="font-hand text-4xl sm:text-5xl text-ink leading-tight">
            The story behind RASTAH से.
          </h1>
          <p className="font-label text-xs text-ink/50 uppercase tracking-widest mt-3">
            By Afeedha Sherin and Salman Roshan
          </p>
        </div>
      </section>

      {/* Main Story Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-12 font-body text-sm sm:text-base text-ink/80 leading-relaxed">
        <div className="space-y-4">
          <h2 className="font-hand text-2xl sm:text-3xl text-ink">
            What is a &ldquo;Rastah&rdquo;?
          </h2>
          <p>
            In Urdu and Hindi, <em>Rastah</em> (रास्ता) means a path. For us, it represents the ancient trade routes, desert trails, mountain passes, and riverbanks that have nurtured Indian crafts for thousands of years.
          </p>
          <p>
            We founded <strong>RASTAH से</strong> not to build another mass-market e-commerce store, but to establish a slow, intentional bridge between master artisans living in remote corners of India and homes that revere craftsmanship.
          </p>
        </div>

        {/* Brand motifs quote */}
        <div className="p-8 rounded-[24px] bg-surface border border-brand text-center space-y-3 relative overflow-hidden">
          <div className="flex justify-center gap-6 opacity-30 mb-2">
            <Image src="/brand/motifs/river.svg" alt="" width={32} height={32} className="h-6 w-auto" />
            <Image src="/brand/motifs/mountain.svg" alt="" width={32} height={32} className="h-6 w-auto" />
            <Image src="/brand/motifs/waves.svg" alt="" width={32} height={32} className="h-6 w-auto" />
          </div>
          <p className="font-hand text-2xl text-ink">
            &ldquo;A stone cairn marks the trail so you know you are not lost. The berry on top is the gift along the way.&rdquo;
          </p>
          <p className="font-label text-[9px] text-berry uppercase tracking-widest">
            — The Rastah Cairn Philosophy
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-hand text-2xl sm:text-3xl text-ink">
            Four Living Craft Traditions
          </h2>
          <p>
            Our catalog is organized around four core artisanal mediums, each honoring a geographic footprint and a dedicated pigment:
          </p>
          <ul className="space-y-3 pt-2">
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-[#48010d] mt-2 flex-shrink-0" />
              <div>
                <strong>Apparel & Carryalls:</strong> Handwoven palm Koodai bags from Pondicherry, pure pashmina shawls from high-altitude Ladakh goats woven in Srinagar, and Indo-Persian silk bandanas.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-[#0f1b37] mt-2 flex-shrink-0" />
              <div>
                <strong>Ceramics:</strong> Wheel-thrown stoneware and authentic quartz-based blue pottery from Jaipur.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-[#4e5332] mt-2 flex-shrink-0" />
              <div>
                <strong>Home Décor:</strong> Hand-felted Namda rugs, tribal Gabba wool carpets, Aranmula metallurgical mirrors from Kerala, and hand-bound journals of unbleached deckle rag paper from Udaipur.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-[#57253e] mt-2 flex-shrink-0" />
              <div>
                <strong>Jewelry:</strong> Ritual bronze torque collars and multi-strand heirloom beadwork handcrafted by the Konyak Naga tribe in Longwa.
              </div>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="font-hand text-2xl sm:text-3xl text-ink">
            Fair Exchange & Direct Sourcing
          </h2>
          <p>
            Every single piece on this website was procured directly from individual artisan households, self-help groups, or multi-generational craft guilds. No middlemen. We pay fair upfront prices so craftspeople can sustain their families and pass these irreplaceable techniques to the next generation.
          </p>
        </div>

        <div className="pt-6 text-center">
          <Link
            href="/shop"
            className="inline-block px-8 py-3.5 rounded-[14px] bg-berry text-paper font-label text-xs uppercase tracking-widest hover:bg-[#580118] transition-colors shadow-soft"
          >
            Explore the Collection
          </Link>
        </div>
      </section>

      <SectionDivider motif="path" className="py-8 max-w-2xl mx-auto" />
    </div>
  );
}
