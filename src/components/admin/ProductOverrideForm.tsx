"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upsertProductOverride } from "@/actions/admin";
import type { Product } from "@/types/product";

interface Override {
  price_override?: number;
  description_override?: string;
  in_stock: boolean;
}

interface Props {
  product: Product;
  override?: Override;
}

/**
 * ProductOverrideForm — inline accordion form per product.
 * Collapsed by default, expands on click to edit price/desc/stock.
 */
export function ProductOverrideForm({ product, override }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [priceStr, setPriceStr] = useState(
    override?.price_override !== undefined ? String(override.price_override) : ""
  );
  const [description, setDescription] = useState(
    override?.description_override ?? ""
  );
  const [inStock, setInStock] = useState(override?.in_stock ?? true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasOverride =
    override?.price_override !== undefined ||
    override?.description_override ||
    override?.in_stock === false;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const price = priceStr ? parseFloat(priceStr) : undefined;
    if (priceStr && (isNaN(price!) || price! < 0)) {
      setError("Enter a valid price.");
      return;
    }

    startTransition(async () => {
      try {
        await upsertProductOverride(product.id, {
          price_override: price,
          description_override: description || undefined,
          in_stock: inStock,
        });
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  return (
    <div
      className="rounded-[14px] border overflow-hidden"
      style={{ borderColor: open ? "rgba(108,2,34,0.4)" : "rgba(255,255,255,0.07)" }}
    >
      {/* Header row — click to expand */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        style={{ backgroundColor: "#1c1917" }}
      >
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-[8px] bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt=""
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white/20 text-xs">—</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-white/80 truncate">{product.name}</p>
          <p className="font-label text-[10px] text-white/30 mt-0.5">
            ₹{product.price.toLocaleString("en-IN")}
            {override?.price_override !== undefined && (
              <span className="text-berry ml-2">→ ₹{override.price_override.toLocaleString("en-IN")}</span>
            )}
            {!inStock && <span className="text-red-400 ml-2">· Out of stock</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasOverride && (
            <span className="px-2 py-0.5 rounded-full bg-berry/20 text-berry font-label text-[9px] uppercase tracking-wider">
              Overridden
            </span>
          )}
          <span className="text-white/25 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expandable form */}
      {open && (
        <form
          onSubmit={handleSave}
          className="px-5 pb-5 pt-1 space-y-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "#161412" }}
        >
          <div className="grid sm:grid-cols-2 gap-4 pt-3">
            {/* Price override */}
            <div>
              <label className="font-label text-[10px] text-white/35 uppercase tracking-wider block mb-1.5">
                Price Override (₹) <span className="text-white/20 normal-case">· leave blank to use original</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={`Original: ₹${product.price}`}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-[10px] font-body text-sm text-white/80 bg-white/5 border border-white/10 outline-none focus:border-white/25 placeholder:text-white/20 transition-colors"
              />
            </div>

            {/* Stock toggle */}
            <div>
              <label className="font-label text-[10px] text-white/35 uppercase tracking-wider block mb-1.5">
                Stock Status
              </label>
              <div className="flex gap-3 pt-1">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setInStock(val)}
                    className={`px-4 py-2 rounded-[8px] font-label text-[10px] uppercase tracking-wider transition-all ${
                      inStock === val
                        ? val
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "text-white/30 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {val ? "In Stock" : "Out of Stock"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description override */}
          <div>
            <label className="font-label text-[10px] text-white/35 uppercase tracking-wider block mb-1.5">
              Description Override <span className="text-white/20 normal-case">· leave blank to use original</span>
            </label>
            <textarea
              rows={3}
              placeholder={product.description ?? "Original description…"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[10px] font-body text-sm text-white/80 bg-white/5 border border-white/10 outline-none focus:border-white/25 placeholder:text-white/20 transition-colors resize-none"
            />
          </div>

          {success && <p className="font-body text-xs text-emerald-400">✓ Saved.</p>}
          {error && <p className="font-body text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-berry text-paper font-label text-[10px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {isPending ? "Saving…" : "Save Override"}
          </button>
        </form>
      )}
    </div>
  );
}
