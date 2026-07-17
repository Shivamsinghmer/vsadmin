import { Search } from "lucide-react";
import connectToDB from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { OrderRow } from "@/components/orders/OrderRow";

export default async function OrdersPage() {
  await connectToDB();
  Product.init();
  const rawOrders = await Order.find()
    .populate({ path: "items.product", model: Product, strictPopulate: false })
    .sort({ createdAt: -1 })
    .lean() as any[];
  const orders = JSON.parse(JSON.stringify(rawOrders));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {orders.length} order{orders.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <input
              type="text"
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 block w-full pl-9 py-2.5 outline-none transition placeholder:text-slate-400"
              placeholder="Search orders…"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Order ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Customer</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Email</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 text-right">Total</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">GST No.</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Transaction ID</th>
                <th className="px-6 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.length > 0 ? (
                orders.map((order: any) => (
                  <OrderRow
                    key={order._id.toString()}
                    order={{
                      _id: order._id.toString(),
                      shippingAddress: order.shippingAddress,
                      email: order.email,
                      createdAt: order.createdAt?.toString(),
                      status: order.status,
                      totalAmount: order.totalAmount,
                      subtotal: order.subtotal,
                      shippingCharges: order.shippingCharges,
                      transactionId: order.transactionId,
                      gstno: order.shippingAddress?.gstno || order.gstno,
                      invoicePdf: order.shippingAddress?.invoicePdf || order.invoicePdf,
                      paymentMethod: order.paymentMethod,
                      paymentStatus: order.paymentStatus,
                      items: order.items ? JSON.parse(JSON.stringify(order.items)) : [],
                    }}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
