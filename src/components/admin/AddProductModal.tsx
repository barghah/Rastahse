"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createProduct, uploadProductImage } from "@/actions/admin";

interface Props {
  onClose: () => void;
  categories: string[];
}

interface ImagePreview {
  file: File;
  dataUrl: string;
}

const CATEGORY_OPTIONS = [
  "bags",
  "footwear",
  "souvenirs",
  "apparel",
  "jewelry",
  "ceramic",
  "home-decor",
];

export function AddProductModal({ onClose, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0] ?? CATEGORY_OPTIONS[0]);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [unitCost, setUnitCost] = useState("");
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [curatorNote, setCuratorNote] = useState("");
  const [origin, setOrigin] = useState("");
  const [artisanName, setArtisanName] = useState("");
  const [weightGrams, setWeightGrams] = useState("500");
  const [lengthCm, setLengthCm] = useState("18");
  const [breadthCm, setBreadthCm] = useState("14");
  const [heightCm, setHeightCm] = useState("10");
  const [tags, setTags] = useState("");

  // Image state
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Image Handling ──────────────────────────────────────────────────────────

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const imageFiles = arr.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setErrorMsg("Please select valid image files (JPG, PNG, WebP).");
      return;
    }
    const remaining = 5 - images.length;
    const toAdd = imageFiles.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [
          ...prev,
          { file, dataUrl: e.target?.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const priceNum = parseFloat(price);
    if (!title.trim()) { setErrorMsg("Product title is required."); return; }
    if (!sku.trim()) { setErrorMsg("Product SKU / Code is required."); return; }
    if (!price || isNaN(priceNum) || priceNum < 0) { setErrorMsg("Please enter a valid price."); return; }

    startTransition(async () => {
      const imageUrls: string[] = [];

      if (images.length > 0) {
        setUploadProgress("Uploading images…");
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          setUploadProgress(`Uploading image ${i + 1} of ${images.length}…`);

          const formData = new FormData();
          formData.append("file", img.file);
          formData.append("sku", sku.trim());

          const uploadRes = await uploadProductImage(formData);
          if (uploadRes.success && uploadRes.url) {
            imageUrls.push(uploadRes.url);
          } else {
            setErrorMsg(uploadRes.error ?? "Image upload failed.");
            setUploadProgress(null);
            return;
          }
        }
        setUploadProgress(null);
      }

      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t}`));

      const res = await createProduct({
        sku: sku.trim(),
        title: title.trim(),
        category,
        price: Math.round(priceNum * 100), // store as paise
        stock: parseInt(stock, 10) || 0,
        unitCost: parseFloat(unitCost) || 0,
        description: description.trim(),
        story: story.trim() || description.trim(),
        curatorNote: curatorNote.trim() || undefined,
        origin: origin.trim() || undefined,
        artisanName: artisanName.trim() || undefined,
        weightGrams: weightGrams ? parseInt(weightGrams, 10) : undefined,
        lengthCm: lengthCm ? parseFloat(lengthCm) : undefined,
        breadthCm: breadthCm ? parseFloat(breadthCm) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        tags: tagList,
        imageUrls,
      });

      if (!res.success) {
        setErrorMsg(res.error ?? "Failed to create product.");
      } else {
        setSuccessMsg(`"${title}" added to catalog!`);
        router.refresh();
        setTimeout(onClose, 1500);
      }
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-10 overflow-y-auto">
        <div
          className="relative w-full max-w-2xl bg-paper rounded-[24px] border border-brand shadow-xl mb-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-brand">
            <div>
              <h2 className="font-label text-lg font-semibold text-ink tracking-tight">
                Add New Product
              </h2>
              <p className="font-body text-xs text-ink/45 mt-0.5">
                Create a new listing in the Rastah catalog
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface text-ink/50 hover:text-ink transition-colors cursor-pointer text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* SKU + Title row */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                  Product Code / SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. RST-BAG-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-mono text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all tracking-wider"
                />
              </div>

              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handwoven Koodai Bag"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
                />
              </div>
            </div>

            {/* Category + Price + Stock row */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-label text-[11.5px] uppercase tracking-wider text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper transition-all capitalize cursor-pointer font-medium"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50 text-sm font-medium">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                  Stock Count
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
                />
              </div>

              {(parseInt(stock, 10) || 0) > 0 && (
                <div className="sm:col-span-3">
                  <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                    Unit Cost (₹) <span className="text-ink/35 normal-case font-normal">— recorded as an inventory purchase in the ledger</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 450"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Origin & Artisan Name */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                  Origin / Heritage Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Udaipur, Rajasthan"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
                />
              </div>

              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                  Artisan / Studio Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Rameshwar Ji"
                  value={artisanName}
                  onChange={(e) => setArtisanName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
                />
              </div>
            </div>

            {/* Curator Note */}
            <div>
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Curator&apos;s Note <span className="text-ink/35 normal-case font-normal">· callout quote under price</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Takes fountain pen ink with zero bleed."
                value={curatorNote}
                onChange={(e) => setCuratorNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink italic bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
              />
            </div>

            {/* Story & Description */}
            <div className="space-y-4">
              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                  The Story Narrative <span className="text-ink/35 normal-case font-normal">· &quot;The Story&quot; tab on product page</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Generational heritage, materials, backstory…"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all resize-none"
                />
              </div>

              <div>
                <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Overview summary…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all resize-none"
                />
              </div>
            </div>

            {/* Shipping Specs & Dimensions */}
            <div>
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Shipping Specs (Weight &amp; Dimensions)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="font-label text-[9px] uppercase tracking-wider text-ink/40 block mb-0.5">Weight (g)</span>
                  <input
                    type="number"
                    min="1"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-1.5 rounded-[8px] font-mono text-xs text-ink bg-surface/50 border border-brand"
                  />
                </div>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-wider text-ink/40 block mb-0.5">L (cm)</span>
                  <input
                    type="number"
                    min="1"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    placeholder="18"
                    className="w-full px-3 py-1.5 rounded-[8px] font-mono text-xs text-ink bg-surface/50 border border-brand"
                  />
                </div>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-wider text-ink/40 block mb-0.5">B (cm)</span>
                  <input
                    type="number"
                    min="1"
                    value={breadthCm}
                    onChange={(e) => setBreadthCm(e.target.value)}
                    placeholder="14"
                    className="w-full px-3 py-1.5 rounded-[8px] font-mono text-xs text-ink bg-surface/50 border border-brand"
                  />
                </div>
                <div>
                  <span className="font-label text-[9px] uppercase tracking-wider text-ink/40 block mb-0.5">H (cm)</span>
                  <input
                    type="number"
                    min="1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-1.5 rounded-[8px] font-mono text-xs text-ink bg-surface/50 border border-brand"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Tags <span className="text-ink/35 normal-case font-normal">· comma separated</span>
              </label>
              <input
                type="text"
                placeholder="handmade, woven, natural"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Product Images <span className="text-ink/35 normal-case font-normal">· up to 5 images</span>
              </label>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-[14px] p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-berry bg-berry/5"
                    : "border-brand hover:border-ink/30 hover:bg-surface/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">{isDragging ? "📂" : "🖼️"}</span>
                  <p className="font-body text-xs text-ink/50">
                    {isDragging ? "Drop images here" : "Drag & drop or click to browse"}
                  </p>
                  {images.length > 0 && (
                    <span className="font-label text-[10px] text-berry uppercase tracking-wider font-semibold">
                      {images.length} / 5 selected
                    </span>
                  )}
                </div>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-20 rounded-[10px] overflow-hidden border border-brand bg-surface group"
                    >
                      <Image
                        src={img.dataUrl}
                        alt={`Preview ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                      {i === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-berry/80 py-0.5 text-center">
                          <span className="font-label text-[8px] text-paper uppercase tracking-wider">
                            Main
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-paper rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-[10px] border-2 border-dashed border-brand hover:border-ink/30 bg-surface/30 hover:bg-surface flex items-center justify-center text-ink/30 hover:text-ink/60 transition-all cursor-pointer text-xl"
                    >
                      +
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Upload progress */}
            {uploadProgress && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-berry/10 border border-berry/20">
                <span className="text-xs animate-pulse">⏳</span>
                <span className="font-body text-xs text-berry font-medium">{uploadProgress}</span>
              </div>
            )}

            {/* Feedback */}
            {errorMsg && (
              <div className="px-4 py-2.5 rounded-[10px] bg-red-50 border border-red-200 flex items-center justify-between">
                <span className="font-body text-xs text-red-700">{errorMsg}</span>
                <button type="button" onClick={() => setErrorMsg(null)} className="text-xs text-red-400 hover:text-red-700 cursor-pointer ml-3">✕</button>
              </div>
            )}

            {successMsg && (
              <div className="px-4 py-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200">
                <span className="font-body text-xs text-emerald-700">✓ {successMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-brand">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-[10px] font-label text-[10.5px] uppercase tracking-wider text-ink/60 hover:text-ink bg-surface hover:bg-surface/80 border border-brand transition-all cursor-pointer font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isPending || !title.trim() || !sku.trim() || !price}
                className="px-7 py-2.5 bg-berry text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm cursor-pointer font-semibold"
              >
                {isPending ? (uploadProgress ?? "Creating…") : "✚ Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
