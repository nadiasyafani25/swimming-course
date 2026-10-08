"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import AdminSidebar, { getAdminPageTitle } from "./AdminSidebar";
import { getInitials } from "@/lib/initials";

type AdminShellProps = {
  userName: string;
  children: React.ReactNode;
};

export default function AdminShell({
  userName,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const initials = getInitials(userName);

  return (
    <main className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#D6E5F3] bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#0D4D85] transition-colors hover:bg-[#E5F1FC] lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <h1 className="text-[18px] font-bold text-[#073763]">
              {getAdminPageTitle(pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <div id="admin-header-actions" className="flex items-center gap-2.5" />
            <span className="hidden text-[12px] text-[#526B84] sm:inline">
              Admin: {userName}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D4D85] text-[12px] font-bold text-white">
              {initials}
            </span>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-[18px] p-5 lg:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}