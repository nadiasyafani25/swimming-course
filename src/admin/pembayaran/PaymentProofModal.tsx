"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, X } from "lucide-react";
import type { PaymentRow } from "@/admin/types";
import { getPaymentStatusMeta } from "@/lib/payment-status";
import {
  formatDueDate,
  formatPeriodMonth,
  formatRupiah,
} from "@/admin/pembayaran/payment-format";

type PaymentProofModalProps = {
  payment: PaymentRow;
  onClose: () => void;
};

/**
 * Pratinjau bukti bayar yang diunggah peserta.
 *
 * Berkas diambil dari route `/api/admin/payments/[id]/proof` saat modal dibuka,
 * bukan ikut di props tabel. Bukti disimpan sebagai data URL base64 yang bisa
 * mencapai 5 MB; kalau ikut diteruskan ke tabel, seluruh bukti akan ikut
 * ter-inline ke payload halaman admin setiap kali panel pembayaran dibuka.
 *
 * Jenis berkasnya dibaca dari header `Content-Type`, bukan ditebak dari
 * ekstensi URL — data URL tidak punya ekstensi.
 */
export default function PaymentProofModal({
  payment,
  onClose,
}: PaymentProofModalProps) {
  const proofPath = `/api/admin/payments/${payment.id}/proof`;

  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">(
    payment.hasProof ? "loading" : "empty",
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
    if (!payment.hasProof) return;

    let cancelled = false;

    fetch(proofPath)
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat bukti pembayaran.");
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
  }, [payment.hasProof, proofPath]);

  useEffect(() => {
    // Blob dilepas saat modal ditutup supaya berkas bukti tidak mengdang di
    // memori selama admin berpindah-pindah tagihan.
    if (!objectUrl) return;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const meta = getPaymentStatusMeta(payment.status);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A2540]/50 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-proof-title"
        className="flex max-h-full w-full max-w-[720px] flex-col overflow-hidden rounded-xl border border-[#D6E5F3] bg-white shadow-[0_12px_32px_rgba(10,37,64,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#D6E5F3] px-5 py-4">
          <div className="min-w-0">
            <h3
              id="payment-proof-title"
              className="truncate text-[15px] font-bold text-[#073763]"
            >
              Bukti bayar - {payment.participantName}
            </h3>
            <p className="mt-1 text-[11px] text-[#526B84]">
              {formatRupiah(payment.amount)} · {payment.methodLabel} ·{" "}
              {payment.packageName ?? "Tanpa paket"} · Tagihan{" "}
              {formatPeriodMonth(payment.periodMonth)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau bukti"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#526B84] transition-colors hover:bg-[#F0F7FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#F8FAFC] p-4">
          {state === "loading" && (
            <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-[#8FA3B8]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-[11px]">Memuat bukti pembayaran...</p>
            </div>
          )}

          {state === "empty" && (
            <div className="flex flex-col items-center justify-center rounded-[9px] border border-dashed border-[#D6E5F3] bg-white px-6 py-14 text-center">
              <FileText className="h-7 w-7 text-[#C7D7E6]" />
              <p className="mt-3 text-[13px] font-semibold text-[#073763]">
                Belum ada bukti pembayaran
              </p>
              <p className="mt-1 max-w-[380px] text-[11px] text-[#8FA3B8]">
                Peserta belum mengunggah bukti untuk tagihan{" "}
                {formatPeriodMonth(payment.periodMonth)}. Jatuh tempo{" "}
                {formatDueDate(payment.dueDate)}.
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center justify-center rounded-[9px] border border-dashed border-[#F0C9C9] bg-white px-6 py-14 text-center">
              <FileText className="h-7 w-7 text-[#E0A5A5]" />
              <p className="mt-3 text-[13px] font-semibold text-[#073763]">
                Bukti pembayaran tidak dapat dimuat
              </p>
              <p className="mt-1 max-w-[380px] text-[11px] text-[#8FA3B8]">
                Bukti untuk tagihan ini tercatat sudah dikirim, tetapi berkasnya
                bermasalah. Minta peserta mengunggah ulang lewat halaman
                Pembayaran.
              </p>
            </div>
          )}

          {state === "ready" && mimeType === "application/pdf" && (
            <iframe
              src={objectUrl}
              title={`Bukti bayar ${payment.participantName}`}
              className="h-[60vh] w-full rounded-[9px] border border-[#D6E5F3] bg-white"
            />
          )}

          {state === "ready" && mimeType.startsWith("image/") && (
            // Bukti bayar berupa data URL dari browser peserta dengan dimensi
            // yang tidak diketahui, jadi next/image tidak bisa dipakai.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={objectUrl}
              alt={`Bukti bayar ${payment.participantName}`}
              className="mx-auto max-h-[60vh] rounded-[9px] border border-[#D6E5F3] bg-white object-contain"
            />
          )}

          {state === "ready" &&
            mimeType !== "application/pdf" &&
            !mimeType.startsWith("image/") && (
              <div className="flex flex-col items-center justify-center rounded-[9px] border border-dashed border-[#D6E5F3] bg-white px-6 py-14 text-center">
                <FileText className="h-7 w-7 text-[#C7D7E6]" />
                <p className="mt-3 text-[12px] font-semibold text-[#073763]">
                  Format bukti tidak dikenali
                </p>
                <a
                  href={proofPath}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 text-[11px] font-semibold text-[#1769AA] underline"
                >
                  Buka berkas di tab baru
                </a>
              </div>
            )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#D6E5F3] px-5 py-3">
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-[9px] font-medium ${meta.badge}`}
          >
            {meta.label}
          </span>
          {payment.hasProof && (
            <a
              href={`${proofPath}?download=1`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-[#1769AA] hover:underline"
            >
              Buka di tab baru
            </a>
          )}
        </div>
      </div>
    </div>
  );
}