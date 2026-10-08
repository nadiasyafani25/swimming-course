import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CertificateManager from "@/admin/sertifikat/CertificateManager";
import {
  countCertificatesIssuedThisYear,
  getCertificateStats,
  listActiveCoachOptions,
  listCertificateRows,
} from "@/admin/data";
import { suggestCertificateNo } from "@/lib/certificate-fields";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Kelola Sertifikat - Panel Admin",
  description: "Terbitkan dan kelola sertifikat kelulusan peserta SwimmingCourse.",
};

export default async function AdminCertificatePage() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");

  const [rows, stats, coaches, issuedThisYear] = await Promise.all([
    listCertificateRows(),
    getCertificateStats(),
    listActiveCoachOptions(),
    countCertificatesIssuedThisYear(),
  ]);

  return (
    <>
      <div>
        <h2 className="text-[16px] font-bold text-[#073763]">Kelola sertifikat</h2>
        <p className="mt-1 text-[12px] text-[#526B84]">
          Terbitkan sertifikat untuk peserta yang sudah dinyatakan bisa berenang.
          Sertifikat langsung tampil di halaman Sertifikat masing-masing peserta.
        </p>
      </div>

      <CertificateManager
        rows={rows}
        stats={stats}
        issuedBy={`${admin.firstName} ${admin.lastName}`.trim()}
        coaches={coaches}
        suggestedCertificateNo={suggestCertificateNo(issuedThisYear)}
      />
    </>
  );
}