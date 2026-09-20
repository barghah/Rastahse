"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Category } from "@/types/product";
import { FadeUp } from "@/components/ui/index";

interface CategoryRowProps {
  categories: Category[];
}

export function CategoryRow({ categories }: CategoryRowProps) {
  return (
    <section className="py-16 px-4 bg-surface" aria-labelledby="categories-heading">
      <div className="max-w-5xl mx-auto">
        <FadeUp>
          <h2 id="categories-heading" className="font-label text-[10px] text-center text-ink/40 mb-10 tracking-widest uppercase">
            Browse by Craft Medium
          </h2>
        </FadeUp>

        <div className="flex items-start justify-center gap-6 sm:gap-14 flex-wrap">
          {categories.map((cat, i) => (
            <FadeUp key={cat.slug} delay={i * 0.06}>
              <Link
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-3 group"
                aria-label={`Browse ${cat.name}`}
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] bg-paper border border-brand flex items-center justify-center shadow-soft group-hover:border-ink/20 group-hover:shadow-[0_4px_16px_rgba(49,49,48,0.06)] transition-all duration-300 p-3.5 relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ backgroundColor: `${cat.fruitColor}06` }}
                  />
                  {cat.iconPath && (
                    <Image
                      src={cat.iconPath}
                      alt={cat.name}
                      width={64}
                      height={64}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain transition-transform duration-500 ease-out group-hover:scale-105 select-none"
                    />
                  )}
                </motion.div>
                <span className="font-label text-[10px] sm:text-[11px] text-ink/70 group-hover:text-berry transition-colors text-center tracking-widest font-medium uppercase">
                  {cat.name}
                </span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
