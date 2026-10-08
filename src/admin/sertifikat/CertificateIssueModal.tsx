"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { todayInputValue } from "@/lib/certificate-fields";
import type { CertificateRow, SwimStatus } from "@/admin/types";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const STATUS_OPTIONS: { value: SwimStatus; label: string }[] = [
  { value: "bisa_berenang", label: "Bisa berenang" },
  { value: "belum_dievaluasi", label: "Belum dievaluasi" },
];

type Errors = {
  file?: string;
  courseName?: string;
  issueDate?: string;
  form?: string;
};

type CertificateIssueModalProps = {
  row: CertificateRow;
  /** Nama admin penerbit, disimpan ke `certificates.issued_by`. */
  issuedBy: string;
  onClose: () => void;
  onSaved: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


export default function CertificateIssueModal({
  row,
  issuedBy,
  onClose,
  onSaved,
}: CertificateIssueModalProps) {
  const fullName = `${row.firstName} ${row.lastName}`;
  const isReissue = row.certificateId !== null;

  const [file, setFile] = useState<File | null>(null);
  const [courseName, setCourseName] = useState(row.certificateCourse ?? row.programName ?? "");
  const [issueDate, setIssueDate] = useState(todayInputValue());
  // Default "Bisa berenang": inilah tujuan menerbitkan sertifikat, dan admin
  // tetap bisa memilih lain lewat dropdown status kemampuan.
  const [swimStatus, setSwimStatus] = useState<SwimStatus>("bisa_berenang");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const pickFile = (selected: File | null) => {
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setErrors((prev) => ({
        ...prev,
        file: "Hanya PDF, PNG, JPEG, atau WebP yang diperbolehkan.",
      }));
      return;
    }

    if (selected.size > MAX_BYTES) {
      setErrors((prev) => ({
        ...prev,
        file: `Ukuran berkas ${formatBytes(selected.size)} melebihi batas 2 MB.`,
      }));
      return;
    }

    setFile(selected);
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};

    if (!file) next.file = "Berkas sertifikat wajib diunggah.";
    if (!courseName.trim()) next.courseName = "Nama program wajib diisi.";
    if (!issueDate) next.issueDate = "Tanggal terbit wajib diisi.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !validate()) return;

    setSaving(true);
    setErrors({});

    try {
      const fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Gagal membaca berkas."));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: row.userId,
          courseName: courseName.trim(),
          issueDate: new Date(`${issueDate}T00:00:00+07:00`).toISOString(),
          fileUrl,
          swimStatus,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error ?? "Gagal menerbitkan sertifikat.";

        if (/berkas|pdf|png|jpeg|webp|2 mb/i.test(message)) {
          setErrors({ file: message });
        } else if (/program/i.test(message)) {
          setErrors({ courseName: message });
        } else if (/tanggal/i.test(message)) {
          setErrors({ issueDate: message });
        } else {
          setErrors({ form: message });
        }

        return;
      }

      onSaved();
    } catch {
      setErrors({ form: "Gagal menghubungi server." });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (error?: string) =>
    `h-[36px] w-full rounded-lg border px-3 text-[12px] text-[#073763] outline-none transition-colors focus:border-[#2F8FE5] ${
      error ? "border-red-400" : "border-[#D6E5F3]"
    } bg-white`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A2540]/50 px-4 py-6"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-issue-title"
        className="max-h-full w-full max-w-[460px] overflow-y-auto rounded-xl border border-[#D6E5F3] bg-white p-5 shadow-[0_12px_32px_rgba(10,37,64,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              id="certificate-issue-title"
              className="text-[15px] font-bold text-[#073763]"
            >
              {isReissue ? "Perbarui sertifikat" : "Terbitkan sertifikat"}
            </h3>
            <p className="mt-1 text-[11px] text-[#526B84]">
              Untuk {fullName}. Setelah disimpan, sertifikat langsung tampil di
              halaman Sertifikat peserta.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#526B84] transition-colors hover:bg-[#F0F7FF] disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errors.form && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {errors.form}
          </p>
        )}

        <form className="mt-5 flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
          {/* Unggah berkas */}
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Berkas sertifikat
            </span>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={saving}
              className={`flex w-full items-center gap-3 rounded-lg border border-dashed px-3 py-3 text-left transition-colors disabled:opacity-60 ${
                errors.file
                  ? "border-red-400 bg-red-50"
                  : file
                    ? "border-[#7FCBA5] bg-[#EFFAF4]"
                    : "border-[#BBD4EC] bg-[#FAFCFF] hover:border-[#368DDF] hover:bg-[#F0F7FF]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  file ? "bg-[#DFF7EC] text-[#1F9C63]" : "bg-[#EAF4FD] text-[#1769AA]"
                }`}
              >
                <FileUp className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-semibold text-[#073763]">
                  {file ? file.name : "Pilih berkas PDF atau gambar"}
                </span>
                <span className="mt-0.5 block text-[10px] text-[#8FA3B8]">
                  {file
                    ? formatBytes(file.size)
                    : "PDF, PNG, JPEG, atau WebP · maksimal 2 MB"}
                </span>
              </span>
            </button>
            {errors.file && (
              <span className="mt-1 block text-[10px] text-red-500">{errors.file}</span>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Program
            </span>
            <input
              type="text"
              value={courseName}
              placeholder="Contoh: Renang Pemula"
              onChange={(e) => {
                setCourseName(e.target.value);
                setErrors((prev) => ({ ...prev, courseName: undefined }));
              }}
              className={inputClass(errors.courseName)}
            />
            {errors.courseName && (
              <span className="mt-1 block text-[10px] text-red-500">
                {errors.courseName}
              </span>
            )}
          </label>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Tanggal terbit
              </span>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => {
                  setIssueDate(e.target.value);
                  setErrors((prev) => ({ ...prev, issueDate: undefined }));
                }}
                className={inputClass(errors.issueDate)}
              />
              {errors.issueDate && (
                <span className="mt-1 block text-[10px] text-red-500">
                  {errors.issueDate}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Status kemampuan
              </span>
              <select
                value={swimStatus}
                onChange={(e) => setSwimStatus(e.target.value as SwimStatus)}
                className={inputClass()}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="rounded-lg bg-[#F0F7FF] px-3 py-2 text-[10px] leading-[1.6] text-[#1769AA]">
            Diterbitkan oleh {issuedBy}. Berkas disimpan di database dan akan
            muncul otomatis di halaman Sertifikat {fullName}.
          </p>

          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-[38px] flex-1 rounded-lg border border-[#D6E5F3] text-[12px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-[38px] flex-1 rounded-lg bg-[#0A3966] text-[12px] font-semibold text-white transition-colors hover:bg-[#0A2540] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Menyimpan..."
                : isReissue
                  ? "Simpan perubahan"
                  : "Terbitkan sertifikat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
