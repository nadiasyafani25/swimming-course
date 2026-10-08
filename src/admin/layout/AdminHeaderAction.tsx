"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

/**
 * Slot tombol aksi di topbar admin.
 *
 * `AdminShell` berada di server layout, jadi halaman tidak bisa langsung
 * menyisipkan tombol ke header. Komponen ini mem-portal children ke elemen
 * `#admin-header-actions` yang sudah ada di header, sehingga tombol "Unduh PDF"
 * milik halaman Laporan tetap muncul di kanan topbar.
 */
export default function AdminHeaderAction({
  children,
}: {
  children: React.ReactNode;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [resolved, setResolved] = useState(false);

  // Elemen target sudah ada di HTML hasil render server, jadi pencarian
  // dilakukan saat render (bukan di effect) supaya tombol langsung muncul tanpa
  // kedipan setelah hidrasi.
  if (!resolved && typeof document !== "undefined") {
    setResolved(true);
    setTarget(document.getElementById("admin-header-actions"));
  }

  if (!target) return null;

  return createPortal(children, target);
}