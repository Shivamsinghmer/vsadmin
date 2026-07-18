"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function AddCategory() {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    label: "",
    name: "", // Usually the same as label, or slug
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label) return alert("Please enter a category name.");

    setSaving(true);
    try {
      const slug = (formData.name || formData.label)
        .toLowerCase()
        .trim()
        .replace(/[&]/g, "and")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          name: formData.name || formData.label,
          href: `/categories/${slug}`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsOpen(false);
        setFormData({ label: "", name: "", description: "" });
        toast(`Category "${formData.label}" created`, "success");
        startTransition(() => router.refresh());
      } else {
        toast(data.error || "Failed to create category", "error");
      }
    } catch (error) {
      console.error("Failed to add category:", error);
      toast("An unexpected error occurred. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Add Category
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 my-4 sm:my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">New Category</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. Vegetables, Electronics"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Slug / Identifier</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. vegetables or fruit"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Briefly describe what goes in this category..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  {saving ? "Creating..." : <><Save className="h-4 w-4" /> Save Category</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
