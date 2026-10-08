"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileImage,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import CertificateDocument from "@/components/certificate/CertificateDocument";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import type { SiteSettings } from "@/lib/settings";
import {
  COMPETENCY_TEMPLATES,
  DRAFT_STORAGE_KEY,
  LEVEL_SUGGESTIONS,
  ORIENTATION_LABELS,
  CERTIFICATE_ORIENTATIONS,
  certificateFileBase,
  certificateSize,
  emptyDraft,
  parseCompetencies,
  type CertificateDraft,
  type CertificateOrientation,
} from "@/lib/certificate-fields";
import {
  downloadBlob,
  extensionFor,
  renderCertificate,
  type CertificateExportFormat,
} from "@/lib/certificate-render";

export type CertificateParticipantOption = {
  id: string;
  fullName: string;
};

export type CertificateCoachOption = {
  id: string;
  name: string;
};

type CertificateGeneratorModalProps = {
  /** Hanya peserta aktif yang terdaftar di database. */
  participants: CertificateParticipantOption[];
  /** Hanya pelatih aktif dari tabel `coaches`. */
  coaches: CertificateCoachOption[];
  /** Nomor yang dipakai tombol "Isi otomatis". */
  suggestedCertificateNo: string;
  onClose: () => void;
};

function loadDraft(site: SiteSettings): CertificateDraft {
  const base = emptyDraft(site);
  if (typeof window === "undefined") return base;

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return base;

    // Digabung dengan default supaya field baru yang ditambahkan di
    // versi berikutnya tidak ikut hilang / undefined.
    return { ...base, ...(JSON.parse(raw) as Partial<CertificateDraft>) };
  } catch {
    return base;
  }
}

export default function CertificateGeneratorModal({
  participants,
  coaches,
  suggestedCertificateNo,
  onClose,
}: CertificateGeneratorModalProps) {
  const site = useSiteSettings();
  const [draft, setDraft] = useState<CertificateDraft>(() => loadDraft(site));
  const [busyFormat, setBusyFormat] = useState<CertificateExportFormat | null>(null);
  const [error, setError] = useState("");
  const [showOrg, setShowOrg] = useState(false);
  // Disimpan terpisah supaya dropdown tetap menampilkan pilihan terakhir,
  // bukan lompat balik ke placeholder setiap kali peserta dipilih.
  const [participantId, setParticipantId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [orientation, setOrientation] = useState<CertificateOrientation>(() => {
    if (typeof window === "undefined") return "portrait";
    try {
      const raw = window.localStorage.getItem(`${DRAFT_STORAGE_KEY}:orientation`);
      return raw === "landscape" ? "landscape" : "portrait";
    } catch {
      return "portrait";
    }
  });

  // Orientasi ikut disimpan di draft lokal supaya pilihan admin tidak hilang
  // ketika modal ditutup tanpa sengaja.
  useEffect(() => {
    try {
      window.localStorage.setItem(`${DRAFT_STORAGE_KEY}:orientation`, orientation);
    } catch {
      /* abaikan */
    }
  }, [orientation]);

  const size = certificateSize(orientation);

  /**
   * Batas butir kompetensi yang masih muat. Landscape hanya punya 794px
   * tinggi, jadi batas butir lebih kecil daripada potrait. Melebihi batas ini
   * berarti butir terakhir bisa terpotong di hasil unduhan.
   */
  const COMPETENCY_LIMIT: Record<CertificateOrientation, number> = {
    portrait: 16,
    landscape: 14,
  };
  const competencyCount = parseCompetencies(draft.competencies).length;
  const competencyOverflow =
    competencyCount > COMPETENCY_LIMIT[orientation];

  /**
   * Skala preview dipilih supaya dokumen selalu muat di panel kanan tanpa
   * scroll, jadi landscape yang lebih lebar justru mendapat skala lebih kecil.
   */
  const PREVIEW_MAX_WIDTH = 470;
  const PREVIEW_MAX_HEIGHT = 560;
  const previewScale = Math.min(
    PREVIEW_MAX_WIDTH / size.width,
    PREVIEW_MAX_HEIGHT / size.height,
  );

  // Target tangkapan ukuran penuh, tersembunyi di luar viewport. Preview yang
  // terlihat sengaja di-scale, jadi node inilah yang harus di-rasterisasi.
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyFormat) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, busyFormat]);

  // Draft disimpan lokal supaya isian tidak hilang ketika modal ditutup.
  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* localStorage penuh atau dinonaktifkan - abaikan saja */
    }
  }, [draft]);

  const setField = <K extends keyof CertificateDraft>(
    key: K,
    value: CertificateDraft[K],
  ) => setDraft((prev) => ({ ...prev, [key]: value }));

const handleParticipantChange = (userId: string) => {
  setParticipantId(userId);
  const participant = participants.find((item) => item.id === userId);
  if (participant) setField("studentName", participant.fullName);
};

