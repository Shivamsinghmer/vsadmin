"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronDown, ChevronUp, Package, Upload, FileText, Loader2 } from "lucide-react";

const STATUS_OPTIONS = ["Processing", "Shipped", "Delivered", "Cancelled", "Pending"] as const;

const statusColors: Record<string, string> = {
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
  Shipped:    "bg-purple-50 text-purple-700 border-purple-200",
  Delivered:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled:  "bg-red-50 text-red-700 border-red-200",
  Pending:    "bg-amber-50 text-amber-600 border-amber-200",
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
        // The endpoint already updates the order, just refresh.
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

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

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

  const statusClass = statusColors[status] ?? "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <>
      <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${deleting ? "opacity-40 pointer-events-none" : ""} ${expanded ? "bg-blue-50/30" : ""}`}>
        <td className="px-6 py-4 font-medium text-slate-900">
          #{order._id.slice(-8).toUpperCase()}
        </td>
        <td className="px-6 py-4">{order.shippingAddress?.name ?? "—"}</td>
        <td className="px-6 py-4">{order.email ?? "—"}</td>
        <td className="px-6 py-4">
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              })
            : "—"}
        </td>
        <td className="px-6 py-4">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isPending}
            className={`text-xs font-semibold rounded-full px-2.5 py-1 border outline-none cursor-pointer ${statusClass}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </td>
        <td className="px-6 py-4 font-medium text-slate-900 text-right">
          ₹{Number(order.totalAmount ?? 0).toLocaleString("en-IN")}
        </td>
        <td className="px-6 py-4 font-mono text-xs text-slate-600">
          {order.shippingAddress?.gstno ?? <span className="text-slate-300">N/A</span>}
        </td>
        <td className="px-6 py-4 font-mono text-xs text-slate-600">
          {order.transactionId ?? <span className="text-slate-300">—</span>}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded((p) => !p)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={expanded ? "Collapse" : "Expand"}
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

      {/* ── Expanded detail row ── */}
      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-50/70">
          <td colSpan={8} className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Order items */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Items Ordered
                </h4>
                <div className="flex flex-col gap-2">
                  {(order.items ?? []).length > 0 ? (
                    order.items!.map((item, i) => {
                      const dbImage = (item as any).product?.images?.[0];
                      const itemImage = typeof item.images === "string" ? item.images : Array.isArray(item.images) ? item.images[0] : (item as any).image;
                      const photoUrl = dbImage || itemImage;
                      return (
                      <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg p-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                          {photoUrl ? (
                            <img src={photoUrl} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-300">IMG</span>
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

                {/* Price breakdown */}
                <div className="mt-3 border-t border-slate-200 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{Number(order.subtotal ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping</span>
                    <span>{order.shippingCharges === 0 ? "Free" : `₹${Number(order.shippingCharges ?? 0).toLocaleString("en-IN")}`}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total</span>
                    <span>₹{Number(order.totalAmount ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Shipping + payment info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Shipping Address</h4>
                  <div className="bg-white border border-slate-100 rounded-lg p-3 text-sm text-slate-700 space-y-0.5">
                    <p className="font-medium">{order.shippingAddress?.name ?? "—"}</p>
                    <p>{order.shippingAddress?.addressLine1}</p>
                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postalCode].filter(Boolean).join(", ")}</p>
                    <p>{order.shippingAddress?.country}</p>
                    {order.shippingAddress?.phone && (
                      <p className="text-slate-500 text-xs pt-1">📞 {order.shippingAddress.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Payment</h4>
                  <div className="bg-white border border-slate-100 rounded-lg p-3 text-sm text-slate-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method</span>
                      <span className="font-medium uppercase">{order.paymentMethod ?? "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Payment Status</span>
                      <select 
                        value={order.paymentStatus || "Pending"}
                        onChange={(e) => handlePaymentStatusChange(e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-0.5 border outline-none cursor-pointer ${order.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    {order.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transaction ID</span>
                        <span className="font-mono text-xs">{order.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                   <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Invoice</h4>
                   <div className="bg-white border border-slate-100 rounded-lg p-3 text-sm text-slate-700 space-y-3">
                     {order.invoicePdf ? (
                       <div className="flex items-center justify-between gap-3 p-2 bg-blue-50/50 rounded-xl border border-blue-100">
                         <div className="flex items-center gap-2 flex-1 min-w-0">
                           <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                           <a href={order.invoicePdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate text-xs font-bold">
                             View Current Invoice PDF
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
                         className={`
                           relative group border-2 border-dashed rounded-xl p-4 transition-all duration-200 text-center
                           ${isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50"}
                           ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                         `}
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
                             <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                             <p className="text-[10px] font-black text-blue-600">UPLOADING PDF...</p>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center gap-1.5 text-slate-400">
                             <Upload className={`h-6 w-6 transition-transform duration-300 ${isDragging ? "-translate-y-1 block" : "block"}`} />
                             <div className="space-y-0.5">
                               <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Drop invoice PDF here</p>
                               <p className="text-[9px] text-slate-400 font-medium">or click to browse files</p>
                             </div>
                           </div>
                         )}
                       </div>
                     )}

                     <div className="flex flex-col gap-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Or paste invoice URL</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="https://..." 
                            className="flex-1 bg-slate-50 border border-slate-100 text-xs rounded-lg p-2 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 placeholder:text-slate-300 transition-all"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleInvoiceUpdate((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                          <button 
                            className="px-3 bg-slate-900 text-white text-[10px] font-black rounded-lg hover:bg-blue-600 transition-all shadow-sm active:scale-95"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              handleInvoiceUpdate(input.value);
                              input.value = "";
                            }}
                          >
                            LINK
                          </button>
                        </div>
                     </div>
                   </div>
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}
