import type { Metadata } from "next";
import SettingsForm from "@/admin/pengaturan/SettingsForm";
import { getSiteSettings } from "@/lib/settings-db";

export const metadata: Metadata = {
  title: "Pengaturan - Panel Admin",
  description: "Kelola profil bisnis dan notifikasi SwimmingCourse.",
};

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <div>
        <h2 className="text-[16px] font-bold text-[#073763]">Pengaturan</h2>
        <p className="mt-1 text-[12px] text-[#526B84]">
          Perubahan di halaman ini langsung dipakai seluruh halaman situs dan
          tersimpan di database, jadi tetap berlaku setelah perangkat lain
          dibuka.
        </p>
      </div>

      <SettingsForm initial={settings} />
    </>
  );
}