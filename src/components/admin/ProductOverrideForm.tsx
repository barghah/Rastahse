"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  upsertProductOverride,
  toggleProductVisibility,
  deleteProduct,
  restoreProduct,
  toggleProductStock,
  uploadProductImage,
  updateProductImages,
  updateProductName,
  adjustProductStock,
  type ProductOverride,
} from "@/actions/admin";
import type { Product } from "@/types/product";

interface Props {
  product: Product;
  override?: ProductOverride;
}

/**
 * ProductOverrideForm — inline interactive product manager.
 * Supports:
 * - Hiding / Unhiding product from storefront
 * - Soft Deleting / Archiving & Restoring product
 * - In Stock / Out of Stock toggle
 * - Custom Price and Description overrides
 */
export function ProductOverrideForm({ product, override }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form states
  const [priceStr, setPriceStr] = useState(
    override?.price_override !== undefined ? String(override.price_override) : ""
  );
  const [description, setDescription] = useState(
    override?.description_override ?? ""
  );
  const [inStock, setInStock] = useState(override?.in_stock ?? true);
  const [isHidden, setIsHidden] = useState(override?.is_hidden ?? false);
  const [isDeleted, setIsDeleted] = useState(override?.is_deleted ?? false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // All products are database-backed now
  const canEditImages = true;
  const MAX_IMAGES = 5;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgs, setImgs] = useState<Array<{ url: string; alt?: string }>>(
    product.images ?? []
  );
  const [imgDirty, setImgDirty] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Stock Adjustment State
  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [adjustVariantId, setAdjustVariantId] = useState(product.variants?.[0]?.id ?? "");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState<"manual_adjustment" | "return_restocked" | "write_off">("manual_adjustment");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustPending, setAdjustPending] = useState(false);

  async function handleAddImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    e.target.value = "";
    if (files.length === 0) return;

    const sku = product.variants?.find((v) => v.sku)?.sku ?? "product";
    const slots = MAX_IMAGES - imgs.length;
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploading(true);
    const added: Array<{ url: string }> = [];
    for (const file of files.slice(0, slots)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("sku", sku);
      const res = await uploadProductImage(fd);
      if (res.success && res.url) {
        added.push({ url: res.url });
      } else {
        setErrorMsg(res.error ?? "Image upload failed.");
        break;
      }
    }
    setUploading(false);
    if (added.length > 0) {
      setImgs((prev) => [...prev, ...added]);
      setImgDirty(true);
    }
  }

  function removeImg(i: number) {
    setImgs((prev) => prev.filter((_, idx) => idx !== i));
    setImgDirty(true);
  }

  function makeMain(i: number) {
    setImgs((prev) => [prev[i], ...prev.filter((_, idx) => idx !== i)]);
    setImgDirty(true);
  }

  function saveImages() {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await updateProductImages(product.id, imgs, product.name);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to save images.");
      } else {
        setImgDirty(false);
        setSuccessMsg("Images updated");
        router.refresh();
      }
    });
  }

  const [nameStr, setNameStr] = useState(product.name);

  function saveName() {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await updateProductName(product.id, nameStr);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to rename product.");
      } else {
        setSuccessMsg("Name updated");
        router.refresh();
      }
    });
  }

  const hasPriceOverride = override?.price_override !== undefined;

  // Quick Action: Toggle Visibility
  function handleToggleVisibility(e: React.MouseEvent) {
    e.stopPropagation();
    const nextHidden = !isHidden;
    setIsHidden(nextHidden);
    setErrorMsg(null);
    setSuccessMsg(nextHidden ? "Product hidden from store" : "Product visible on store");

    startTransition(async () => {
      const res = await toggleProductVisibility(product.id, nextHidden);
      if (!res.success) {
        setIsHidden(!nextHidden); // rollback
        setErrorMsg(res.error || "Failed to toggle visibility.");
      } else if (res.error) {
        setErrorMsg(res.error); // column missing notice
      } else {
        router.refresh();
      }
    });
  }

  // Quick Action: Toggle Stock
  function handleToggleStock(e: React.MouseEvent) {
    e.stopPropagation();
    const nextStock = !inStock;
    setInStock(nextStock);
    setErrorMsg(null);
    setSuccessMsg(nextStock ? "Marked as In Stock" : "Marked as Out of Stock");

    startTransition(async () => {
      const res = await toggleProductStock(product.id, nextStock);
      if (!res.success) {
        setInStock(!nextStock); // rollback
        setErrorMsg(res.error || "Failed to toggle stock.");
      } else {
        router.refresh();
      }
    });
  }

  // Quick Action: Delete / Archive
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setConfirmDelete(false);
    setIsDeleted(true);
    setIsHidden(true);
    setErrorMsg(null);
    setSuccessMsg("Product moved to archive");

    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (!res.success) {
        setIsDeleted(false);
        setIsHidden(false);
        setErrorMsg(res.error || "Failed to delete product.");
      } else if (res.error) {
        setErrorMsg(res.error);
      } else {
        router.refresh();
      }
    });
  }

  // Quick Action: Restore
  function handleRestore(e: React.MouseEvent) {
    e.stopPropagation();
    setIsDeleted(false);
    setIsHidden(false);
    setErrorMsg(null);
    setSuccessMsg("Product restored to active catalog");

    startTransition(async () => {
      const res = await restoreProduct(product.id);
      if (!res.success) {
        setIsDeleted(true);
        setIsHidden(true);
        setErrorMsg(res.error || "Failed to restore product.");
      } else if (res.error) {
        setErrorMsg(res.error);
      } else {
        router.refresh();
      }
    });
  }

  // Full form save
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const price = priceStr ? parseFloat(priceStr) : undefined;
    if (priceStr && (isNaN(price!) || price! < 0)) {
      setErrorMsg("Please enter a valid price.");
      return;
    }

    startTransition(async () => {
      // 1. Save name if edited
      if (nameStr.trim() && nameStr.trim() !== product.name) {
        await updateProductName(product.id, nameStr);
      }

      // 2. Save images if modified
      if (imgDirty) {
        await updateProductImages(product.id, imgs, nameStr || product.name);
        setImgDirty(false);
      }

      // 3. Save price, description, visibility, stock
      const res = await upsertProductOverride(product.id, {
        price_override: price,
        description_override: description || undefined,
        in_stock: inStock,
        is_hidden: isHidden,
        is_deleted: isDeleted,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to save changes.");
      } else {
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg("Saved changes successfully! Storefront updated.");
        }
        router.refresh();
      }
    });
  }

  async function handleStockAdjustment(e: React.FormEvent) {
    e.preventDefault();
    const qtyNum = parseInt(adjustQty, 10);
    if (!qtyNum || isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg("Please enter a valid positive quantity.");
      return;
    }
    const targetVariant = product.variants?.find((v) => v.id === adjustVariantId) || product.variants?.[0];
    if (!targetVariant) {
      setErrorMsg("No variant found for stock adjustment.");
      return;
    }

    setAdjustPending(true);
    setErrorMsg(null);
    try {
      const res = await adjustProductStock({
        variantId: targetVariant.id,
        qty: qtyNum,
        reason: adjustReason,
        note: adjustNote || undefined,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Failed to adjust stock.");
      } else {
        setSuccessMsg(`✓ Stock adjusted for ${targetVariant.sku || targetVariant.name} (+${qtyNum} units)`);
        setAdjustQty("");
        setAdjustNote("");
        setShowAdjustStock(false);
        router.refresh();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error adjusting stock");
    } finally {
      setAdjustPending(false);
    }
  }

  return (
    <div
      className={`rounded-[18px] border transition-all duration-200 overflow-hidden ${
        isDeleted
          ? "bg-surface/50 border-red-200 opacity-80"
          : isHidden
          ? "bg-paper border-amber-200 shadow-soft"
          : open
          ? "bg-paper border-berry/40 shadow-md"
          : "bg-paper border-brand hover:border-ink/20 shadow-soft"
      }`}
    >
      {/* ── Main Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
        {/* Left: Thumbnail & Details */}
        <div
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer select-none"
        >
          <div className="w-13 h-13 rounded-[12px] bg-surface overflow-hidden shrink-0 flex items-center justify-center border border-brand/60 relative">
            {product.images?.[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                width={52}
                height={52}
                className={`w-full h-full object-cover transition-opacity ${
                  isDeleted || isHidden ? "grayscale contrast-75" : ""
                }`}
              />
            ) : (
              <span className="text-ink/30 text-xs">—</span>
            )}
            {isDeleted && (
              <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                <span className="text-[10px] text-paper font-semibold">✕</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* SKU Badge — shown prominently before name */}
            {(() => {
              const sku = product.variants?.find((v) => v.sku)?.sku;
              if (!sku) return null;
              return (
                <div className="mb-1">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-ink/8 border border-brand font-mono text-[10px] text-ink/60 font-bold tracking-wider uppercase">
                    {sku}
                  </span>
                </div>
              );
            })()}

            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-body text-sm font-semibold truncate ${
                  isDeleted ? "line-through text-ink/50" : "text-ink"
                }`}
              >
                {product.name}
              </h3>

              {/* Status Badges */}
              {isDeleted ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-label text-[9px] uppercase tracking-wider font-semibold">
                  Archived / Deleted
                </span>
              ) : isHidden ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-label text-[9px] uppercase tracking-wider font-semibold">
                  Hidden from Store
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label text-[9px] uppercase tracking-wider font-medium">
                  Live on Store
                </span>
              )}

              {!inStock && !isDeleted && (
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-label text-[9px] uppercase tracking-wider font-medium">
                  Out of Stock
                </span>
              )}

              {hasPriceOverride && (
                <span className="px-2 py-0.5 rounded-full bg-berry/10 text-berry border border-berry/20 font-label text-[9px] uppercase tracking-wider font-semibold">
                  Price Overridden
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 font-label text-[11px] text-ink/50 mt-1">
              <span>
                Original: <strong className="text-ink font-medium">₹{product.price.toLocaleString("en-IN")}</strong>
              </span>
              {override?.price_override !== undefined && (
                <span className="text-berry font-semibold">
                  → Active: ₹{override.price_override.toLocaleString("en-IN")}
                </span>
              )}
              <span>· {product.categorySlug}</span>
            </div>

            {/* Stock Breakdown: TOTAL / WITHHELD / AVAILABLE */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {product.variants?.map((v) => {
                const total = v.totalStock ?? v.stock ?? 0;
                const withheld = v.withheldStock ?? 0;
                const available = v.availableStock ?? v.stock ?? 0;
                return (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-surface/70 border border-brand/60 font-mono text-[9.5px] text-ink/75"
                  >
                    <span className="font-semibold text-ink">{v.name}:</span>
                    <span>Total <strong className="text-ink">{total}</strong></span>
                    <span className="text-ink/20">/</span>
                    <span className="text-amber-700">Reserved <strong>{withheld}</strong></span>
                    <span className="text-ink/20">/</span>
                    <span className="text-emerald-700 font-semibold">Available <strong>{available}</strong></span>
                  </span>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand/50 justify-between sm:justify-end">
          {/* Adjust Stock Button */}
          {!isDeleted && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAdjustStock((s) => !s);
              }}
              title="Adjust inventory units and audit ledger"
              className={`px-3 py-1.5 rounded-[10px] font-label text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer border ${
                showAdjustStock
                  ? "bg-berry text-paper border-berry shadow-xs"
                  : "bg-surface hover:bg-surface/80 text-ink/70 border-brand hover:text-ink"
              }`}
            >
              📦 Adjust
            </button>
          )}

          {/* Hide / Show Toggle Button */}
          {!isDeleted && (
            <button
              type="button"
              onClick={handleToggleVisibility}
              disabled={isPending}
              title={isHidden ? "Click to show on store" : "Click to hide from store"}
              className={`px-3 py-1.5 rounded-[10px] font-label text-[10.5px] uppercase tracking-wider font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                isHidden
                  ? "bg-amber-500 text-paper border-amber-600 shadow-xs hover:bg-amber-600"
                  : "bg-surface hover:bg-surface/80 text-ink/70 border-brand hover:text-ink"
              }`}
            >
              <span>{isHidden ? "🙈" : "👁️"}</span>
              <span>{isHidden ? "Hidden" : "Visible"}</span>
            </button>
          )}

          {/* Quick In/Out Stock Button */}
          {!isDeleted && (
            <button
              type="button"
              onClick={handleToggleStock}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-[10px] font-label text-[10.5px] uppercase tracking-wider font-medium transition-all cursor-pointer border ${
                inStock
                  ? "bg-surface hover:bg-surface/80 text-ink/70 border-brand hover:text-ink"
                  : "bg-stone-200 text-stone-700 border-stone-300"
              }`}
            >
              {inStock ? "Stock: In" : "Stock: Out"}
            </button>
          )}

          {/* Delete / Restore Button */}
          {isDeleted ? (
            <button
              type="button"
              onClick={handleRestore}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-paper font-label text-[10.5px] uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer"
            >
              ↩ Restore
            </button>
          ) : confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-1.5 rounded-[10px] bg-red-600 hover:bg-red-700 text-paper font-label text-[10px] uppercase tracking-wider font-bold transition-all shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(false);
                }}
                className="px-2 py-1.5 text-xs text-ink/50 hover:text-ink cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              disabled={isPending}
              title="Archive / Delete item"
              className="px-3 py-1.5 rounded-[10px] bg-surface hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-brand text-ink/50 font-label text-[10.5px] uppercase tracking-wider font-medium transition-all cursor-pointer"
            >
              🗑️ Delete
            </button>
          )}

          {/* Edit Accordion Toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-[10px] hover:bg-surface border border-transparent hover:border-brand text-ink/40 hover:text-ink transition-colors cursor-pointer text-xs"
            title="Expand edit form"
          >
            {open ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Instant Notification Banner */}
      {(successMsg || errorMsg) && (
        <div
          className={`px-5 py-2 text-xs font-body font-medium flex items-center justify-between border-t ${
            errorMsg ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          <span>{errorMsg ?? `✓ ${successMsg}`}</span>
          <button
            type="button"
            onClick={() => {
              setSuccessMsg(null);
              setErrorMsg(null);
            }}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Inline Stock Adjustment Drawer ── */}
      {showAdjustStock && (
        <form
          onSubmit={handleStockAdjustment}
          className="px-6 py-4 border-t border-brand bg-amber-50/50 flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] uppercase tracking-wider text-ink/70 font-semibold">
              Adjust Stock:
            </span>
            {product.variants && product.variants.length > 1 ? (
              <select
                value={adjustVariantId}
                onChange={(e) => setAdjustVariantId(e.target.value)}
                className="px-2.5 py-1.5 rounded-[8px] bg-paper border border-brand font-body text-xs text-ink"
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.sku})
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              min="1"
              placeholder="+ Qty"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className="w-24 px-2.5 py-1.5 rounded-[8px] bg-paper border border-brand font-body text-xs text-ink placeholder:text-ink/30"
              required
            />
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-[8px] bg-paper border border-brand font-body text-xs text-ink"
            >
              <option value="manual_adjustment">Manual Correction</option>
              <option value="return_restocked">Inspected Return</option>
              <option value="write_off">Write-off / Restock</option>
            </select>
            <input
              type="text"
              placeholder="Audit note (optional)"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              className="w-44 px-2.5 py-1.5 rounded-[8px] bg-paper border border-brand font-body text-xs text-ink placeholder:text-ink/30"
            />
            <button
              type="submit"
              disabled={adjustPending}
              className="px-4 py-1.5 rounded-[8px] bg-ink text-paper font-label text-[10px] uppercase tracking-widest font-semibold hover:bg-ink/80 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {adjustPending ? "Updating…" : "Apply Adjustment"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdjustStock(false)}
              className="text-xs text-ink/40 hover:text-ink p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </form>
      )}

      {/* ── Expandable Override Form ── */}
      {open && (
        <form
          onSubmit={handleSave}
          className="px-6 pb-6 pt-3 space-y-4 border-t border-brand bg-surface/30"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Price override */}
            <div>
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Price Override (₹) <span className="text-ink/35 normal-case font-normal">· leave blank to use original</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={`Original: ₹${product.price}`}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-paper border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
              />
            </div>

            {/* Visibility & Stock Flags */}
            <div className="space-y-2">
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Storefront Controls
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsHidden((h) => !h)}
                  className={`px-3.5 py-2 rounded-[8px] font-label text-[10px] uppercase tracking-wider transition-all cursor-pointer font-medium ${
                    isHidden
                      ? "bg-amber-100 text-amber-900 border border-amber-300 font-semibold"
                      : "bg-paper text-ink/70 border border-brand hover:border-ink/20"
                  }`}
                >
                  {isHidden ? "🙈 Hidden from Store" : "👁️ Visible on Store"}
                </button>

                <button
                  type="button"
                  onClick={() => setInStock((s) => !s)}
                  className={`px-3.5 py-2 rounded-[8px] font-label text-[10px] uppercase tracking-wider transition-all cursor-pointer font-medium ${
                    inStock
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold"
                      : "bg-stone-200 text-stone-700 border border-stone-300"
                  }`}
                >
                  {inStock ? "✓ In Stock" : "✕ Out of Stock"}
                </button>
              </div>
            </div>
          </div>

          {/* Description override */}
          <div>
            <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
              Description Override <span className="text-ink/35 normal-case font-normal">· leave blank to use original</span>
            </label>
            <textarea
              rows={3}
              placeholder={product.description ?? "Original description…"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-paper border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all resize-none"
            />
          </div>

          {/* Product name */}
          {canEditImages && (
            <div>
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Product Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameStr}
                  onChange={(e) => setNameStr(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-paper border border-brand outline-none focus:border-berry transition-all"
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={isPending || !nameStr.trim() || nameStr.trim() === product.name}
                  className="px-4 py-2 bg-ink text-paper font-label text-[10px] uppercase tracking-widest rounded-[10px] hover:bg-ink/85 disabled:opacity-40 transition-all cursor-pointer font-medium"
                >
                  Rename
                </button>
              </div>
            </div>
          )}

          {/* Product images */}
          {canEditImages && (
            <div>
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Product Images <span className="text-ink/35 normal-case font-normal">· first image is the main one · up to {MAX_IMAGES}</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {imgs.map((img, i) => (
                  <div
                    key={`${img.url}-${i}`}
                    className="relative w-20 h-20 rounded-[10px] overflow-hidden border border-brand bg-surface group"
                  >
                    <Image src={img.url} alt={`Image ${i + 1}`} fill className="object-cover" />
                    {i === 0 ? (
                      <div className="absolute bottom-0 left-0 right-0 bg-berry/80 py-0.5 text-center">
                        <span className="font-label text-[8px] text-paper uppercase tracking-wider">Main</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeMain(i)}
                        className="absolute bottom-0 left-0 right-0 bg-ink/70 py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <span className="font-label text-[8px] text-paper uppercase tracking-wider">Set main</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImg(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-paper rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {imgs.length < MAX_IMAGES && (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-[10px] border-2 border-dashed border-brand hover:border-ink/30 bg-surface/30 hover:bg-surface flex items-center justify-center text-ink/40 hover:text-ink/70 transition-all cursor-pointer text-xl disabled:opacity-50"
                  >
                    {uploading ? <span className="text-xs animate-pulse">⏳</span> : "+"}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddImages}
                  className="hidden"
                />
              </div>
              {imgDirty && (
                <button
                  type="button"
                  onClick={saveImages}
                  disabled={isPending || uploading}
                  className="mt-3 px-5 py-2 bg-ink text-paper font-label text-[10px] uppercase tracking-widest rounded-[10px] hover:bg-ink/85 disabled:opacity-50 transition-all cursor-pointer font-medium"
                >
                  {isPending ? "Saving…" : "Save Images"}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="font-body text-xs text-ink/45">
              Changes reflect immediately on the storefront catalog and search.
            </p>

            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-berry text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm cursor-pointer font-medium"
            >
              {isPending ? "Saving…" : "Save All Overrides"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
