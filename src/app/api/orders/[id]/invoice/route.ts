import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import connectToDB from "@/lib/mongoose";
import { Order } from "@/models/Order";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.type.includes("pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Upload to Vercel Blob — no size limits, no MongoDB bloat
    const blob = await put(`invoices/${id}/${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    await connectToDB();
    const updated = await Order.findByIdAndUpdate(
      id,
      {
        invoicePdf: blob.url,
        $unset: { invoiceData: "", invoiceMimeType: "" },
      },
      { new: true }
    );

    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error) {
    console.error("Invoice upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDB();
    const order = await Order.findById(id).select("invoicePdf invoiceData invoiceMimeType");

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // New: redirect to Vercel Blob URL
    if (order.invoicePdf && order.invoicePdf.startsWith("http")) {
      return NextResponse.redirect(order.invoicePdf);
    }

    // Legacy: serve old binary-in-MongoDB invoices
    if (order.invoiceData) {
      return new NextResponse(order.invoiceData, {
        headers: {
          "Content-Type": order.invoiceMimeType || "application/pdf",
          "Content-Disposition": "inline",
        },
      });
    }

    return new NextResponse("Invoice not found", { status: 404 });
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
