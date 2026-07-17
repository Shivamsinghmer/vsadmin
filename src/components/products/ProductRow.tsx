"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Edit3, Trash2,
  CheckCircle2, XCircle, Save, X, Plus,
  Layers, Box, Settings2, Info, Ruler,
} from "lucide-react";

interface PricingRow {
  _id?: string;
  diameter?: string;
  length?: string;
  material?: string;
  size?: string;
  price: number;
}

interface VariantOptions {
  diameters: string[];
  lengths: string[];
  materials: string[];
  sizes: string[];
}

interface ProductRowProps {
  product: {
    _id: string;
    name?: string;
    description?: string;
    images?: string[];
    price?: number;
    inStock?: boolean;
    onSale?: boolean;
    bestSeller?: boolean;
    newArrival?: boolean;
    categoryLabel?: string;
    unit?: string;
    isVariantProduct?: boolean;
    variantOptions?: VariantOptions;
    pricingData?: PricingRow[];
  };
}

function Badge({ active, label, activeColor }: { active: boolean; label: string; activeColor: string }) {
  return active ? (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${activeColor}`}>
      <CheckCircle2 className="h-2.5 w-2.5" /> {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset bg-slate-50 text-slate-400 ring-slate-200">
      <XCircle className="h-2.5 w-2.5" /> {label}
    </span>
  );
}

function TagEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (vals: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };

  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 rounded-lg text-[11px] font-medium"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-blue-400 hover:text-red-500"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Type then Enter or +"
          className="flex-1 p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400"
        />
        <button
          type="button"
          onClick={add}
          className="px-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function ProductRow({ product }: ProductRowProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [inStock, setInStock] = useState(product.inStock ?? true);
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [edit, setEdit] = useState({
    name: product.name || "",
    price: product.price || 0,
    description: product.description || "",
    unit: product.unit || "piece",
    onSale: product.onSale || false,
    bestSeller: product.bestSeller || false,
    newArrival: product.newArrival || false,
    inStock: product.inStock ?? true,
    isVariantProduct: product.isVariantProduct ?? false,
    variantOptions: product.variantOptions ?? { diameters: [], lengths: [], materials: [], sizes: [] },
    pricingData: product.pricingData ?? [],
  });

  const isOpen = expanded || isEditing;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const closeModal = () => {
    setExpanded(false);
    setIsEditing(false);
  };

  const setVO = (key: keyof VariantOptions, vals: string[]) =>
    setEdit((prev) => ({ ...prev, variantOptions: { ...prev.variantOptions, [key]: vals } }));

  const addPriceRow = () =>
    setEdit((prev) => ({
      ...prev,
      pricingData: [...prev.pricingData, { diameter: "", length: "", material: "", size: "", price: 0 }],
    }));

  const updateRow = (idx: number, field: keyof PricingRow, value: string | number) => {
    const rows = [...edit.pricingData];
    (rows[idx] as any)[field] = value;
    setEdit((prev) => ({ ...prev, pricingData: rows }));
  };

  const removeRow = (idx: number) =>
    setEdit((prev) => ({ ...prev, pricingData: prev.pricingData.filter((_, i) => i !== idx) }));

  const handleToggleStock = async () => {
    const next = !inStock;
    setInStock(next);
    await fetch(`/api/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inStock: next }),
    });
    startTransition(() => router.refresh());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit),
      });
      const data = await res.json();
      if (data.ok) {
        setInStock(edit.inStock);
        closeModal();
        startTransition(() => router.refresh());
      } else {
        alert("Error: " + (data.error || "Failed to save product"));
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await fetch(`/api/products/${product._id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  const useDia = edit.variantOptions.diameters.length > 0;
  const useLen = edit.variantOptions.lengths.length > 0;
  const useMat = edit.variantOptions.materials.length > 0;
  const useSz  = edit.variantOptions.sizes.length > 0;

  const rdDia = (product.variantOptions?.diameters.length ?? 0) > 0;
  const rdLen = (product.variantOptions?.lengths.length ?? 0) > 0;
  const rdMat = (product.variantOptions?.materials.length ?? 0) > 0;
  const rdSz  = (product.variantOptions?.sizes.length ?? 0) > 0;

  return (
    <>
      <tr
        onClick={() => { if (!isOpen) { setIsEditing(false); setExpanded(true); } }}
        className={`border-b border-slate-50 transition-colors cursor-pointer ${
          isOpen ? "bg-blue-50/15" : "hover:bg-slate-50/60"
        }`}
      >
        {/* Name */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-slate-100 bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {product.images?.[0]
                ? <img src={product.images[0]} className="h-full w-full object-cover" alt="" />
                : <Box className="h-5 w-5 text-slate-300" />}
            </div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight text-sm">{product.name}</p>
              {product.isVariantProduct && (
                <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                  <Layers className="h-2.5 w-2.5" /> Variable pricing
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Category */}
        <td className="px-6 py-4">
          <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[11px] font-medium text-slate-600 border border-slate-200">
            {product.categoryLabel || "—"}
          </span>
        </td>

        {/* Price */}
        <td className="px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">₹{Number(product.price || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-slate-400">per {product.unit || "piece"}</p>
          </div>
        </td>

        {/* Stock */}
        <td className="px-6 py-4">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStock(); }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ring-inset transition-all ${
              inStock
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-red-50 text-red-700 ring-red-200"
            }`}
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </button>
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); setExpanded(true); }}
              className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {isOpen && createPortal(
        <div
          onClick={closeModal}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl border border-slate-100 bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {product.images?.[0]
                    ? <img src={product.images[0]} className="h-full w-full object-cover" alt="" />
                    : <Box className="h-4 w-4 text-slate-300" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">{isEditing ? edit.name : product.name}</h3>
                  {product.isVariantProduct && (
                    <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                      <Layers className="h-2.5 w-2.5" /> Variable pricing
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">

                {/* LEFT: General Info */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Images */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                      <Box className="h-3 w-3 text-slate-400" /> Photos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(product.images ?? []).map((src, i) => (
                        <div
                          key={i}
                          className="h-20 w-20 rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white hover:scale-105 transition-transform"
                        >
                          <img src={src} className="h-full w-full object-cover" />
                        </div>
                      ))}
                      {(product.images ?? []).length === 0 && (
                        <div className="h-20 w-full rounded-xl border-2 border-dashed border-slate-200 text-slate-400 flex items-center justify-center text-xs">
                          No images uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                      <Info className="h-3 w-3 text-slate-400" /> Description
                    </h4>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={edit.description}
                        onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                        className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white"
                      />
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed">{product.description || "—"}</p>
                    )}
                  </div>

                  {/* Flags & Unit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-500 mb-2">Unit / SKU</p>
                      {isEditing ? (
                        <input
                          value={edit.unit}
                          onChange={(e) => setEdit({ ...edit, unit: e.target.value })}
                          className="text-sm font-semibold w-full bg-white rounded-lg p-1.5 border border-slate-200 outline-none focus:border-blue-400"
                          placeholder="e.g. 100 pcs"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-800">per {product.unit || "piece"}</p>
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1.5 items-start">
                      {isEditing ? (
                        <>
                          {(["newArrival", "bestSeller", "onSale"] as const).map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setEdit({ ...edit, [f]: !edit[f] })}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ring-1 ring-inset transition-all ${
                                edit[f]
                                  ? "bg-blue-50 ring-blue-200 text-blue-600"
                                  : "bg-white ring-slate-200 text-slate-400"
                              }`}
                            >
                              {f === "newArrival" ? "New" : f === "bestSeller" ? "Best" : "Sale"}
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          <Badge active={product.newArrival ?? false}  label="New"  activeColor="bg-blue-50 text-blue-700 ring-blue-200" />
                          <Badge active={product.bestSeller ?? false}  label="Best" activeColor="bg-amber-50 text-amber-700 ring-amber-200" />
                          <Badge active={product.onSale ?? false}      label="Sale" activeColor="bg-rose-50 text-rose-700 ring-rose-200" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Base price (edit mode) */}
                  {isEditing && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-500 mb-2">Base Price (₹)</p>
                      <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2 bg-white w-full">
                        <span className="text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          value={edit.price}
                          onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })}
                          className="p-1.5 text-sm font-semibold outline-none w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Toggle Variant Product */}
                  {isEditing && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Variable Pricing</p>
                        <p className="text-xs text-slate-500 mt-0.5">Enable DIA × LEN × GRADE pricing matrix</p>
                      </div>
                      <div
                        className={`toggle-track${edit.isVariantProduct ? " on" : ""}`}
                        onClick={() => setEdit({ ...edit, isVariantProduct: !edit.isVariantProduct })}
                      >
                        <span className="toggle-thumb" />
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: Pricing Matrix */}
                <div className="xl:col-span-3 space-y-6">
                  {(product.isVariantProduct || edit.isVariantProduct) ? (
                    <>
                      {isEditing && (
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-5">
                          <TagEditor label="Diameters (DIA, optional)" values={edit.variantOptions.diameters} onChange={(v) => setVO("diameters", v)} />
                          <TagEditor label="Lengths (LEN)" values={edit.variantOptions.lengths} onChange={(v) => setVO("lengths", v)} />
                          <TagEditor label="Material Grades" values={edit.variantOptions.materials} onChange={(v) => setVO("materials", v)} />
                          <TagEditor label="Sizes (optional)" values={edit.variantOptions.sizes} onChange={(v) => setVO("sizes", v)} />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                            <Settings2 className="h-3 w-3 text-slate-400" /> Pricing Matrix (DIA × LEN × Grade)
                          </h4>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={addPriceRow}
                              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-blue-600 flex items-center gap-1 transition-all shadow-sm"
                            >
                              <Plus className="h-3 w-3" /> Add Row
                            </button>
                          )}
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                  {(isEditing ? useDia : rdDia) && <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">DIA</th>}
                                  {(isEditing ? useLen : rdLen) && <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Length</th>}
                                  {(isEditing ? useMat : rdMat) && <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Grade</th>}
                                  {(isEditing ? useSz  : rdSz)  && <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Size</th>}
                                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Price ₹</th>
                                  {isEditing && <th className="px-4 py-2.5 w-8"></th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {(isEditing ? edit.pricingData : (product.pricingData ?? [])).map((row, idx) =>
                                  isEditing ? (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      {useDia && <td className="px-3 py-2">
                                        <select
                                          value={row.diameter || ""}
                                          onChange={(e) => updateRow(idx, "diameter", e.target.value)}
                                          className="w-full p-1 bg-slate-50 border border-slate-200 rounded outline-none text-xs font-medium"
                                        >
                                          <option value="">—</option>
                                          {edit.variantOptions.diameters.map((d) => <option key={d}>{d}</option>)}
                                        </select>
                                      </td>}
                                      {useLen && <td className="px-3 py-2">
                                        <select
                                          value={row.length || ""}
                                          onChange={(e) => updateRow(idx, "length", e.target.value)}
                                          className="w-full p-1 bg-slate-50 border border-slate-200 rounded outline-none text-xs font-medium"
                                        >
                                          <option value="">—</option>
                                          {edit.variantOptions.lengths.map((l) => <option key={l}>{l}</option>)}
                                        </select>
                                      </td>}
                                      {useMat && <td className="px-3 py-2">
                                        <select
                                          value={row.material || ""}
                                          onChange={(e) => updateRow(idx, "material", e.target.value)}
                                          className="w-full p-1 bg-slate-50 border border-slate-200 rounded outline-none text-xs font-medium"
                                        >
                                          <option value="">—</option>
                                          {edit.variantOptions.materials.map((m) => <option key={m}>{m}</option>)}
                                        </select>
                                      </td>}
                                      {useSz && <td className="px-3 py-2">
                                        <select
                                          value={row.size || ""}
                                          onChange={(e) => updateRow(idx, "size", e.target.value)}
                                          className="w-full p-1 bg-slate-50 border border-slate-200 rounded outline-none text-xs font-medium"
                                        >
                                          <option value="">—</option>
                                          {edit.variantOptions.sizes.map((s) => <option key={s}>{s}</option>)}
                                        </select>
                                      </td>}
                                      <td className="px-3 py-2">
                                        <input
                                          type="number"
                                          value={row.price}
                                          onChange={(e) => updateRow(idx, "price", Number(e.target.value))}
                                          className="w-full p-1 text-right font-semibold border border-slate-200 rounded bg-slate-50 outline-none focus:bg-white text-xs"
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <button
                                          onClick={() => removeRow(idx)}
                                          className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ) : (
                                    <tr key={idx} className="hover:bg-slate-50/40">
                                      {rdDia && <td className="px-4 py-2.5 font-semibold text-slate-700 text-sm">{row.diameter || "—"}</td>}
                                      {rdLen && <td className="px-4 py-2.5 text-slate-600 text-sm">{row.length || "—"}</td>}
                                      {rdMat && <td className="px-4 py-2.5">
                                        {row.material
                                          ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium text-[11px] ring-1 ring-inset ring-blue-200">AISI {row.material}</span>
                                          : <span className="text-slate-300">—</span>}
                                      </td>}
                                      {rdSz  && <td className="px-4 py-2.5 text-slate-600 text-sm">{row.size || "—"}</td>}
                                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900 text-sm">₹{Number(row.price || 0).toLocaleString("en-IN")}</td>
                                    </tr>
                                  )
                                )}
                                {(isEditing ? edit.pricingData : (product.pricingData ?? [])).length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">
                                      No pricing rows yet. Click Add Row to start.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-3">
                      <Ruler className="h-10 w-10 text-slate-200" />
                      <p className="text-sm font-semibold text-slate-400">Simple product</p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Fixed price of{" "}
                        <strong className="text-slate-600">₹{Number(product.price || 0).toLocaleString("en-IN")}</strong>{" "}
                        per {product.unit || "piece"}.
                      </p>
                      {isEditing && (
                        <p className="text-xs text-blue-500">Enable Variable Pricing (toggle left) to add a DIA × LEN × Grade matrix.</p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
