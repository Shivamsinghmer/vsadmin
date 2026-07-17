"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-64 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3.5 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 transition-colors z-50"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-full overflow-y-auto w-full">
              <Sidebar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
