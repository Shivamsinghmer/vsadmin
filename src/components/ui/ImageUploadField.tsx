"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  optional?: boolean;
}

export function ImageUploadField({ value, onChange, label = "Image", optional = true }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok) {
        onChange(data.url);
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div>
      {/* Label + mode toggle */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-700">
          {label}
          {optional && <span className="text-slate-400 font-normal text-xs ml-1">(optional)</span>}
        </label>
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              mode === "upload" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              mode === "url" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {/* Current image preview */}
      {value && (
        <div className="relative mb-2.5 inline-flex">
          <img src={value} alt="Preview" className="h-16 w-16 rounded-xl object-cover border border-slate-200" />
          <button
            type="button"
            onClick={() => { onChange(""); setUrlInput(""); }}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" ? (
        <>
          <input
            type="file"
            accept="image/*"
            ref={inputRef}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.target.value = "";
            }}
          />
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
              isDragging
                ? "border-blue-400 bg-blue-50/50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
            } ${isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <p className="text-xs text-blue-600 font-medium">Uploading…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="h-5 w-5 text-slate-400" />
                <p className="text-xs font-medium text-slate-600">
                  {value ? "Replace image" : "Drop image here or click to browse"}
                </p>
                <p className="text-[11px] text-slate-400">PNG, JPG, WebP</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* URL mode */
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (urlInput.trim()) onChange(urlInput.trim());
              }
            }}
            placeholder="https://…"
            className="flex-1 bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => { if (urlInput.trim()) onChange(urlInput.trim()); }}
            className="px-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all"
          >
            Set
          </button>
        </div>
      )}
    </div>
  );
}