const handleCoachChange = (selectedCoachId: string) => {
  setCoachId(selectedCoachId);
  const coach = coaches.find((item) => item.id === selectedCoachId);
  if (coach) setField("coachName", coach.name);
};

  const applyCompetencyTemplate = (level: string) => {
    const items = COMPETENCY_TEMPLATES[level];
    if (!items) return;

    setField("competencies", items.join("\n"));
    if (!draft.level.trim()) setField("level", level);
  };

  const handleDownload = async (format: CertificateExportFormat) => {
    const node = captureRef.current;
    if (!node) return;

    if (!draft.studentName.trim()) {
      setError("Isi nama murid terlebih dahulu.");
      return;
    }
    if (!draft.level.trim()) {
      setError("Isi tingkat atau level terlebih dahulu.");
      return;
    }

    setBusyFormat(format);
    setError("");

    try {
      const blob = await renderCertificate(node, format, orientation);
      downloadBlob(blob, `${certificateFileBase(draft)}.${extensionFor(format)}`);
    } catch {
      setError("Gagal membuat berkas. Coba lagi.");
    } finally {
      setBusyFormat(null);
    }
  };

  const inputClass =
    "h-[36px] w-full rounded-lg border border-[#D6E5F3] bg-white px-3 text-[12px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5]";

  const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#073763]";

  const field = (
    key: keyof CertificateDraft,
    label: string,
    placeholder = "",
    type = "text",
  ) => (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={draft[key] as string}
        placeholder={placeholder}
        onChange={(e) => setField(key, e.target.value)}
        className={inputClass}
      />
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0A2540]/55 px-4 py-6"
      onClick={() => !busyFormat && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-generator-title"
        className="flex max-h-[94vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-xl border border-[#D6E5F3] bg-white shadow-[0_18px_48px_rgba(10,37,64,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E8F0F8] px-5 py-4">
          <div>
            <h3
              id="certificate-generator-title"
              className="text-[15px] font-bold text-[#073763]"
            >
              Edit Sertifikat
            </h3>
            <p className="mt-0.5 text-[11px] text-[#526B84]">
              Isi data, cek preview, lalu unduh. Setelah diunduh, unggah berkasnya
              ke peserta memakai tombol Terbitkan sertifikat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busyFormat)}
            aria-label="Tutup"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#526B84] transition-colors hover:bg-[#F0F7FF] disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body: form kiri, preview kanan */}
        <div className="flex min-h-0 flex-1">
          <div className="w-[430px] shrink-0 space-y-3 overflow-y-auto border-r border-[#E8F0F8] p-5">
            <label className="block">
              <span className={labelClass}>Pilih peserta</span>
              <select
                value={participantId}
                onChange={(e) => handleParticipantChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih peserta terdaftar...</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.fullName}
                  </option>
                ))}
              </select>
            </label>

            {field("studentName", "Nama murid", "Nama lengkap murid")}

            <label className="block">
              <span className={labelClass}>Nomor sertifikat</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft.certificateNo}
                  placeholder="001/SWIM/2026"
                  onChange={(e) => setField("certificateNo", e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setField("certificateNo", suggestedCertificateNo)}
                  title="Isi nomor berikutnya"
                  className="h-[36px] shrink-0 rounded-lg border border-[#D6E5F3] px-3 text-[11px] font-semibold text-[#1769AA] transition-colors hover:border-[#368DDF] hover:bg-[#F0F7FF]"
                >
                  Isi otomatis
                </button>
              </div>
            </label>

            <label className="block">
              <span className={labelClass}>Tingkat / level</span>
              <input
                type="text"
                list="certificate-level-options"
                value={draft.level}
                placeholder="Tingkat Dasar"
                onChange={(e) => setField("level", e.target.value)}
                className={inputClass}
              />
              <datalist id="certificate-level-options">
                {LEVEL_SUGGESTIONS.map((level) => (
                  <option key={level} value={level} />
                ))}
              </datalist>
            </label>

            {field("programName", "Nama program", "Contoh: Kelas Reguler")}

            <div className="grid grid-cols-2 gap-3">
              {field("startDate", "Tanggal mulai", "", "date")}
              {field("endDate", "Tanggal selesai", "", "date")}
            </div>

            {field(
              "locationName",
              "Lokasi pelatihan",
              "Kolam Renang Hotel Pelangi, Tanjungpinang",
            )}

            <label className="block">
              <span className={labelClass}>Daftar kompetensi</span>
              <textarea
                rows={5}
                value={draft.competencies}
                placeholder="Satu kompetensi per baris"
                onChange={(e) => setField("competencies", e.target.value)}
                className="w-full resize-y rounded-lg border border-[#D6E5F3] bg-white px-3 py-2 text-[12px] leading-[1.7] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5]"
              />
            </label>

            {competencyOverflow && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-[1.6] text-amber-700">
                {competencyCount} kompetensi, batas untuk orientasi{" "}
                {ORIENTATION_LABELS[orientation].toLowerCase()} adalah{" "}
                {COMPETENCY_LIMIT[orientation]}. Butir yang melebihi bisa
                terpotong di berkas unduhan - kurangi daftarnya atau pilih
                potrait.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] text-[#8FA3B8]">
                <Sparkles className="h-3 w-3" />
                Contoh:
              </span>
              {Object.keys(COMPETENCY_TEMPLATES).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => applyCompetencyTemplate(level)}
                  className="rounded-full border border-[#D6E5F3] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763]"
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field("issueCity", "Kota penerbitan", "Tanjungpinang")}
              {field("issueDate", "Tanggal penerbitan", "", "date")}
            </div>

            <label className="block">
              <span className={labelClass}>Nama pelatih</span>
              <select
                value={coachId}
                onChange={(e) => handleCoachChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih pelatih...</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </select>
            </label>

            {field("coachName", "Nama pelatih", "Nama lengkap pelatih")}
            {field("coachTitle", "Jabatan", "Head Coach Renang")}

            <div className="border-t border-[#E8F0F8] pt-3">
              <button
                type="button"
                onClick={() => setShowOrg((prev) => !prev)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1769AA]"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showOrg ? "" : "-rotate-90"}`}
                />
                Identitas lembaga
              </button>

              {showOrg && (
                <div className="mt-3 space-y-3">
                  {field("organizationName", "Nama lembaga", "SwimmingCourse")}
                  {field("organizationContact", "Kontak", "Alamat dan telepon")}
                  {field("organizationWebsite", "Situs web", "www.swimmingcourse.id")}
                </div>
              )}
            </div>
          </div>

          {/* Preview A4 */}
          <div className="min-w-0 flex-1 overflow-y-auto bg-[#F4F8FC] p-5">
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8FA3B8]">
                Orientasi
              </span>
              <div className="inline-flex rounded-lg border border-[#D6E5F3] bg-white p-0.5">
                {CERTIFICATE_ORIENTATIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setOrientation(option)}
                    aria-pressed={orientation === option}
                    title={
                      option === "portrait"
                        ? "A4 tegak (210 x 297 mm)"
                        : "A4 mendatar (297 x 210 mm)"
                    }
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      orientation === option
                        ? "bg-[#0D4D85] text-white"
                        : "text-[#526B84] hover:text-[#073763]"
                    }`}
                  >
                    <svg width="11" height="14" viewBox="0 0 11 14" aria-hidden="true">
                      <rect
                        x="0.75"
                        y="0.75"
                        width={option === "portrait" ? "9.5" : "13"}
                        height={option === "portrait" ? "12.5" : "7.5"}
                        rx="1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        transform={
                          option === "landscape"
                            ? "translate(-1.5, 3.25)"
                            : undefined
                        }
                      />
                    </svg>
                    {ORIENTATION_LABELS[option]}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                width: size.width * previewScale,
                height: size.height * previewScale,
                margin: "0 auto",
                overflow: "hidden",
                borderRadius: 4,
                boxShadow: "0 2px 10px rgba(10,37,64,0.12)",
              }}
            >
              <div
                style={{
                  width: size.width,
                  height: size.height,
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                }}
              >
                <CertificateDocument draft={draft} orientation={orientation} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer: unduh */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#E8F0F8] px-5 py-3">
          <p className="text-[10px] text-[#8FA3B8]">
            Unduhan langsung ke komputer Anda. Belum ada yang tersimpan ke
            server.
          </p>

          <div className="flex items-center gap-2">
            {error && (
              <span className="mr-1 text-[11px] font-medium text-red-500">
                {error}
              </span>
            )}

            {(
              [
                { format: "png" as const, label: "PNG", Icon: FileImage },
                { format: "jpg" as const, label: "JPG", Icon: FileImage },
                { format: "pdf" as const, label: "PDF", Icon: FileText },
              ]
            ).map(({ format, label, Icon }) => (
              <button
                key={format}
                type="button"
                onClick={() => handleDownload(format)}
                disabled={Boolean(busyFormat)}
                className={`inline-flex h-[36px] items-center gap-2 rounded-lg px-4 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  format === "pdf"
                    ? "bg-[#0A3966] text-white hover:bg-[#0A2540]"
                    : "border border-[#D6E5F3] bg-white text-[#1769AA] hover:border-[#368DDF] hover:bg-[#F0F7FF]"
                }`}
              >
                {busyFormat === format ? (
                  <Download className="h-3.5 w-3.5 animate-bounce" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {busyFormat === format ? "Membuat..." : `Unduh ${label}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target rasterisasi: ukuran penuh, tanpa scaling, di luar viewport. */}
      <div
        ref={captureRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: "-10000px",
          width: size.width,
          height: size.height,
          pointerEvents: "none",
        }}
      >
        <CertificateDocument draft={draft} orientation={orientation} />
      </div>
    </div>
  );
}
