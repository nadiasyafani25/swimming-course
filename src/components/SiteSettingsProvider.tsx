"use client";

import { createContext, useContext } from "react";
import type { SiteInfo } from "@/lib/settings";

/**
 * Identitas tempat kursus untuk komponen client.
 *
 * Sengaja hanya `SiteInfo`, bukan `SiteSettings` penuh: nilai di sini ikut
 * ter-serialize ke HTML setiap halaman, jadi nominal rekening, nama bank, dan
 * string QRIS tidak boleh masuk ke context ini. Halaman pembayaran menerimanya
 * sebagai prop dari server, dan form pengaturan admin membacanya lewat
 * `/api/admin/settings`.
 */
const SiteSettingsContext = createContext<SiteInfo | null>(null);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: SiteInfo;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteInfo {
  const value = useContext(SiteSettingsContext);

  if (!value) {
    throw new Error(
      "useSiteSettings harus dipakai di dalam SiteSettingsProvider (root layout).",
    );
  }

  return value;
}