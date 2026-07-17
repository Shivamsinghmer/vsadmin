import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

// Admin data changes constantly; never serve a statically cached shell.
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="h-full relative bg-background min-h-screen">
        <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
          <Sidebar />
        </div>
        <main className="md:pl-64 flex flex-col min-h-screen">
          <Navbar />
          <div className="p-5 sm:p-6 lg:p-8 flex-1 max-w-[100vw] overflow-x-hidden w-full">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
