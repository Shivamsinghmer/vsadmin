"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, Star } from "lucide-react";
import { ImageUploadField } from "@/components/ui/ImageUploadField";

export function CreateTestimonial() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    company: "",
    quote: "",
    rating: 5,
    image: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.quote) return alert("Please enter name and review.");

    setSaving(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.ok) {
        setIsOpen(false);
        setFormData({ name: "", role: "", company: "", quote: "", rating: 5, image: "" });
        startTransition(() => router.refresh());
      }
    } catch (error) {
      console.error("Failed to add testimonial:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Add Testimonial
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-900">New Testimonial</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                  <input
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Technical Lead"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
                <input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Mehta Solar Solutions"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: n })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          n <= formData.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 fill-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-slate-500 ml-1">{formData.rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Review *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  placeholder="Amazing product! Highly recommended…"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all resize-none"
                />
              </div>

              <ImageUploadField
                label="Customer Photo"
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
              />

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {saving ? "Saving…" : <><Save className="h-4 w-4" /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
