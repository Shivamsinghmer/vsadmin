"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Star, Edit3, Save, X } from "lucide-react";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { useToast } from "@/components/ui/Toast";

interface TestimonialType {
  _id: string;
  name: string;
  role?: string;
  company?: string;
  quote: string;
  rating?: number;
  image?: string;
}

export function TestimonialRow({ testimonial }: { testimonial: TestimonialType }) {
  const router = useRouter();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [editData, setEditData] = useState({
    name: testimonial.name || "",
    role: testimonial.role || "",
    company: testimonial.company || "",
    quote: testimonial.quote || "",
    rating: testimonial.rating ?? 5,
    image: testimonial.image || "",
  });

  useEffect(() => {
    if (isEditing) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isEditing]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    setIsDeleting(true);
    await fetch(`/api/testimonials/${testimonial._id}`, { method: "DELETE" });
    toast(`Testimonial from ${testimonial.name} deleted`, "success");
    startTransition(() => router.refresh());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/testimonials/${testimonial._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (data.ok) {
        setIsEditing(false);
        toast("Testimonial updated", "success");
        startTransition(() => router.refresh());
      } else {
        toast("Failed to save testimonial", "error");
      }
    } catch {
      toast("An error occurred.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (isDeleting) return null;

  const roleDisplay = [testimonial.role, testimonial.company].filter(Boolean).join(", ");

  return (
    <>
      <div className="p-6 flex flex-col md:flex-row gap-5 items-start hover:bg-slate-50/60 transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
          {testimonial.image ? (
            <img src={testimonial.image} alt={testimonial.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-blue-700 text-xs font-semibold">
              {testimonial.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">{testimonial.name}</h3>
              {roleDisplay && (
                <p className="text-xs text-slate-500 mt-0.5">{roleDisplay}</p>
              )}
            </div>
            <div className="flex gap-0.5 text-amber-400 flex-shrink-0">
              {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
              ))}
            </div>
          </div>

          {testimonial.quote ? (
            <p className="text-sm text-slate-600 leading-relaxed italic">
              "{testimonial.quote}"
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">No content — click Edit to add a review.</p>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0 self-start md:self-auto">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditing && (
        <div
          onClick={() => setIsEditing(false)}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-bold text-slate-900">Edit Testimonial</h3>
              <div className="flex items-center gap-2">
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
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer Name *</label>
                  <input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                  <input
                    value={editData.role}
                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                    placeholder="e.g. Technical Lead"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
                <input
                  value={editData.company}
                  onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                  placeholder="e.g. Mehta Solar Solutions"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditData({ ...editData, rating: n })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          n <= editData.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 fill-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-slate-500 ml-1">{editData.rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Review *</label>
                <textarea
                  rows={4}
                  value={editData.quote}
                  onChange={(e) => setEditData({ ...editData, quote: e.target.value })}
                  placeholder="Amazing product! Highly recommended…"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all resize-none"
                />
              </div>

              <ImageUploadField
                label="Customer Photo"
                value={editData.image}
                onChange={(url) => setEditData({ ...editData, image: url })}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
