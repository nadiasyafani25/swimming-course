import type { Metadata } from "next";
import { Download } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { requireParticipant } from "@/lib/session";
import { db } from "@/db";
import { certificates, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatDateLong, formatDateShort } from "@/admin/time";

export const metadata: Metadata = {
  title: "Sertifikat - SwimmingCourse",
  description: "Sertifikat kelulusan kelas renang Anda.",
};

export default async function DashboardCertificatePage() {
  const user = await requireParticipant();

  const [rows, profile] = await Promise.all([
    db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, user.id))
      .orderBy(desc(certificates.issueDate)),
    db
      .select({ swimStatus: users.swimStatus })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
  ]);

  const latest = rows[0] ?? null;
  const canSwim = profile[0]?.swimStatus === "bisa_berenang";
  const studentName = `${user.firstName} ${user.lastName}`;

  return (
    <DashboardShell
      userName={studentName}
      title="Sertifikat"
    >
      {/* Kartu status & sertifikat aktif */}
      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-bold text-[#073763]">
            Status kemampuan renang
          </h2>
          {canSwim && (
            <span className="inline-block shrink-0 rounded-full bg-[#DFF7EC] px-2.5 py-1 text-[9px] font-medium text-[#1F9C63]">
              Dinyatakan bisa berenang
            </span>
          )}
        </div>

        {latest ? (
          <>
            <div className="rounded-[9px] border border-[#D6E5F3] bg-[#F0F7FF] p-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1769AA]">
                Sertifikat Kelulusan
              </p>
              <p className="mt-3 text-[26px] font-bold leading-tight text-[#073763]">
                {studentName}
              </p>
              <p className="mt-2 text-[12px] text-[#526B84]">
                Telah dinyatakan lulus - {latest.courseName}
              </p>
              <p className="mt-2 text-[11px] text-[#8FA3B8]">
                Diterbitkan oleh{" "}
                {latest.issuedBy ? latest.issuedBy : "admin"} pada{" "}
                {formatDateLong(new Date(latest.issueDate))}
              </p>
            </div>

            <a
              href={`/api/certificates/${latest.id}/file`}
              download
              className="mt-5 flex h-[38px] w-full items-center justify-center gap-2 rounded-md bg-[#0D4D85] text-[12px] font-semibold text-white transition-colors hover:bg-[#0a3f6d]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Unduh sertifikat (PDF)
            </a>
          </>
        ) : (
          <div className="rounded-[9px] border border-dashed border-[#D6E5F3] bg-[#FAFCFF] px-6 py-10 text-center">
            <p className="text-[12px] font-medium text-[#073763]">
              Belum ada sertifikat yang diterbitkan oleh admin.
            </p>
            <p className="mt-1 text-[11px] text-[#8FA3B8]">
              Sertifikat akan muncul di sini setelah admin menerbitkannya.
            </p>
          </div>
        )}
      </section>

      {/* Riwayat sertifikat */}
      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <h2 className="mb-4 text-[13px] font-bold text-[#073763]">
          Riwayat sertifikat
        </h2>

        <div className="overflow-x-auto rounded-[9px] border border-[#D6E5F3]">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                  Nama program
                </th>
                <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                  Tanggal terbit
                </th>
                <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-5 text-center text-[11px] text-[#8FA3B8]"
                  >
                    Belum ada riwayat sertifikat.
                  </td>
                </tr>
              ) : (
                rows.map((cert) => (
                  <tr key={cert.id}>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] font-medium text-[#073763]">
                      {cert.courseName}
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] text-[#526B84]">
                      {formatDateShort(new Date(cert.issueDate))}
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px]">
                      <a
                        href={`/api/certificates/${cert.id}/file`}
                        download
                        aria-label={`Unduh sertifikat ${cert.courseName}`}
                        className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-md bg-[#0D4D85] text-white transition-colors hover:bg-[#0a3f6d]"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}