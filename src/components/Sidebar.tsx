"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  FileText,
  MessageSquare,
} from "lucide-react";

const routes = [
  { label: "Overview",     icon: LayoutDashboard, href: "/" },
  { label: "Orders",       icon: ShoppingCart,    href: "/orders" },
  { label: "Products",     icon: Package,         href: "/products" },
  { label: "Categories",   icon: Tags,            href: "/categories" },
  { label: "Blogs",        icon: FileText,        href: "/blogs" },
  { label: "Testimonials", icon: MessageSquare,   href: "/testimonials" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-nav">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-white/[0.07]">
        <div className="h-7 w-7 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white text-[11px] font-bold tracking-tight">VS</span>
        </div>
        <div className="leading-tight">
          <span className="block text-[13px] font-semibold text-white tracking-tight">VSEnterprises</span>
          <span className="block text-[10px] text-white/35 font-medium">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
        {routes.map((route) => {
          const active = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                active
                  ? "bg-nav-active text-white"
                  : "text-white/45 hover:bg-nav-hover hover:text-white/85"
              }`}
            >
              <route.icon
                size={15}
                className={active ? "text-blue-400" : "text-white/35"}
              />
              {route.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.07]">
        <p className="text-[10px] text-white/20 font-medium">© 2026 VS Enterprises</p>
      </div>
    </div>
  );
}
