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
  overrideProductStockAction,
  updateProductPricingAction,
  getProductPriceHistoryAction,
  updateProductDetailsAction,
  type ProductOverride,
} from "@/actions/admin";
import type { Product } from "@/types/product";

interface Props {
  product: Product;
  override?: ProductOverride;
}

interface PriceHistoryItem {
  id: string;
  cost_price: number | null;
  regular_price: number;
  offer_price: number | null;
  note: string | null;
  created_at: string;
}

/**
 * Visual SVG Price History Trend Chart
 */
function PriceHistoryChart({ items }: { items: PriceHistoryItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="py-12 text-center text-ink/40 font-body text-xs">
        No price history recorded yet.
      </div>
    );
  }

  // Sort chronological for graph: oldest -> newest
  const chron = [...items].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // If only 1 entry:
  if (chron.length === 1) {
    const entry = chron[0];
    const reg = entry.regular_price / 100;
    const off = entry.offer_price ? entry.offer_price / 100 : null;
    const cost = entry.cost_price ? entry.cost_price / 100 : null;
    return (
      <div className="p-6 rounded-[14px] bg-surface/50 border border-brand space-y-3 text-center">
        <p className="font-label text-xs uppercase tracking-wider font-semibold text-ink">
          Initial Baseline Recorded
        </p>
        <div className="flex items-center justify-center gap-6 font-mono text-xs">
          <span>
            Cost: <strong className="text-blue-700">{cost ? `₹${cost.toLocaleString("en-IN")}` : "N/A"}</strong>
          </span>
          <span>
            Selling: <strong className="text-ink">{`₹${reg.toLocaleString("en-IN")}`}</strong>
          </span>
          <span>
            Offer: <strong className="text-rose-700">{off ? `₹${off.toLocaleString("en-IN")}` : "None"}</strong>
          </span>
        </div>
        <p className="font-body text-[11px] text-ink/50 max-w-md mx-auto">
          Baseline recorded on{" "}
          {new Date(entry.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          . When you update pricing in the form, historical trend lines will connect your price points on this chart.
        </p>
      </div>
    );
  }

  // Multi-point graph
  const W = 580;
  const H = 220;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const allPrices: number[] = [];
  chron.forEach((c) => {
    allPrices.push(c.regular_price / 100);
    if (c.offer_price) allPrices.push(c.offer_price / 100);
    if (c.cost_price) allPrices.push(c.cost_price / 100);
  });

  const minP = Math.max(0, Math.floor(Math.min(...allPrices) * 0.85));
  const maxP = Math.ceil(Math.max(...allPrices) * 1.15);
  const pRange = maxP - minP || 1;

  const tStart = new Date(chron[0].created_at).getTime();
  const tEnd = new Date(chron[chron.length - 1].created_at).getTime();
  const tRange = tEnd - tStart || 1;

  function getX(dStr: string) {
    const t = new Date(dStr).getTime();
    return padLeft + ((t - tStart) / tRange) * chartW;
  }

  function getY(pricePaise: number) {
    const p = pricePaise / 100;
    return padTop + chartH - ((p - minP) / pRange) * chartH;
  }

  // Generate paths
  const regPoints = chron.map((c) => ({
    x: getX(c.created_at),
    y: getY(c.regular_price),
    val: c.regular_price / 100,
    date: c.created_at,
  }));
  const regPath = regPoints
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const costPoints = chron
    .filter((c) => c.cost_price !== null)
    .map((c) => ({
      x: getX(c.created_at),
      y: getY(c.cost_price!),
      val: c.cost_price! / 100,
      date: c.created_at,
    }));
  const costPath = costPoints
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const offerPoints = chron
    .filter((c) => c.offer_price !== null)
    .map((c) => ({
      x: getX(c.created_at),
      y: getY(c.offer_price!),
      val: c.offer_price! / 100,
      date: c.created_at,
    }));
  const offerPath = offerPoints
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  // Grid steps (4 lines)
  const steps = 4;
  const gridVals = Array.from({ length: steps + 1 }, (_, i) =>
    Math.round(minP + (pRange / steps) * i)
  );

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-center gap-5 font-label text-[10px] uppercase tracking-wider">
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          <span className="w-3.5 h-1 bg-ink inline-block rounded-xs" />
          <span>Selling Price</span>
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-rose-800">
          <span className="w-3.5 h-1 bg-rose-700 inline-block rounded-xs" />
          <span>Offer Price</span>
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-blue-700">
          <span className="w-3.5 h-1 bg-blue-600 inline-block rounded-xs" />
          <span>Cost Price</span>
        </span>
      </div>

      <div className="overflow-x-auto bg-surface/40 p-4 rounded-[16px] border border-brand">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-56 select-none">
          {/* Horizontal Grid lines & Y labels */}
          {gridVals.map((val) => {
            const y = padTop + chartH - ((val - minP) / pRange) * chartH;
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={W - padRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.12}
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="currentColor"
                  opacity={0.5}
                  fontFamily="monospace"
                >
                  ₹{val.toLocaleString("en-IN")}
                </text>
              </g>
            );
          })}

          {/* Paths */}
          {costPoints.length > 1 && (
            <path d={costPath} fill="none" stroke="#2563eb" strokeWidth="2" strokeOpacity={0.8} />
          )}
          {regPoints.length > 1 && (
            <path d={regPath} fill="none" stroke="#18181b" strokeWidth="2.5" />
          )}
          {offerPoints.length > 1 && (
            <path d={offerPath} fill="none" stroke="#be123c" strokeWidth="2" strokeDasharray="4 3" />
          )}

          {/* Points */}
          {costPoints.map((pt, i) => (
            <circle key={`cost-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#2563eb">
              <title>{`Cost Price: ₹${pt.val.toLocaleString("en-IN")} (${new Date(
                pt.date
              ).toLocaleDateString("en-IN")})`}</title>
            </circle>
          ))}
          {regPoints.map((pt, i) => (
            <circle key={`reg-${i}`} cx={pt.x} cy={pt.y} r="4" fill="#18181b">
              <title>{`Selling Price: ₹${pt.val.toLocaleString("en-IN")} (${new Date(
                pt.date
              ).toLocaleDateString("en-IN")})`}</title>
            </circle>
          ))}
          {offerPoints.map((pt, i) => (
            <circle key={`off-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#be123c">
              <title>{`Offer Price: ₹${pt.val.toLocaleString("en-IN")} (${new Date(
                pt.date
              ).toLocaleDateString("en-IN")})`}</title>
            </circle>
          ))}
        </svg>
      </div>
    </div>
  );
}

