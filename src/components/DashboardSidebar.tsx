"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  User,
  Waves,
  X,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Daftar kursus", href: "/dashboard/daftar-kursus", icon: ClipboardList },
  { label: "Jadwal saya", href: "/dashboard/jadwal", icon: CalendarDays },
  { label: "Pembayaran", href: "/dashboard/pembayaran", icon: CreditCard },
  { label: "Sertifikat", href: "/dashboard/sertifikat", icon: Award },
  { label: "Profil", href: "/dashboard/profil", icon: User },
];

type DashboardSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function DashboardSidebar({
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const baseClass =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition-colors";
  const activeClass = "bg-white text-[#1769AA] font-semibold shadow-[0_1px_3px_rgba(7,55,99,0.10)]";
  const idleClass = "text-[#526B84] hover:bg-white/60 hover:text-[#073763]";

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#062c4e]/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#EBF3FA] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#D6E5F3] px-5">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#368DDF]">
              <Waves className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-[#073763]">
              SwimmingCourse
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#526B84] transition-colors hover:bg-white/70 lg:hidden"
            aria-label="Tutup menu navigasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Label kategori */}
        <p className="px-5 pb-1 pt-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8FA3B8]">
          Peserta
        </p>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : !!item.href && pathname.startsWith(item.href);
              const className = `${baseClass} ${
                isActive ? activeClass : idleClass
              }`;

              return (
                <li key={item.label}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={isActive ? "page" : undefined}
                      className={className}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-[#1769AA]" : "text-[#8FA3B8]"
                        }`}
                      />
                      {item.label}
                    </Link>
                  ) : (
                    <span className={`${className} cursor-default`}>
                      <item.icon className="h-4 w-4 shrink-0 text-[#8FA3B8]" />
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Keluar */}
        <div className="border-t border-[#D6E5F3] p-3">
          <LogoutButton className={`${baseClass} w-full`} confirm={false} />
        </div>
      </aside>
    </>
  );
}
