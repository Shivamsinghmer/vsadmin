"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Folder, Edit3, Trash2, Save, X } from "lucide-react";

interface CategoryCardProps {
  category: {
    _id: string;
    label?: string;
    name?: string;
    description?: string;
    productCount?: number;
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.label ?? category.name ?? "");
  const [description, setDescription] = useState(category.description ?? "");
  const [saving, setSaving] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete category "${label}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/categories/${category._id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/categories/${category._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, description }),
    });
    setSaving(false);
    setEditing(false);
    startTransition(() => router.refresh());
  };

  if (deleting) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      {editing ? (
        <div className="flex flex-col gap-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            placeholder="Category name"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
            placeholder="Description"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Folder className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-sm">{label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {category.productCount ?? 0} product{(category.productCount ?? 0) !== 1 ? "s" : ""}
            </p>
            {description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{description}</p>
            )}
          </div>
          <div className="flex gap-1 ml-auto flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
