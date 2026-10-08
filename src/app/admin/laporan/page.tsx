import type { Metadata } from "next";
import ReportView from "@/admin/laporan/ReportView";
import { getReportData } from "@/admin/laporan/report-data";

export const metadata: Metadata = {
  title: "Laporan - Panel Admin",
  description: "Laporan pendapatan dan paket terpopuler SwimmingCourse.",
};

export default async function AdminReportsPage() {
  const data = await getReportData();

  return (
    <>
      <div>
        <h2 className="text-[16px] font-bold text-[#073763]">Laporan</h2>
        <p className="mt-1 text-[12px] text-[#526B84]">
          Angka pendapatan dihitung dari tagihan lunas, dan peringkat paket dari
          enrollment aktif. Ganti periode di bawah untuk mengubah keduanya.
        </p>
      </div>

      <ReportView data={data} />
    </>
  );
}