/**
 * ProductOverrideForm — inline interactive product & inventory manager.
 */
export function ProductOverrideForm({ product, override }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // General Form States
  const [nameStr, setNameStr] = useState(product.name);
  const [description, setDescription] = useState(
    override?.description_override ?? product.description ?? ""
  );
  const [story, setStory] = useState(product.story ?? "");
  const [curatorNote, setCuratorNote] = useState(product.curatorNote ?? "");
  const [origin, setOrigin] = useState(product.origin ?? "");
  const [artisanName, setArtisanName] = useState(product.artisanName ?? "");
  const [tagsStr, setTagsStr] = useState((product.tags || []).join(", "));
  const [weightGrams, setWeightGrams] = useState(
    product.weightGrams ? String(product.weightGrams) : ""
  );
  const [lengthCm, setLengthCm] = useState(
    product.lengthCm ? String(product.lengthCm) : ""
  );
  const [breadthCm, setBreadthCm] = useState(
    product.breadthCm ? String(product.breadthCm) : ""
  );
  const [heightCm, setHeightCm] = useState(
    product.heightCm ? String(product.heightCm) : ""
  );

  const [inStock, setInStock] = useState(override?.in_stock ?? true);
  const [isHidden, setIsHidden] = useState(override?.is_hidden ?? false);
  const [isDeleted, setIsDeleted] = useState(override?.is_deleted ?? false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Images state
  const MAX_IMAGES = 5;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgs, setImgs] = useState<Array<{ url: string; alt?: string }>>(
    product.images ?? []
  );
  const [imgDirty, setImgDirty] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Stock Management State ──
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id ?? "");
  const activeVariant =
    product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.[0];

  const [currentTotalStock, setCurrentTotalStock] = useState<number>(
    activeVariant?.totalStock ?? activeVariant?.stock ?? 0
  );
  const currentWithheldStock = activeVariant?.withheldStock ?? 0;

  const [overrideStockVal, setOverrideStockVal] = useState<string>(
    String(activeVariant?.totalStock ?? activeVariant?.stock ?? 0)
  );
  const [customDeltaVal, setCustomDeltaVal] = useState<string>("");
  const [stockUpdating, setStockUpdating] = useState(false);

  // ── 3-Tier Pricing States (in ₹) ──
  const isCurrentlyOnOffer = Boolean(
    product.comparePrice && product.comparePrice > product.price
  );
  const initialSellingPrice = isCurrentlyOnOffer
    ? (product.comparePrice! / 100).toString()
    : (product.price / 100).toString();
  const initialOfferPrice = isCurrentlyOnOffer ? (product.price / 100).toString() : "";
  const initialCostPrice = product.costPrice ? (product.costPrice / 100).toString() : "";

  const [sellingPrice, setSellingPrice] = useState(initialSellingPrice);
  const [offerPrice, setOfferPrice] = useState(initialOfferPrice);
  const [costPrice, setCostPrice] = useState(initialCostPrice);
  const [pricingNote, setPricingNote] = useState("");
  const [pricingUpdating, setPricingUpdating] = useState(false);

  // ── Price History Modal States ──
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState<PriceHistoryItem[]>([]);

  // ── Product Images Upload Handlers ──
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

  // ── Stock Override Actions ──
  async function handleApplyStockOverride(newStockNumber: number, auditNote?: string) {
    if (isNaN(newStockNumber) || newStockNumber < 0) {
      setErrorMsg("Please enter a valid stock count (0 or higher).");
      return;
    }
    setStockUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await overrideProductStockAction({
      productId: product.id,
      variantId: activeVariant?.id,
      newStock: newStockNumber,
      note: auditNote || `Admin inventory count updated to ${newStockNumber}`,
    });

    setStockUpdating(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to update stock.");
    } else {
      setCurrentTotalStock(newStockNumber);
      setOverrideStockVal(String(newStockNumber));
      setCustomDeltaVal("");
      setSuccessMsg(
        `✓ Total stock updated to ${newStockNumber} units (Available: ${Math.max(
          0,
          newStockNumber - currentWithheldStock
        )})`
      );
      router.refresh();
    }
  }

  function handleQuickStockDelta(delta: number) {
    const nextVal = Math.max(0, currentTotalStock + delta);
    handleApplyStockOverride(
      nextVal,
      `Quick adjustment: ${delta > 0 ? "+" : ""}${delta} units`
    );
  }

  // ── 3-Tier Pricing Save Action ──
  async function handleSavePricing() {
    const regularNum = parseFloat(sellingPrice);
    if (isNaN(regularNum) || regularNum <= 0) {
      setErrorMsg("Please enter a valid Selling Price (greater than 0).");
      return;
    }

    const offerNum = offerPrice ? parseFloat(offerPrice) : undefined;
    if (offerPrice && (isNaN(offerNum!) || offerNum! <= 0)) {
      setErrorMsg("Please enter a valid Offer Price or leave it empty.");
      return;
    }

    if (offerNum !== undefined && offerNum >= regularNum) {
      setErrorMsg("Offer Price must be lower than Selling Price to produce a discount.");
      return;
    }

    const costNum = costPrice ? parseFloat(costPrice) : undefined;
    if (costPrice && (isNaN(costNum!) || costNum! < 0)) {
      setErrorMsg("Please enter a valid Cost Price.");
      return;
    }

    setPricingUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateProductPricingAction({
      productId: product.id,
      regularPrice: regularNum,
      offerPrice: offerNum,
      costPrice: costNum,
      note: pricingNote || undefined,
    });

    setPricingUpdating(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to save pricing.");
    } else {
      setSuccessMsg(
        offerNum
          ? `✓ Pricing saved! Active offer: ₹${offerNum.toLocaleString(
              "en-IN"
            )} (standard ₹${regularNum.toLocaleString("en-IN")} strikethrough)`
          : `✓ Selling price saved: ₹${regularNum.toLocaleString("en-IN")}`
      );
      setPricingNote("");
      router.refresh();
    }
  }

  // ── Open Price History Action ──
  async function handleOpenPriceHistory() {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const records = await getProductPriceHistoryAction(product.id);
      setHistoryList((records as PriceHistoryItem[]) || []);
    } catch {
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  }

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
      } else {
        router.refresh();
      }
    });
  }

  // Save description, story, artisanship, specs and remaining details
  function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsedTags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

    startTransition(async () => {
      // 1. Save images if modified
      if (imgDirty) {
        await updateProductImages(product.id, imgs, nameStr || product.name);
        setImgDirty(false);
      }

      // 2. Save full details directly to products database
      const res = await updateProductDetailsAction({
        productId: product.id,
        name: nameStr,
        description,
        story,
        curatorNote,
        origin,
        artisanName,
        tags: parsedTags,
        weightGrams: weightGrams ? parseInt(weightGrams, 10) : null,
        lengthCm: lengthCm ? parseFloat(lengthCm) : null,
        breadthCm: breadthCm ? parseFloat(breadthCm) : null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to save details.");
      } else {
        setSuccessMsg("✓ All product details saved! Storefront updated immediately.");
        router.refresh();
      }
    });
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
            {/* SKU Badge */}
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

              {isCurrentlyOnOffer && (
                <span className="px-2 py-0.5 rounded-full bg-berry/10 text-berry border border-berry/20 font-label text-[9px] uppercase tracking-wider font-semibold">
                  Offer Active
                </span>
              )}
            </div>

            {/* Price Preview on Main Row */}
            <div className="flex items-center gap-3 font-label text-[11px] text-ink/50 mt-1">
              {isCurrentlyOnOffer ? (
                <span className="flex items-center gap-1.5">
                  <strong className="text-berry font-bold text-xs">
                    ₹{(product.price / 100).toLocaleString("en-IN")}
                  </strong>
                  <span className="line-through text-ink/35">
                    ₹{(product.comparePrice! / 100).toLocaleString("en-IN")}
                  </span>
                </span>
              ) : (
                <span>
                  Price:{" "}
                  <strong className="text-ink font-semibold">
                    ₹{(product.price / 100).toLocaleString("en-IN")}
                  </strong>
                </span>
              )}
              {product.costPrice && (
                <span className="text-blue-700 font-mono text-[10px]">
                  (Cost: ₹{(product.costPrice / 100).toLocaleString("en-IN")})
                </span>
              )}
              <span>· {product.categorySlug}</span>
            </div>

            {/* Stock Breakdown: TOTAL / RESERVED / AVAILABLE */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {product.variants?.map((v) => {
                const total = v.id === activeVariant?.id ? currentTotalStock : v.totalStock ?? v.stock ?? 0;
                const withheld = v.withheldStock ?? 0;
                const available = Math.max(0, total - withheld);
                return (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-surface/70 border border-brand/60 font-mono text-[9.5px] text-ink/75"
                  >
                    <span className="font-semibold text-ink">{v.name}:</span>
                    <span>
                      Total <strong className="text-ink font-bold">{total}</strong>
                    </span>
                    <span className="text-ink/20">/</span>
                    <span className="text-amber-800">
                      Reserved <strong>{withheld}</strong>
                    </span>
                    <span className="text-ink/20">/</span>
                    <span className="text-emerald-700 font-bold">
                      Available <strong>{available}</strong>
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls (ADJUST BUTTON REMOVED AS REQUESTED) */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand/50 justify-between sm:justify-end">
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
            {open ? "▲ Close" : "▼ Edit"}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {(successMsg || errorMsg) && (
        <div
          className={`px-5 py-2 text-xs font-body font-medium flex items-center justify-between border-t ${
            errorMsg
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          <span>{errorMsg ?? `✓ ${successMsg}`}</span>
          <button
            type="button"
            onClick={() => {
              setSuccessMsg(null);
              setErrorMsg(null);
            }}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── EXPANDED ACCORDION: STOCK OVERRIDE, 3-TIER PRICING & MEDIA ── */}
      {open && (
        <div className="px-6 pb-6 pt-4 space-y-6 border-t border-brand bg-surface/30">
          {/* ── 1. INLINE STOCK OVERRIDE & INVENTORY COUNT ── */}
          <div className="rounded-[16px] p-5 bg-paper border border-brand shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand">
              <div>
                <p className="font-label text-xs uppercase tracking-wider font-bold text-ink flex items-center gap-2">
                  <span>📦</span>
                  <span>Physical Stock Override &amp; Live Inventory</span>
                </p>
                <p className="font-body text-xs text-ink/50 mt-0.5">
                  Directly override physical units we own or use quick delta adjustments (+ / −). Available stock is derived automatically.
                </p>
              </div>

              {product.variants && product.variants.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="font-label text-[9.5px] uppercase tracking-wider text-ink/50 font-semibold">Variant:</span>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => {
                      setSelectedVariantId(e.target.value);
                      const v = product.variants?.find((vx) => vx.id === e.target.value);
                      if (v) {
                        const tot = v.totalStock ?? v.stock ?? 0;
                        setCurrentTotalStock(tot);
                        setOverrideStockVal(String(tot));
                      }
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-surface border border-brand font-body text-xs text-ink focus:outline-none focus:border-berry cursor-pointer font-medium"
                  >
                    {product.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.sku})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Current Metrics Badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-[12px] bg-surface/70 border border-brand text-center">
                <span className="font-label text-[9px] uppercase tracking-wider text-ink/50 block font-semibold">
                  Warehouse Total
                </span>
                <p className="font-mono text-xl font-bold text-ink mt-0.5">
                  {currentTotalStock}
                </p>
              </div>
              <div className="p-3 rounded-[12px] bg-amber-50/70 border border-amber-200 text-center">
                <span className="font-label text-[9px] uppercase tracking-wider text-amber-800/60 block font-semibold">
                  Reserved (Orders)
                </span>
                <p className="font-mono text-xl font-bold text-amber-800 mt-0.5">
                  {currentWithheldStock}
                </p>
              </div>
              <div className="p-3 rounded-[12px] bg-emerald-50/70 border border-emerald-200 text-center">
                <span className="font-label text-[9px] uppercase tracking-wider text-emerald-800/60 block font-semibold">
                  Available to Sell
                </span>
                <p className="font-mono text-xl font-bold text-emerald-800 mt-0.5">
                  {Math.max(0, currentTotalStock - currentWithheldStock)}
                </p>
              </div>
            </div>

            {/* Actions: Override Value OR Add/Subtract */}
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              {/* Direct Override to any count */}
              <div className="space-y-1.5 p-3.5 rounded-[12px] bg-surface/40 border border-brand flex flex-col justify-between">
                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider font-bold text-ink/70 block">
                    Override Total Stock
                  </label>
                  <p className="font-body text-[11px] text-ink/50 mt-0.5">
                    Type any absolute number. When saved, it becomes the new current total and updates live across the site.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="number"
                    min="0"
                    value={overrideStockVal}
                    onChange={(e) => setOverrideStockVal(e.target.value)}
                    placeholder="New total count"
                    className="w-28 px-3 py-1.5 rounded-[8px] bg-paper border border-brand font-mono text-xs text-ink focus:outline-none focus:border-berry font-bold"
                  />
                  <button
                    type="button"
                    disabled={stockUpdating || !overrideStockVal || Number(overrideStockVal) === currentTotalStock}
                    onClick={() => handleApplyStockOverride(parseInt(overrideStockVal, 10))}
                    className="px-4 py-1.5 rounded-[8px] bg-ink text-paper font-label text-[10px] uppercase tracking-wider font-semibold hover:bg-ink/80 disabled:opacity-40 cursor-pointer shadow-xs transition-all"
                  >
                    {stockUpdating ? "Saving…" : "Set Total Stock"}
                  </button>
                </div>
              </div>

              {/* Quick Delta Buttons and Add/Subtract */}
              <div className="space-y-1.5 p-3.5 rounded-[12px] bg-surface/40 border border-brand flex flex-col justify-between">
                <div>
                  <label className="font-label text-[10px] uppercase tracking-wider font-bold text-ink/70 block">
                    Quick Adjust (+ / −)
                  </label>
                  <p className="font-body text-[11px] text-ink/50 mt-0.5">
                    Fast increment or decrement by preset units or custom amount.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <button
                    type="button"
                    disabled={stockUpdating || currentTotalStock < 5}
                    onClick={() => handleQuickStockDelta(-5)}
                    className="px-2.5 py-1 rounded-[6px] bg-paper border border-brand font-mono text-xs text-ink/70 hover:text-ink hover:border-ink/30 cursor-pointer disabled:opacity-40 font-semibold"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    disabled={stockUpdating || currentTotalStock < 1}
                    onClick={() => handleQuickStockDelta(-1)}
                    className="px-2.5 py-1 rounded-[6px] bg-paper border border-brand font-mono text-xs text-ink/70 hover:text-ink hover:border-ink/30 cursor-pointer disabled:opacity-40 font-semibold"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    disabled={stockUpdating}
                    onClick={() => handleQuickStockDelta(+1)}
                    className="px-2.5 py-1 rounded-[6px] bg-paper border border-brand font-mono text-xs text-ink/70 hover:text-ink hover:border-ink/30 cursor-pointer disabled:opacity-40 font-semibold"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    disabled={stockUpdating}
                    onClick={() => handleQuickStockDelta(+5)}
                    className="px-2.5 py-1 rounded-[6px] bg-paper border border-brand font-mono text-xs text-ink/70 hover:text-ink hover:border-ink/30 cursor-pointer disabled:opacity-40 font-semibold"
                  >
                    +5
                  </button>

                  {/* Custom Delta Input */}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={customDeltaVal}
                      onChange={(e) => setCustomDeltaVal(e.target.value)}
                      className="w-16 px-2 py-1 rounded-[6px] bg-paper border border-brand font-mono text-xs text-ink"
                    />
                    <button
                      type="button"
                      disabled={stockUpdating || !customDeltaVal || Number(customDeltaVal) <= 0}
                      onClick={() => handleQuickStockDelta(parseInt(customDeltaVal, 10))}
                      className="px-2.5 py-1 rounded-[6px] bg-emerald-700 text-paper font-label text-[9px] uppercase font-bold hover:bg-emerald-800 disabled:opacity-40 cursor-pointer transition-colors"
                    >
                      + Add
                    </button>
                    <button
                      type="button"
                      disabled={
                        stockUpdating ||
                        !customDeltaVal ||
                        Number(customDeltaVal) <= 0 ||
                        currentTotalStock < Number(customDeltaVal)
                      }
                      onClick={() => handleQuickStockDelta(-parseInt(customDeltaVal, 10))}
                      className="px-2.5 py-1 rounded-[6px] bg-stone-700 text-paper font-label text-[9px] uppercase font-bold hover:bg-stone-800 disabled:opacity-40 cursor-pointer transition-colors"
                    >
                      − Sub
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. 3-TIER PRICING & OFFER CONFIGURATION ── */}
          <div className="rounded-[16px] p-5 bg-paper border border-brand shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand">
              <div>
                <p className="font-label text-xs uppercase tracking-wider font-bold text-ink flex items-center gap-2">
                  <span>🏷️</span>
                  <span>3-Tier Pricing &amp; Promotional Offers</span>
                </p>
                <p className="font-body text-xs text-ink/50 mt-0.5">
                  Set cost price, standard selling price, and promotional offer price.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenPriceHistory}
                className="px-3 py-1.5 rounded-[8px] bg-surface hover:bg-surface/80 border border-brand font-label text-[10px] uppercase tracking-wider font-semibold text-ink/80 hover:text-ink cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>📈 View Price History &amp; Graph</span>
              </button>
            </div>

            {/* 3 Price Inputs */}
            <div className="grid sm:grid-cols-3 gap-3">
              {/* 1. Cost Price */}
              <div>
                <label className="font-label text-[10px] uppercase tracking-wider text-ink/60 font-semibold block mb-1">
                  Cost Price (₹) <span className="text-ink/35 normal-case font-normal">· acquisition/COGS</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="e.g. 850"
                  className="w-full px-3 py-2 rounded-[8px] bg-surface/50 border border-brand font-mono text-xs text-ink focus:outline-none focus:border-berry focus:bg-paper"
                />
              </div>

              {/* 2. Selling Price */}
              <div>
                <label className="font-label text-[10px] uppercase tracking-wider text-ink/60 font-semibold block mb-1">
                  Selling Price (₹) <span className="text-ink/35 normal-case font-normal">· standard MRP</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="e.g. 1850"
                  className="w-full px-3 py-2 rounded-[8px] bg-surface/50 border border-brand font-mono text-xs text-ink focus:outline-none focus:border-berry focus:bg-paper font-semibold"
                  required
                />
              </div>

              {/* 3. Offer Price */}
              <div>
                <label className="font-label text-[10px] uppercase tracking-wider text-berry font-semibold block mb-1">
                  Offer Price (₹) <span className="text-ink/35 normal-case font-normal">· promotional deal</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="Optional (e.g. 1499)"
                  className="w-full px-3 py-2 rounded-[8px] bg-berry/5 border border-berry/30 font-mono text-xs text-berry font-bold focus:outline-none focus:border-berry focus:bg-paper"
                />
              </div>
            </div>

            {/* Storefront Display Preview Banner */}
            <div className="p-3.5 rounded-[12px] bg-surface/60 border border-brand flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-label text-[9px] uppercase tracking-wider text-ink/40 font-semibold block">
                  Storefront Visual Preview
                </span>
                {offerPrice && Number(offerPrice) > 0 && Number(offerPrice) < Number(sellingPrice) ? (
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-label text-base font-bold text-ink">
                      ₹{Number(offerPrice).toLocaleString("en-IN")}
                    </span>
                    <span className="font-label text-xs text-ink/40 line-through">
                      ₹{Number(sellingPrice).toLocaleString("en-IN")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-berry text-paper font-label text-[8.5px] uppercase font-bold tracking-wider">
                      {Math.round(
                        ((Number(sellingPrice) - Number(offerPrice)) / Number(sellingPrice)) * 100
                      )}
                      % OFF
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-label text-base font-bold text-ink">
                      ₹{Number(sellingPrice || product.price / 100).toLocaleString("en-IN")}
                    </span>
                    <span className="font-label text-[10px] text-ink/40">Standard Catalog Price</span>
                  </div>
                )}
                <p className="font-body text-[10.5px] text-ink/45 mt-1">
                  {offerPrice && Number(offerPrice) > 0 && Number(offerPrice) < Number(sellingPrice)
                    ? "✓ Offer active: Storefront displays Selling Price with strikethrough and Offer Price as the purchase price."
                    : "No active discount: Standard selling price will be displayed."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Audit note for price change"
                  value={pricingNote}
                  onChange={(e) => setPricingNote(e.target.value)}
                  className="px-3 py-1.5 rounded-[8px] bg-paper border border-brand font-body text-xs text-ink w-44 placeholder:text-ink/30"
                />
                <button
                  type="button"
                  disabled={pricingUpdating || !sellingPrice}
                  onClick={handleSavePricing}
                  className="px-4 py-2 rounded-[8px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider font-bold hover:bg-[#580118] transition-all disabled:opacity-40 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {pricingUpdating ? "Saving…" : "Save Pricing & Log History"}
                </button>
              </div>
            </div>
          </div>

          {/* ── 3. PRODUCT STORY, ARTISANSHIP & DETAILS ── */}
          <form onSubmit={handleSaveDetails} className="rounded-[16px] p-5 bg-paper border border-brand shadow-xs space-y-5">
            <div>
              <p className="font-label text-xs uppercase tracking-wider font-bold text-ink flex items-center gap-2">
                <span>✨</span>
                <span>Product Story, Artisanship &amp; Specifications</span>
              </p>
              <p className="font-body text-xs text-ink/50 mt-0.5">
                These fields map directly to the storefront product page tabs (&quot;The Story&quot;, &quot;Artisanship&quot;, and &quot;Shipping &amp; Care&quot;).
              </p>
            </div>

            {/* Basic Info: Name & Tags */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1 font-semibold">
                  Product Name / Title
                </label>
                <input
                  type="text"
                  value={nameStr}
                  onChange={(e) => setNameStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper transition-all font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1 font-semibold">
                  Hashtags / Tags <span className="text-ink/35 normal-case font-normal">· comma-separated</span>
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="#UDAIPUR, #RAJASTHAN, #LEATHER"
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-mono text-xs text-berry bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper transition-all"
                />
              </div>
            </div>

            {/* Artisanship & Origin */}
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1 font-semibold">
                  Origin / Heritage Location <span className="text-ink/35 normal-case font-normal">· shown above title &amp; in Artisanship tab</span>
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Udaipur, Rajasthan"
                  className="w-full px-3.5 py-2 rounded-[10px] font-body text-xs text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper"
                />
              </div>

              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1 font-semibold">
                  Artisan / Studio Name <span className="text-ink/35 normal-case font-normal">· Artisanship tab</span>
                </label>
                <input
                  type="text"
                  value={artisanName}
                  onChange={(e) => setArtisanName(e.target.value)}
                  placeholder="e.g. Master Rameshwar Ji / Studio Potters"
                  className="w-full px-3.5 py-2 rounded-[10px] font-body text-xs text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper"
                />
              </div>
            </div>

            {/* The Story & Curator's Note */}
            <div className="space-y-4 pt-1">
              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1 font-semibold">
                  Curator&apos;s Note Quote <span className="text-ink/35 normal-case font-normal">· displayed in italic callout box under price</span>
                </label>
                <input
                  type="text"
                  value={curatorNote}
                  onChange={(e) => setCuratorNote(e.target.value)}
                  placeholder="e.g. Takes fountain pen ink with zero bleed."
                  className="w-full px-3.5 py-2 rounded-[10px] font-body text-xs text-ink italic bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper"
                />
              </div>

              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1 font-semibold">
                  The Story Narrative <span className="text-ink/35 normal-case font-normal">· displayed under &quot;The Story&quot; tab on product page</span>
                </label>
                <textarea
                  rows={4}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Craft story, generational heritage, materials and background…"
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-xs sm:text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1 font-semibold">
                  Overview / Short Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short product summary…"
                  className="w-full px-3.5 py-2 rounded-[10px] font-body text-xs text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper resize-none"
                />
              </div>
            </div>

            {/* Shipping Specs & Dimensions */}
            <div className="pt-1">
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-2 font-semibold">
                Shipping Specs &amp; Package Dimensions <span className="text-ink/35 normal-case font-normal">· Shipping tab &amp; Shiprocket quotes</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="font-label text-[9px] uppercase tracking-wider text-ink/40 block mb-0.5">Weight (g)</span>
                  <input
                    type="number"
                    min="1"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-1.5 rounded-[8px] font-mono text-xs text-ink bg-surface/50 border border-brand focus:bg-paper"
                  />
                </div>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-wider text-ink/40 block mb-0.5">Length (cm)</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    placeholder="e.g. 18"
                    className="w-full px-3 py-1.5 rounded-[8px] font-mono text-xs text-ink bg-surface/50 border border-brand focus:bg-paper"
                  />
                </div>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-wider text-ink/40 block mb-0.5">Breadth (cm)</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={breadthCm}
                    onChange={(e) => setBreadthCm(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full px-3 py-1.5 rounded-[8px] font-mono text-xs text-ink bg-surface/50 border border-brand focus:bg-paper"
                  />
                </div>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-wider text-ink/40 block mb-0.5">Height (cm)</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-1.5 rounded-[8px] font-mono text-xs text-ink bg-surface/50 border border-brand focus:bg-paper"
                  />
                </div>
              </div>
            </div>

            {/* Product images */}
            <div>
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Product Images{" "}
                <span className="text-ink/35 normal-case font-normal">
                  · first image is the main one · up to {MAX_IMAGES}
                </span>
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
                        <span className="font-label text-[8px] text-paper uppercase tracking-wider font-semibold">
                          Main
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeMain(i)}
                        className="absolute bottom-0 left-0 right-0 bg-ink/70 py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <span className="font-label text-[8px] text-paper uppercase tracking-wider">
                          Set main
                        </span>
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

            <div className="flex items-center justify-between pt-3 border-t border-brand">
              <p className="font-body text-xs text-ink/45">
                All changes reflect immediately across the live storefront catalog and product tabs.
              </p>

              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-ink text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-ink/85 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm cursor-pointer font-semibold"
              >
                {isPending ? "Saving…" : "Save All Details"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── PRICE HISTORY & GRAPH MODAL ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper rounded-[22px] border border-brand p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-brand pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  <h3 className="font-label text-base font-bold text-ink tracking-tight">
                    Price History &amp; Trends — {product.name}
                  </h3>
                </div>
                <p className="font-body text-xs text-ink/65 mt-0.5">
                  Chronological record of Cost Price, Selling Price, and Promotional Offers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-brand/60 flex items-center justify-center text-ink/50 hover:text-ink text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-ink/50 font-body text-xs animate-pulse">
                Loading price history ledger…
              </div>
            ) : (
              <div className="space-y-4">
                {/* SVG Visual Graph */}
                <PriceHistoryChart items={historyList} />

                {/* Audit Ledger Table */}
                <div className="overflow-x-auto max-h-52 rounded-[12px] border border-brand bg-paper">
                  <table className="w-full text-left font-body text-xs divide-y divide-brand">
                    <thead className="bg-surface/70 font-label text-[9.5px] uppercase tracking-wider text-ink/50 sticky top-0">
                      <tr>
                        <th className="px-3.5 py-2">Date &amp; Time</th>
                        <th className="px-3.5 py-2 text-right">Cost Price</th>
                        <th className="px-3.5 py-2 text-right">Selling Price</th>
                        <th className="px-3.5 py-2 text-right">Offer Price</th>
                        <th className="px-3.5 py-2 text-right">Margin</th>
                        <th className="px-3.5 py-2">Audit Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand/50">
                      {historyList.map((row) => {
                        const cost = row.cost_price ? row.cost_price / 100 : null;
                        const reg = row.regular_price / 100;
                        const offer = row.offer_price ? row.offer_price / 100 : null;
                        const activeSelling = offer || reg;
                        const margin = cost
                          ? Math.round(((activeSelling - cost) / activeSelling) * 100)
                          : null;
                        return (
                          <tr key={row.id} className="hover:bg-surface/40 transition-colors">
                            <td className="px-3.5 py-2 font-mono text-[10.5px] text-ink/70 whitespace-nowrap">
                              {new Date(row.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono text-blue-700 whitespace-nowrap">
                              {cost ? `₹${cost.toLocaleString("en-IN")}` : "—"}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono font-medium text-ink whitespace-nowrap">
                              ₹{reg.toLocaleString("en-IN")}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono text-rose-700 font-semibold whitespace-nowrap">
                              {offer ? `₹${offer.toLocaleString("en-IN")}` : "—"}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono whitespace-nowrap">
                              {margin !== null ? (
                                <span
                                  className={
                                    margin >= 40
                                      ? "text-emerald-700 font-semibold"
                                      : "text-amber-700"
                                  }
                                >
                                  {margin}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-3.5 py-2 text-ink/60 text-[11px] max-w-xs truncate">
                              {row.note || "Catalog baseline"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-brand">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-[9px] bg-ink text-paper font-label text-[10px] uppercase tracking-wider font-semibold hover:bg-ink/80 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
