"use client";

import { createContext, useContext } from "react";
import type { SiteSettings } from "@/lib/settings";

/**
 * Pengaturan situs untuk komponen client.
 *
 * Nilai diambil di server (root layout) lalu diteruskan lewat context, supaya
 * Navbar, Sidebar, dan halaman kontak bisa menampilkan nama tempat kursus,
 * alamat, dan nomor telepon yang sama tanpa query sendiri.
 */
const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: SiteSettings;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  const value = useContext(SiteSettingsContext);

  if (!value) {
    throw new Error(
      "useSiteSettings harus dipakai di dalam SiteSettingsProvider (root layout).",
    );
  }

  return value;
}