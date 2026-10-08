"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, Pencil, X } from "lucide-react";
import type { CertificateRow } from "@/admin/types";

type CertificatePreviewModalProps = {
  row: CertificateRow;
  onClose: () => void;
  /** Buka modal terbitkan ulang untuk mengganti berkas atau tanggal. */
  onEdit: () => void;
};

/**
 * Pratinjau sertifikat.
 *
 * Berkas diambil dari route `/api/admin/certificates/[id]/file` saat modal
 * dibuka, bukan ikut di props tabel — supaya halaman admin tidak memuat berkas
 * (hingga 2 MB) untuk setiap peserta yang sertifikatnya sudah terbit.
 */
export default function CertificatePreviewModal({
  row,
  onClose,
  onEdit,
}: CertificatePreviewModalProps) {
  const fullName = `${row.firstName} ${row.lastName}`;
  const certificateId = row.certificateId;
  const filePath = certificateId
    ? `/api/admin/certificates/${certificateId}/file`
    : "";

  const [state, setState] = useState<"loading" | "ready" | "error">(() =>
    filePath ? "loading" : "error",
  );
  const [mimeType, setMimeType] = useState("");
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Modal hanya dibuka untuk peserta yang sertifikatnya sudah terbit, tapi
    // tetap dijaga agar permintaan ke URL kosong tidak pernah terkirim.
    if (!filePath) return;

    let cancelled = false;

    fetch(filePath)
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat berkas.");
        const type = res.headers.get("Content-Type") ?? "";
        const blob = await res.blob();
        if (cancelled) return;

        setMimeType(type);
        setObjectUrl(URL.createObjectURL(blob));
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  useEffect(() => {
    if (!objectUrl) return;

    // Object URL di-revoke saat modal ditutup supaya blob-nya tidak mengdang
    // di memori selama admin berpindah-pindah peserta.
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A2540]/50 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-preview-title"
        className="flex max-h-full w-full max-w-[620px] flex-col overflow-hidden rounded-xl border border-[#D6E5F3] bg-white shadow-[0_12px_32px_rgba(10,37,64,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E8F0F8] px-5 py-4">
          <div className="min-w-0">
            <h3
              id="certificate-preview-title"
              className="text-[15px] font-bold text-[#073763]"
            >
              Pratinjau sertifikat
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-[#526B84]">
              {fullName}
              {row.certificateCourse ? ` · ${row.certificateCourse}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#526B84] transition-colors hover:bg-[#F0F7FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-[240px] flex-1 overflow-auto bg-[#F8FBFE] p-4">
          {state === "loading" && (
            <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-[#8FA3B8]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-[11px]">Memuat berkas sertifikat...</p>
            </div>
          )}

          {state === "error" && (
            <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
              <p className="text-[12px] font-semibold text-[#526B84]">
                Berkas tidak dapat dimuat
              </p>
              <p className="max-w-[280px] text-[11px] leading-[1.7] text-[#8FA3B8]">
                Sertifikat untuk {fullName} sudah terbit, tetapi berkasnya
                bermasalah. Coba unduh berkasnya atau terbitkan ulang.
              </p>
            </div>
          )}

          {state === "ready" && mimeType === "application/pdf" && (
            <iframe
              src={objectUrl}
              title={`Pratinjau sertifikat ${fullName}`}
              className="h-[420px] w-full rounded-lg border border-[#D6E5F3] bg-white"
            />
          )}

          {state === "ready" && mimeType.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={objectUrl}
              alt={`Sertifikat ${fullName}`}
              className="mx-auto max-h-[420px] w-auto rounded-lg border border-[#D6E5F3] bg-white"
            />
          )}

          {state === "ready" && (
            <div className="mt-3 flex justify-center">
              <a
                href={filePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1769AA] transition-colors hover:text-[#0D4D85]"
              >
                <ExternalLink className="h-3 w-3" />
                Buka di tab baru
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E8F0F8] px-5 py-3">
          <p className="text-[10px] text-[#8FA3B8]">
            {row.issuedBy ? `Diterbitkan oleh ${row.issuedBy}` : "Diterbitkan admin"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-[#D6E5F3] px-3 text-[11px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763]"
            >
              <Pencil className="h-3.5 w-3.5" />
              Perbarui
            </button>
            <a
              href={`${filePath}?download=1`}
              download
              className="inline-flex h-[34px] items-center gap-2 rounded-lg bg-[#0A3966] px-4 text-[11px] font-semibold text-white transition-colors hover:bg-[#0A2540]"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}