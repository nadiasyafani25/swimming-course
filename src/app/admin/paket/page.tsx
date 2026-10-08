import type { Metadata } from "next";
import PackageGrid from "@/admin/paket/PackageGrid";
import { listCoaches, listCoursePackages } from "@/admin/data";

export const metadata: Metadata = {
  title: "Paket Kursus - Panel Admin",
  description: "Kelola paket kursus SwimmingCourse.",
};

export default async function AdminPackagesPage() {
  const [packages, coaches] = await Promise.all([
    listCoursePackages(),
    listCoaches(),
  ]);

  return (
    <>
      <div>
        <h2 className="text-[16px] font-bold text-[#073763]">Paket kursus</h2>
        <p className="mt-1 text-[12px] text-[#526B84]">
          Sumber tunggal data paket. Semua perubahan di sini langsung tampil di
          katalog kursus peserta dan form pendaftaran.
        </p>
      </div>

      <PackageGrid
        packages={packages}
        coachNames={coaches.map((coach) => coach.name)}
      />
    </>
  );
}