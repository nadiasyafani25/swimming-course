"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  CalendarDays,
  ChartColumn,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Waves,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import LogoutButton from "@/components/LogoutButton";

type AdminMenuItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  live: boolean;
};

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, live: true },
  { label: "Data peserta", path: "/admin/peserta", icon: Users, live: true },
  { label: "Data pelatih", path: "/admin/pelatih", icon: Dumbbell, live: true },
  { label: "Paket kursus", path: "/admin/paket", icon: Package, live: true },
  { label: "Sertifikat", path: "/admin/sertifikat", icon: Award, live: true },
  { label: "Jadwal", path: "/admin/jadwal", icon: CalendarDays, live: true },
  { label: "Pembayaran", path: "/admin/pembayaran", icon: CreditCard, live: true },
  { label: "Laporan", path: "/admin/laporan", icon: ChartColumn, live: true },
  { label: "Pengaturan", path: "/admin/pengaturan", icon: Settings, live: true },
];

const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard admin",
  "/admin/peserta": "Data peserta",
  "/admin/pelatih": "Data pelatih",
  "/admin/paket": "Paket kursus",
  "/admin/sertifikat": "Kelola sertifikat",
  "/admin/jadwal": "Kelola jadwal",
  "/admin/pembayaran": "Pembayaran",
  "/admin/laporan": "Laporan",
  "/admin/pengaturan": "Pengaturan",
  "/admin/pesan": "Pesan kontak",
};

export function getAdminPageTitle(pathname: string): string {
  return ADMIN_PAGE_TITLES[pathname] ?? "Panel admin";
}

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminSidebar({
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { businessName } = useSiteSettings();

  const baseClass =
    "flex items-center gap-3 rounded-full px-4 py-2.5 text-[12px] font-medium transition-colors";
  const activeClass = "bg-[#1D5FA8] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.28)]";
  const idleClass = "text-[#BBD4EC] hover:bg-white/10 hover:text-white";
  const disabledClass = "cursor-not-allowed text-[#4E6E92]";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#062c4e]/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#0A2540] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#368DDF]">
              <Waves className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-white">
              {businessName}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#BBD4EC] transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Tutup menu navigasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="px-6 pb-1 pt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E93B8]">
          Admin panel
        </p>

        <nav className="flex-1 overflow-y-auto px-4 py-3">
          <ul className="flex flex-col gap-1">
            {ADMIN_MENU_ITEMS.map((item) => {
              const isActive =
                item.path === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.path);

              if (!item.live) {
                return (
                  <li key={item.path}>
                    <span
                      aria-disabled="true"
                      className={`${baseClass} ${disabledClass}`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={`${baseClass} ${isActive ? activeClass : idleClass}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            onClick={onClose}
            className={`${baseClass} ${idleClass}`}
          >
            <Waves className="h-4 w-4 shrink-0" />
            Lihat situs
          </Link>
          <LogoutButton
            className={`${baseClass} mt-1 w-full justify-start`}
            iconClassName="text-[#BBD4EC]"
            confirm={false}
          />
        </div>
      </aside>
    </>
  );
}