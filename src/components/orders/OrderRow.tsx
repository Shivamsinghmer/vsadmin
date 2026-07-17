"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, ChevronDown, ChevronUp, Package, Upload, FileText, Loader2, Check, X } from "lucide-react";

function StatusPopup({
  value,
  options,
  colors,
  onChange,
  disabled,
}: {
  value: string;
  options: readonly string[];
  colors: Record<string, string>;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (popupRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const cls = colors[value] ?? "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={disabled}
        className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ring-1 ring-inset cursor-pointer transition-opacity ${cls} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {value}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {open && (
        <div
          ref={popupRef}
          className="fixed z-[600] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: pos.top, left: pos.left }}
        >
          {options.map((opt) => {
            const optCls = colors[opt] ?? "bg-slate-50 text-slate-700 ring-slate-200";
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
              >
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${optCls}`}>
                  {opt}
                </span>
                {opt === value && <Check className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

const STATUS_OPTIONS = ["Processing", "Shipped", "Delivered", "Cancelled", "Pending"] as const;

const statusColors: Record<string, string> = {
  Processing: "bg-blue-50 text-blue-700 ring-blue-200",
  Shipped:    "bg-violet-50 text-violet-700 ring-violet-200",
  Delivered:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelled:  "bg-red-50 text-red-700 ring-red-200",
  Pending:    "bg-amber-50 text-amber-700 ring-amber-200",
};

interface OrderItem {
  name?: string;
  price?: number;
  quantity?: number;
  images?: string[];
}

interface ShippingAddress {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  gstno?: string;
}

interface OrderRowProps {
  order: {
    _id: string;
    shippingAddress?: ShippingAddress;
    email?: string;
    createdAt?: string;
    status?: string;
    totalAmount?: number;
    subtotal?: number;
    shippingCharges?: number;
    transactionId?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    gstno?: string;
    invoicePdf?: string;
    items?: OrderItem[];
  };
}

export function OrderRow({ order }: OrderRowProps) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status ?? "Processing");
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [expanded]);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await fetch(`/api/orders/${order._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    startTransition(() => router.refresh());
  };

  const handleInvoiceUpdate = async (url: string) => {
    await fetch(`/api/orders/${order._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoicePdf: url }),
    });
    startTransition(() => router.refresh());
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    await fetch(`/api/orders/${order._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: newStatus }),
    });
    startTransition(() => router.refresh());
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes("pdf")) {
      alert("Please upload only PDF files.");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/orders/${order._id}/invoice`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        startTransition(() => router.refresh());
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during upload.");
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
    if (file) handleFileUpload(file);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/orders/${order._id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  return (
    <>
      <tr
        className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
          deleting ? "opacity-40 pointer-events-none" : ""
        } ${expanded ? "bg-blue-50/20" : ""}`}
      >
        <td className="px-6 py-3.5 font-semibold text-slate-800 text-sm">
          #{order._id.slice(-8).toUpperCase()}
        </td>
        <td className="px-6 py-3.5 text-slate-600 text-sm">{order.shippingAddress?.name ?? "—"}</td>
        <td className="px-6 py-3.5 text-slate-500 text-sm">{order.email ?? "—"}</td>
        <td className="px-6 py-3.5 text-slate-500 text-sm">
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </td>
        <td className="px-6 py-3.5">
          <StatusPopup
            value={status}
            options={STATUS_OPTIONS}
            colors={statusColors}
            onChange={handleStatusChange}
            disabled={isPending}
          />
        </td>
        <td className="px-6 py-3.5 font-semibold text-slate-800 text-sm text-right">
          ₹{Number(order.totalAmount ?? 0).toLocaleString("en-IN")}
        </td>
        <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
          {order.shippingAddress?.gstno ?? <span className="text-slate-300">—</span>}
        </td>
        <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
          {order.transactionId ?? <span className="text-slate-300">—</span>}
        </td>
        <td className="px-6 py-3.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded((p) => !p)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={expanded ? "Close details" : "View details"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete order"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {expanded && createPortal(
        <div
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-slate-900">Order #{order._id.slice(-8).toUpperCase()}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {order.email ?? ""}
                  {order.createdAt
                    ? ` · ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                    : ""}
                </p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Order items */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-slate-400" /> Items Ordered
                  </h4>
                  <div className="flex flex-col gap-2">
                    {(order.items ?? []).length > 0 ? (
                      order.items!.map((item, i) => {
                        const dbImage = (item as any).product?.images?.[0];
                        const itemImage =
                          typeof item.images === "string"
                            ? item.images
                            : Array.isArray(item.images)
                            ? item.images[0]
                            : (item as any).image;
                        const photoUrl = dbImage || itemImage;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3"
                          >
                            <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              {photoUrl ? (
                                <img src={photoUrl} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-300">
                                  IMG
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{item.name ?? "—"}</p>
                              <p className="text-xs text-slate-500">Qty: {item.quantity ?? 1}</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 flex-shrink-0">
                              ₹{Number((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString("en-IN")}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-400">No items recorded.</p>
                    )}
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>₹{Number(order.subtotal ?? 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Shipping</span>
                      <span>
                        {order.shippingCharges === 0
                          ? "Free"
                          : `₹${Number(order.shippingCharges ?? 0).toLocaleString("en-IN")}`}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-900 pt-1.5 border-t border-slate-200">
                      <span>Total</span>
                      <span>₹{Number(order.totalAmount ?? 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping + payment info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-2">Shipping Address</h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-700 space-y-0.5">
                      <p className="font-medium">{order.shippingAddress?.name ?? "—"}</p>
                      <p className="text-slate-600">{order.shippingAddress?.addressLine1}</p>
                      {order.shippingAddress?.addressLine2 && (
                        <p className="text-slate-600">{order.shippingAddress.addressLine2}</p>
                      )}
                      <p className="text-slate-600">
                        {[
                          order.shippingAddress?.city,
                          order.shippingAddress?.state,
                          order.shippingAddress?.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-slate-600">{order.shippingAddress?.country}</p>
                      {order.shippingAddress?.phone && (
                        <p className="text-slate-500 text-xs pt-1">
                          📞 {order.shippingAddress.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-2">Payment</h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-700 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method</span>
                        <span className="font-medium uppercase text-sm">{order.paymentMethod ?? "—"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Payment Status</span>
                        <StatusPopup
                          value={order.paymentStatus || "Pending"}
                          options={["Pending", "Paid"]}
                          colors={{ Pending: "bg-amber-50 text-amber-700 ring-amber-200", Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200" }}
                          onChange={handlePaymentStatusChange}
                        />
                      </div>
                      {order.transactionId && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transaction ID</span>
                          <span className="font-mono text-xs text-slate-700">{order.transactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-2">Invoice</h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-700 space-y-3">
                      {order.invoicePdf ? (
                        <div className="flex items-center justify-between gap-3 p-2 bg-blue-50/60 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                            <a
                              href={order.invoicePdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate text-xs font-medium"
                            >
                              View Invoice PDF
                            </a>
                          </div>
                          <button
                            onClick={() => handleInvoiceUpdate("")}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove invoice"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDragOver={onDragOver}
                          onDragLeave={onDragLeave}
                          onDrop={onDrop}
                          className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 text-center ${
                            isDragging
                              ? "border-blue-400 bg-blue-50/50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          } ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ".pdf";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleFileUpload(file);
                            };
                            input.click();
                          }}
                        >
                          {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                              <p className="text-xs text-blue-600 font-medium">Uploading PDF…</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-slate-400">
                              <Upload className="h-5 w-5" />
                              <p className="text-xs font-medium text-slate-600">Drop invoice PDF here</p>
                              <p className="text-[11px] text-slate-400">or click to browse</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs text-slate-500">Or paste invoice URL</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://…"
                            className="flex-1 bg-white border border-slate-200 text-xs rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 placeholder:text-slate-300 transition-all"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleInvoiceUpdate((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                          <button
                            className="px-3 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-all shadow-sm"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              handleInvoiceUpdate(input.value);
                              input.value = "";
                            }}
                          >
                            Link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
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
