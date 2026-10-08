"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  ArrowDownToLine,
  Eye,
  FileCheck2,
  PenLine,
  Search,
  Timer,
} from "lucide-react";
import CertificateGeneratorModal from "@/admin/sertifikat/CertificateGeneratorModal";
import CertificateIssueModal from "@/admin/sertifikat/CertificateIssueModal";
import CertificatePreviewModal from "@/admin/sertifikat/CertificatePreviewModal";
import { formatDateShort } from "@/admin/time";
import type { CertificateRow, CertificateStats, SwimStatus } from "@/admin/types";

const STATUS_STYLES: Record<
  SwimStatus,
  { label: string; className: string }
> = {
  bisa_berenang: {
    label: "Bisa berenang",
    className: "bg-[#DFF7EC] text-[#1F9C63]",
  },
  belum_dievaluasi: {
    label: "Belum dievaluasi",
    className: "bg-[#FFF2E1] text-[#B56A00]",
  },
};

type CertificateManagerProps = {
  rows: CertificateRow[];
  stats: CertificateStats;
  /** Nama admin penerbit; diisi ke `certificates.issued_by`. */
  issuedBy: string;
  /** Pelatih aktif untuk dropdown nama pelatih di generator. */
  coaches: { id: string; name: string }[];
  /** Nomor berikutnya sebagai saran tombol "Isi otomatis". */
  suggestedCertificateNo: string;
};

type SummaryCard = {
  label: string;
  value: number;
  hint: string;
  accent: string;
  tint: string;
  icon: typeof Award;
};

