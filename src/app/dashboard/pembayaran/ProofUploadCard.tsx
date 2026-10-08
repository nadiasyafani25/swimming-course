"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, X } from "lucide-react";
import {
  formatBytes,
  isAllowedPaymentProofType,
  MAX_PAYMENT_PROOF_BYTES,
  PAYMENT_PROOF_ACCEPT,
} from "@/lib/payment-proof";
import type { PaymentMethod } from "@/lib/payment-method";

type ProofUploadCardProps = {
  /** Id tagihan yang menunggu bukti; null kalau tidak ada tagihan aktif. */
  paymentId: string | null;
  /** Periode tagihan sudah diformat di server, mis. "1 Oktober 2026". */
  periodLabel: string | null;
  /** Peserta sudah pernah mengirim bukti untuk tagihan ini. */
  hasProof: boolean;
  /**
   * Metode yang dipilih peserta diatarinya.
   *
   * Dikirim bersama berkas karena `payments.method` menggambarkan bukti yang
   * dikirim, bukan pilihan sesaat. Kalau bukti diunggah ulang, method lama ikut
   * tergantikan supaya admin tidak memverifikasi bukti transfer tapi melihat
   * tagihan yang tercatat sebagai QRIS.
   */
  method: PaymentMethod | null;
  /** Label metode untuk ditampilkan di pesan konfirmasi. */
  methodLabel: string;
};

/**
 * Unggah bukti pembayaran untuk satu tagihan yang sedang menunggu.
 *
 * Validasi MIME dan ukuran dicek di browser supaya kesalahan ketik ketahuan
 * sebelum base64 masuk ke memori dan dikirim. Aturannya tetap diulang di
 * `POST /api/payments/[id]/proof` karena pemeriksaan di browser bisa dilewati
 * dan tidak pernah jadi satu-satunya penjaga.
 *
 * Berkas dibaca jadi data URL lalu dikirim sebagai JSON. Setelah tersimpan,
 * `router.refresh()` dipakai supaya status tagihan dan kartu ringkasan ikut
 * berubah dari server — bukan dari state lokal, supaya angka yang sama dengan
 * yang dilihat admin.
 */
export default function ProofUploadCard({
  paymentId,
  periodLabel,
  hasProof,
  method,
  methodLabel,
}: ProofUploadCardProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const disabled = !paymentId || saving;

  const pickFile = (selected: File | null) => {
    setNotice(null);
    setFormError(null);

    if (!selected) return;

    if (!isAllowedPaymentProofType(selected.type)) {
      setFile(null);
      setFileError("Hanya JPG, PNG, atau PDF yang diperbolehkan.");
      return;
    }

    if (selected.size > MAX_PAYMENT_PROOF_BYTES) {
      setFile(null);
      setFileError(
        `Ukuran berkas ${formatBytes(selected.size)} melebihi batas 5 MB.`,
      );
      return;
    }

    setFile(selected);
    setFileError(null);
  };

  const handleSubmit = async () => {
    if (!paymentId || !file) {
      setFileError("Pilih bukti pembayaran terlebih dahulu.");
      return;
    }
    if (!method) {
      setFormError("Pilih metode pembayaran terlebih dahulu.");
      return;
    }

    setSaving(true);
    setFileError(null);
    setFormError(null);

    try {
      const fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Gagal membaca berkas."));
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/api/payments/${paymentId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, method }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error ?? "Gagal mengirim bukti pembayaran.";

        // Pesan yang menyangkut berkas ditampilkan tepat di area pilihan file,
        // sisanya di bawah tombol supaya tidak menggeser dropzone.
        if (/berkas|jpg|png|pdf|5 mb/i.test(message)) {
          setFileError(message);
        } else {
          setFormError(message);
        }

        return;
      }

      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setNotice(
        `Bukti ${methodLabel} terkirim. Status tagihan menunggu verifikasi admin.`,
      );
      router.refresh();
    } catch {
      setFormError("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  if (!paymentId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[9px] border-2 border-dashed border-[#D6E5F3] bg-[#FAFCFF] px-6 py-6 text-center">
        <p className="text-[12px] font-medium text-[#073763]">
          Belum ada tagihan yang menunggu bukti
        </p>
        <p className="mt-1 text-[11px] text-[#8FA3B8]">
          Bukti pembayaran bisa diunggah setelah ada tagihan aktif.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold text-[#073763]">
        Upload bukti pembayaran
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={PAYMENT_PROOF_ACCEPT}
        className="sr-only"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
        disabled={disabled}
        className={`flex w-full flex-col items-center justify-center rounded-[9px] border-2 border-dashed px-6 py-6 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          fileError
            ? "border-red-300 bg-red-50"
            : file
              ? "border-[#7FCBA5] bg-[#EFFAF4]"
              : dragging
                ? "border-[#2F8FE5] bg-[#F0F7FF]"
                : "border-[#D6E5F3] bg-[#FAFCFF] hover:border-[#2F8FE5] hover:bg-[#F0F7FF]"
        }`}
      >
        {file ? (
          <>
            <span className="text-[12px] font-medium text-[#073763]">
              {file.name}
            </span>
            <span className="mt-1 text-[11px] text-[#8FA3B8]">
              {formatBytes(file.size)} · klik untuk ganti
            </span>
          </>
        ) : (
          <>
            <FileUp className="mb-2 h-5 w-5 text-[#A9BACB]" />
            <p className="text-[12px] font-medium text-[#073763]">
              Seret file ke sini atau klik untuk memilih
            </p>
            <p className="mt-1 text-[11px] text-[#8FA3B8]">
              Format JPG, PNG, atau PDF · maks 5MB
            </p>
          </>
        )}
      </button>

      {fileError && (
        <p role="alert" className="mt-1.5 text-[11px] text-red-600">
          {fileError}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mt-2 rounded-md border border-[#BFE3D2] bg-[#F1FBF6] px-3 py-2 text-[11px] font-medium text-[#0B7A4B]"
        >
          {notice}
        </p>
      )}

      {hasProof && !notice && (
        <p className="mt-2 text-[11px] text-[#526B84]">
          Bukti untuk tagihan {periodLabel ?? "ini"} sudah pernah dikirim.
          Mengunggah lagi akan menggantinya dan menunggu verifikasi admin.
        </p>
      )}

      {formError && (
        <p
          role="alert"
          className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600"
        >
          {formError}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={disabled || !file || !method}
        className="mt-5 flex h-[38px] w-full items-center justify-center gap-2 rounded-md bg-[#0D4D85] text-[12px] font-semibold text-white transition-colors hover:bg-[#0a3f6d] disabled:cursor-not-allowed disabled:bg-[#B9C9D8]"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {saving
          ? "Mengirim..."
          : file
            ? `Kirim bukti ${methodLabel.toLowerCase()}`
            : "Pilih bukti pembayaran dulu"}
      </button>

      {file && !saving && (
        <button
          type="button"
          onClick={() => {
            setFile(null);
            setFileError(null);
            setFormError(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-[11px] font-medium text-[#8FA3B8] transition-colors hover:text-[#073763]"
        >
          <X className="h-3 w-3" />
          Batalkan pilihan
        </button>
      )}
    </div>
  );
}