"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Edit3, Trash2, ChevronDown, ChevronUp, Clock, User, Save, X } from "lucide-react";

interface BlogRowProps {
  blog: {
    _id: string;
    title?: string;
    shortDescription?: string;
    longDescription?: string;
    image?: string;
    author?: string;
    readTime?: string;
    createdAt?: string;
    date?: string;
    href?: string;
  };
}

export function BlogRow({ blog }: BlogRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState({
    title: blog.title || "",
    shortDescription: blog.shortDescription || "",
    longDescription: blog.longDescription || "",
    author: blog.author || "Admin",
    readTime: blog.readTime || "",
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

  const handleDelete = async () => {
    if (!confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/blogs/${blog._id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/blogs/${blog._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      closeModal();
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to save blog:", error);
    } finally {
      setSaving(false);
    }
  };

  if (deleting) return null;

  const displayDate = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : blog.date ?? "—";

  return (
    <>
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 hover:bg-slate-50/70 transition-colors ${
          isOpen ? "bg-blue-50/20" : ""
        }`}
      >
        {/* Thumbnail */}
        <div className="h-16 w-24 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden hidden sm:block border border-slate-200">
          {blog.image ? (
            <img src={blog.image} alt={blog.title} className="h-16 w-24 object-cover" />
          ) : (
            <div className="h-16 w-24 bg-slate-100" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-medium text-blue-600">{blog.author ?? "Admin"}</span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {displayDate}
            </span>
            {blog.readTime && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {blog.readTime}
                </span>
              </>
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900 tracking-tight line-clamp-1">
            {blog.title}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-1 mt-0.5">{blog.shortDescription ?? ""}</p>
        </div>

        <div className="flex gap-1.5 mt-4 sm:mt-0 ml-auto flex-shrink-0">
          <button
            onClick={() => { setIsEditing(false); setExpanded((p) => !p); }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={isOpen ? "Close" : "View details"}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { setIsEditing(true); setExpanded(true); }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          onClick={closeModal}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                {isEditing ? (
                  <input
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="text-base font-bold text-slate-900 w-full outline-none border-b border-slate-200 focus:border-blue-400 bg-transparent pb-0.5"
                    placeholder="Blog title…"
                  />
                ) : (
                  <h3 className="font-bold text-slate-900 truncate">{blog.title}</h3>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-medium text-blue-600">{isEditing ? editData.author : (blog.author ?? "Admin")}</span>
                  <span className="text-slate-300">·</span>
                  <span>{displayDate}</span>
                  {(blog.readTime || isEditing) && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{isEditing ? editData.readTime || "—" : blog.readTime}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cover image */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-slate-600">Cover Image</h4>
                  {blog.image ? (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full rounded-xl object-cover border border-slate-200 max-h-48 shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-32 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm border border-slate-200">
                      No image
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="md:col-span-2 space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Author</label>
                          <input
                            value={editData.author}
                            onChange={(e) => setEditData({ ...editData, author: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:bg-white"
                            placeholder="Author name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Read Time</label>
                          <input
                            value={editData.readTime}
                            onChange={(e) => setEditData({ ...editData, readTime: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:bg-white"
                            placeholder="5 min read"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Short Description</label>
                        <input
                          value={editData.shortDescription}
                          onChange={(e) => setEditData({ ...editData, shortDescription: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:bg-white"
                          placeholder="Brief summary shown in listings…"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Full Content</label>
                        <textarea
                          value={editData.longDescription}
                          onChange={(e) => setEditData({ ...editData, longDescription: e.target.value })}
                          rows={8}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white whitespace-pre-line resize-none"
                          placeholder="Write the full blog post content here…"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {blog.author ?? "Admin"}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {displayDate}</span>
                        {blog.readTime && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {blog.readTime}</span>
                        )}
                      </div>

                      {blog.shortDescription && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-600 mb-1">Summary</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{blog.shortDescription}</p>
                        </div>
                      )}

                      {blog.longDescription && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-600 mb-1">Full Content</h4>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                            {blog.longDescription}
                          </p>
                        </div>
                      )}

                      {!blog.shortDescription && !blog.longDescription && (
                        <p className="text-sm text-slate-400 italic">No content yet.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
