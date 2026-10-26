"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type CustomerAddress,
  type CustomerAddressInput,
  saveCustomerAddressAction,
  deleteCustomerAddressAction,
  setDefaultAddressAction,
} from "@/actions/customer-auth";

interface CustomerAddressManagerProps {
  addresses: CustomerAddress[];
}

export function CustomerAddressManager({ addresses }: CustomerAddressManagerProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [label, setLabel] = useState("Home");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const addressLimitReached = addresses.length >= 3;

  function openAddModal() {
    setEditingAddress(null);
    setLabel("Home");
    setFullName("");
    setPhone("");
    setLine1("");
    setLine2("");
    setCity("");
    setStateName("");
    setPincode("");
    setIsDefault(addresses.length === 0);
    setErrorMsg(null);
    setIsModalOpen(true);
  }

  function openEditModal(addr: CustomerAddress) {
    setEditingAddress(addr);
    setLabel(addr.label);
    setFullName(addr.full_name);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 || "");
    setCity(addr.city);
    setStateName(addr.state);
    setPincode(addr.pincode);
    setIsDefault(addr.is_default);
    setErrorMsg(null);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const input: CustomerAddressInput = {
      id: editingAddress?.id,
      label,
      fullName,
      phone,
      line1,
      line2: line2 || undefined,
      city,
      state: stateName,
      pincode,
      isDefault,
    };

    const res = await saveCustomerAddressAction(input);

    if (!res.success) {
      setErrorMsg(res.error || "Could not save address.");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsModalOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this delivery address?")) return;
    setIsLoading(true);
    await deleteCustomerAddressAction(id);
    setIsLoading(false);
    router.refresh();
  }

  async function handleSetDefault(id: string) {
    setIsLoading(true);
    await setDefaultAddressAction(id);
    setIsLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Limit banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand">
        <div>
          <h2 className="font-hand text-2xl text-ink">Saved Delivery Addresses</h2>
          <p className="font-label text-[10px] text-ink/50 uppercase tracking-wider mt-0.5">
            Store up to 3 verified destinations for swift, 1-click checkout ({addresses.length}/3 saved)
          </p>
        </div>

        <button
          type="button"
          disabled={addressLimitReached || isLoading}
          onClick={openAddModal}
          className={`px-4 py-2.5 rounded-[12px] font-label text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-soft cursor-pointer ${
            addressLimitReached
              ? "bg-surface border border-brand text-ink/40 cursor-not-allowed"
              : "bg-berry text-paper hover:bg-[#580118]"
          }`}
        >
          <span>+</span>
          <span>{addressLimitReached ? "3 of 3 Stored" : "Add New Address"}</span>
        </button>
      </div>

      {/* Address cards list */}
      {addresses.length === 0 ? (
        <div className="py-14 text-center bg-surface/40 rounded-[20px] border border-brand/70 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-paper border border-brand flex items-center justify-center text-lg">
            📍
          </div>
          <p className="font-hand text-xl text-ink">No saved addresses</p>
          <p className="font-body text-xs text-ink/50 max-w-sm mx-auto">
            Save up to 3 addresses (Home, Studio, Office) to autocomplete shipping during your next purchase.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-2 inline-block px-5 py-2 rounded-[10px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider"
          >
            Add First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-paper rounded-[18px] p-5 border flex flex-col justify-between shadow-card relative transition-all ${
                addr.is_default
                  ? "border-berry/60 ring-1 ring-berry/20 bg-berry/[0.015]"
                  : "border-brand"
              }`}
            >
              {/* Header tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-surface border border-brand text-ink font-medium">
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span className="font-label text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-berry text-paper font-medium">
                      Default
                    </span>
                  )}
                </div>

                {/* Recipient Details */}
                <div className="pt-2">
                  <p className="font-body text-sm font-semibold text-ink">{addr.full_name}</p>
                  <p className="font-label text-[11px] text-ink/60 mt-0.5">📞 {addr.phone}</p>
                </div>

                {/* Address lines */}
                <div className="font-body text-xs text-ink/75 leading-relaxed pt-1">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>
                    {addr.city}, {addr.state} — <span className="font-semibold text-ink">{addr.pincode}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-brand/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="font-label text-[10px] uppercase tracking-wider text-ink/60 hover:text-ink cursor-pointer underline underline-offset-4"
                  >
                    Edit
                  </button>
                  <span className="text-ink/20">|</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="font-label text-[10px] uppercase tracking-wider text-red-700/70 hover:text-red-700 cursor-pointer underline underline-offset-4"
                  >
                    Remove
                  </button>
                </div>

                {!addr.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="font-label text-[9px] uppercase tracking-wider px-2 py-1 rounded-[6px] border border-brand hover:border-berry text-ink/70 hover:text-berry transition-colors cursor-pointer"
                  >
                    Set Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-[24px] border border-brand max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-brand pb-3">
              <div>
                <h3 className="font-hand text-2xl text-ink">
                  {editingAddress ? "Edit Delivery Address" : "Add Delivery Address"}
                </h3>
                <p className="font-label text-[9.5px] uppercase tracking-wider text-ink/40 mt-0.5">
                  Addresses are encrypted and only accessible by your account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-brand text-ink/50 hover:text-ink flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] text-xs text-red-700 font-body">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Address Label buttons */}
              <div>
                <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1.5">
                  Address Label
                </label>
                <div className="flex gap-2">
                  {["Home", "Work", "Studio", "Other"].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setLabel(lbl)}
                      className={`px-3 py-1.5 rounded-[8px] font-label text-[10px] uppercase tracking-wider border transition-all ${
                        label === lbl
                          ? "bg-berry text-paper border-berry"
                          : "bg-surface text-ink/70 border-brand hover:border-ink/30"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Recipient name"
                    className="w-full px-3 py-2 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                    Phone (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                  />
                </div>
              </div>

              {/* Street address */}
              <div>
                <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                  Flat, House No., Building, Apartment *
                </label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="e.g. Flat 301, Heritage Court"
                  className="w-full px-3 py-2 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                />
              </div>

              <div>
                <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                  Area, Street, Sector, Landmark
                </label>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="e.g. Near Rose Garden, 12th Main"
                  className="w-full px-3 py-2 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full px-3 py-2 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full px-3 py-2 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] uppercase tracking-wider text-ink/60 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560038"
                    className="w-full px-3 py-2 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                  />
                </div>
              </div>

              {/* Default toggle */}
              <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="accent-berry rounded"
                />
                <span className="font-body text-xs text-ink/80 select-none">
                  Set as default delivery address for future orders
                </span>
              </label>

              {/* Buttons */}
              <div className="pt-4 border-t border-brand flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-[12px] bg-surface border border-brand text-ink font-label text-[10px] uppercase tracking-wider hover:bg-paper cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-[12px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider hover:bg-[#580118] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