export default function CertificateManager({
  rows,
  stats,
  issuedBy,
  coaches,
  suggestedCertificateNo,
}: CertificateManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [issuing, setIssuing] = useState<CertificateRow | null>(null);
  const [previewing, setPreviewing] = useState<CertificateRow | null>(null);
  const [generating, setGenerating] = useState(false);

  // Generator hanya memuat peserta aktif: peserta nonaktif sudah kehilangan
  // sesinya, jadi tidak akan bisa login untuk mengambil sertifikatnya.
  const participantOptions = useMemo(
    () =>
      rows
        .filter((row) => row.isActive)
        .map((row) => ({
          id: row.userId,
          fullName: `${row.firstName} ${row.lastName}`,
        })),
    [rows],
  );

  // Pencarian cukup dihitung di client karena seluruh peserta sudah dimuat dari
  // database; tidak perlu memanggil API lagi tiap kali mengetik.
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => {
      const name = `${row.firstName} ${row.lastName}`.toLowerCase();
      const program = (row.programName ?? "").toLowerCase();
      const certCourse = (row.certificateCourse ?? "").toLowerCase();
      return (
        name.includes(keyword) ||
        program.includes(keyword) ||
        certCourse.includes(keyword)
      );
    });
  }, [rows, query]);

  const afterChange = () => {
    setIssuing(null);
    setPreviewing(null);
    router.refresh();
  };

  const cards: SummaryCard[] = [
    {
      label: "Sudah dinyatakan bisa berenang",
      value: stats.passCount,
      hint: `dari ${stats.totalCount} peserta aktif`,
      accent: "#1F9C63",
      tint: "#1F9C6314",
      icon: FileCheck2,
    },
    {
      label: "Sertifikat diterbitkan",
      value: stats.issuedCount,
      hint: "berkas sudah diunggah",
      accent: "#0D4D85",
      tint: "#0D4D8514",
      icon: Award,
    },
    {
      label: "Menunggu evaluasi",
      value: stats.pendingCount,
      hint: "belum dinyatakan bisa berenang",
      accent: "#B56A00",
      tint: "#B56A0014",
      icon: Timer,
    },
  ];

  const isEmptyAll = rows.length === 0;
  const isEmptySearch = !isEmptyAll && filtered.length === 0;

  return (
    <>
      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <section
            key={card.label}
            className="rounded-[10px] border border-[#D6E5F3] bg-white p-4 shadow-[0_1px_3px_rgba(7,55,99,0.08)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium leading-[1.5] text-[#526B84]">
                {card.label}
              </p>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: card.tint }}
              >
                <card.icon className="h-4 w-4" style={{ color: card.accent }} />
              </span>
            </div>
            <p className="mt-3 text-[26px] font-bold leading-none tracking-tight text-[#073763]">
              {card.value}
            </p>
            <p className="mt-3 text-[10px] font-medium text-[#8FA3B8]">
              {card.hint}
            </p>
          </section>
        ))}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-full max-w-[300px]">
            <span className="sr-only">Cari nama peserta</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9BACB]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama peserta..."
              className="h-[38px] w-full rounded-lg border border-[#D6E5F3] bg-white pl-9 pr-3 text-[12px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5]"
            />
          </label>

          <button
            type="button"
            onClick={() => setGenerating(true)}
            className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-[#0A3966] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#0A2540]"
          >
            <PenLine className="h-4 w-4" />
            Edit Sertifikat
          </button>
        </div>

        <p className="mt-2 text-[11px] text-[#8FA3B8]">
          {isEmptyAll
            ? "Belum ada peserta terdaftar."
            : query
              ? `${filtered.length} dari ${rows.length} peserta cocok.`
              : `${rows.length} peserta terdaftar.`}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#D6E5F3] bg-white shadow-[0_1px_3px_rgba(10,37,64,0.06)]">
        {isEmptyAll || isEmptySearch ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F7FF]">
              <Award className="h-5 w-5 text-[#BBD4EC]" />
            </span>
            <p className="text-[12px] font-semibold text-[#526B84]">
              {isEmptyAll ? "Belum ada data peserta" : "Peserta tidak ditemukan"}
            </p>
            <p className="max-w-[320px] text-[11px] leading-[1.7] text-[#8FA3B8]">
              {isEmptyAll
                ? "Peserta yang mendaftar sendiri lewat form situs akan muncul di sini, atau tambahkan manual lewat menu Data peserta."
                : `Tidak ada peserta yang cocok dengan "${query}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr>
                  {[
                    "Nama peserta",
                    "Program",
                    "Status kemampuan",
                    "Sertifikat",
                    "Aksi",
                  ].map((head) => (
                    <th
                      key={head}
                      scope="col"
                      className="border-b border-[#E8F0F8] bg-[#F8FBFE] px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.06em] text-[#073763]"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const status = STATUS_STYLES[row.swimStatus];
                  const isIssued = row.certificateId !== null;
                  const fullName = `${row.firstName} ${row.lastName}`;

                  return (
                    <tr
                      key={row.userId}
                      className={`transition-colors hover:bg-[#FAFCFF] ${
                        row.isActive ? "" : "bg-[#FCFCFD]"
                      }`}
                    >
                      <td className="border-b border-[#F0F5FA] px-5 py-3">
                        <p
                          className={`text-[12px] font-semibold ${
                            row.isActive ? "text-[#073763]" : "text-[#8FA3B8]"
                          }`}
                        >
                          {fullName}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#A9BACB]">
                          {row.email}
                        </p>
                      </td>

                      <td className="border-b border-[#F0F5FA] px-5 py-3 text-[11px] text-[#526B84]">
                        {row.programName ?? (
                          <span className="text-[#A9BACB]">Belum mendaftar</span>
                        )}
                      </td>

                      <td className="border-b border-[#F0F5FA] px-5 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="border-b border-[#F0F5FA] px-5 py-3 text-[11px]">
                        {isIssued && row.issueDate ? (
                          <span className="text-[#526B84]">
                            Diterbitkan - {formatDateShort(row.issueDate)}
                          </span>
                        ) : (
                          <span className="text-[#A9BACB]">-</span>
                        )}
                        {row.certificateCount > 1 && (
                          <span className="mt-0.5 block text-[10px] text-[#A9BACB]">
                            {row.certificateCount} sertifikat
                          </span>
                        )}
                      </td>

                      <td className="border-b border-[#F0F5FA] px-5 py-3">
                        {isIssued ? (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewing(row)}
                              aria-label={`Lihat sertifikat ${fullName}`}
                              title="Lihat sertifikat"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6E5F3] bg-[#EAF4FD] text-[#1769AA] transition-colors hover:border-[#368DDF] hover:bg-[#E5F1FC]"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={`/api/admin/certificates/${row.certificateId}/file?download=1`}
                              download
                              aria-label={`Unduh sertifikat ${fullName}`}
                              title="Unduh sertifikat"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6E5F3] bg-[#EAF4FD] text-[#1769AA] transition-colors hover:border-[#368DDF] hover:bg-[#E5F1FC]"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIssuing(row)}
                            className="h-[32px] rounded-lg bg-[#0A3966] px-3.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#0A2540]"
                          >
                            Terbitkan sertifikat
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {generating && (
        <CertificateGeneratorModal
          participants={participantOptions}
          coaches={coaches}
          suggestedCertificateNo={suggestedCertificateNo}
          onClose={() => setGenerating(false)}
        />
      )}

      {issuing && (
        <CertificateIssueModal
          row={issuing}
          issuedBy={issuedBy}
          onClose={() => setIssuing(null)}
          onSaved={afterChange}
        />
      )}

      {previewing && (
        <CertificatePreviewModal
          row={previewing}
          onClose={() => setPreviewing(null)}
          onEdit={() => {
            setIssuing(previewing);
            setPreviewing(null);
          }}
        />
      )}
    </>
  );
}