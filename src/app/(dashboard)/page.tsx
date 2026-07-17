import { ShoppingCart, Package, Users, IndianRupee, ArrowRight } from "lucide-react";
import connectToDB from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export default async function Dashboard() {
  await connectToDB();

  const [totalOrders, totalUsers, totalProducts, revenueAgg, recentOrders] =
    await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments({ inStock: true }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      Order.find().sort({ createdAt: -1 }).limit(6).lean() as Promise<any[]>,
    ]);

  const totalRevenue: number = revenueAgg[0]?.total ?? 0;

  const metrics = [
    {
      label: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: "All time earnings",
      icon: IndianRupee,
      iconClass: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Orders",
      value: totalOrders.toLocaleString(),
      sub: "All time",
      icon: ShoppingCart,
      iconClass: "text-blue-600 bg-blue-50",
    },
    {
      label: "In Stock",
      value: totalProducts.toLocaleString(),
      sub: "Products available",
      icon: Package,
      iconClass: "text-violet-600 bg-violet-50",
    },
    {
      label: "Users",
      value: totalUsers.toLocaleString(),
      sub: "Registered accounts",
      icon: Users,
      iconClass: "text-amber-600 bg-amber-50",
    },
  ];

  const statusColors: Record<string, string> = {
    Processing: "bg-blue-50 text-blue-700 ring-blue-200",
    Shipped:    "bg-violet-50 text-violet-700 ring-violet-200",
    Delivered:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Cancelled:  "bg-red-50 text-red-700 ring-red-200",
    Pending:    "bg-amber-50 text-amber-700 ring-amber-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Welcome back — here's what's happening today.</p>
      </div>

      {/* Metrics strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
          {metrics.map((m, i) => (
            <div key={i} className="p-5 flex items-start gap-3.5">
              <div className={`p-2 rounded-xl flex-shrink-0 ${m.iconClass}`}>
                <m.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{m.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tracking-tight leading-tight">{m.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Recent Orders</h2>
          <a
            href="/orders"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Order ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Customer</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any, i: number) => {
                  const cls = statusColors[order.status] ?? "bg-slate-50 text-slate-600 ring-slate-200";
                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-semibold text-slate-700 text-sm">
                        #{order._id?.toString().slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 text-sm">
                        {order.shippingAddress?.name || order.email || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 text-sm">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800 text-sm">
                        ₹{Number(order.totalAmount ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
                        >
                          {order.status ?? "Unknown"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
