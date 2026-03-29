import { ShoppingCart, Package, Users, IndianRupee, ArrowUpRight } from "lucide-react";
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

  const stats = [
    {
      name: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: "All time earnings",
      icon: IndianRupee,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      name: "Orders",
      value: totalOrders.toLocaleString(),
      sub: "All time",
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50",
    },
    {
      name: "Products In Stock",
      value: totalProducts.toLocaleString(),
      sub: "Currently available",
      icon: Package,
      color: "text-violet-600 bg-violet-50",
    },
    {
      name: "Users",
      value: totalUsers.toLocaleString(),
      sub: "Registered accounts",
      icon: Users,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  const statusColors: Record<string, string> = {
    Processing: "bg-blue-50 text-blue-700 border-blue-100",
    Shipped:    "bg-purple-50 text-purple-700 border-purple-100",
    Delivered:  "bg-emerald-50 text-emerald-700 border-emerald-100",
    Cancelled:  "bg-red-50 text-red-700 border-red-100",
    Pending:    "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-400 mt-0.5">Welcome back — here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.name}</p>
              <div className={`p-2 rounded-xl ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-3 tracking-tight">{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <h2 className="text-sm font-black text-slate-800">Recent Orders</h2>
          <a href="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
            View all <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any, i: number) => {
                  const cls = statusColors[order.status] ?? "bg-slate-50 text-slate-500 border-slate-100";
                  return (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-black text-slate-700 text-xs tracking-wide">
                        #{order._id?.toString().slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 text-xs">
                        {order.shippingAddress?.name || order.email || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 text-xs">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-6 py-3.5 font-black text-slate-800 text-xs">
                        ₹{Number(order.totalAmount ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black border ${cls}`}>
                          {order.status ?? "Unknown"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-300">
                    No orders found.
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
