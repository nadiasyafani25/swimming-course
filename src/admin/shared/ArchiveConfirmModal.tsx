"use client";

import { useEffect, useState } from "react";
import { ArchiveRestore, Trash2, X } from "lucide-react";

type ArchiveConfirmModalProps = {
  /** Nama subjek */
  subject: string;
  /**kondisi aja ini kalau true = sedang aktif dan akan dinonaktifkan; false = akan diaktifkan lagi. */
  isActive: boolean;
  noun?: string;
  /** Penjelasan singkat tentang akibatnya, tampil di bawah nama subjek. */
  body?: string;
  confirmLabel?: string;
  onClose: () => void;
  /** Kembalikan `{ ok: false, error }` supaya pesan server bisa ditampilkan */
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
};

/**
 * Konfirmasi status aktif/nonaktif untuk catatan yang diarsipkan, bukan dihapus.
 * Dipakai peserta dan pelatih supaya keduanya tidak punya dialog sendiri.
 */
export default function ArchiveConfirmModal({
  subject,
  isActive,
  noun = "data",
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: ArchiveConfirmModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const handleConfirm = async () => {
    setSaving(true);
    setError("");

    try {
      const result = await onConfirm();
      if (!result.ok) {
        setError(result.error ?? "Gagal mengubah status. Silakan coba lagi.");
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A2540]/50 px-4"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-confirm-title"
        className="w-full max-w-[400px] rounded-xl border border-[#D6E5F3] bg-white p-5 shadow-[0_12px_32px_rgba(10,37,64,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isActive ? "bg-[#FDEBEB]" : "bg-[#DFF7EC]"
              }`}
            >
              {isActive ? (
                <Trash2 className="h-4 w-4 text-red-500" />
              ) : (
                <ArchiveRestore className="h-4 w-4 text-[#1F9C63]" />
              )}
            </span>
            <div className="min-w-0">
              <h3
                id="archive-confirm-title"
                className="text-[14px] font-bold text-[#073763]"
              >
                {isActive ? `Nonaktifkan ${noun} ini?` : `Aktifkan kembali ${noun}?`}
              </h3>
              <p className="mt-1 text-[11px] leading-[1.7] text-[#526B84]">
                <strong className="font-semibold text-[#073763]">{subject}</strong>{" "}
                {body ??
                  (isActive
                    ? "tidak akan dipakai lagi. Datanya tetap disimpan dan bisa diaktifkan kembali."
                    : "akan dipakai lagi seperti semula.")}
              </p>
            </div>
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

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-[36px] flex-1 rounded-lg border border-[#D6E5F3] text-[12px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className={`h-[36px] flex-1 rounded-lg text-[12px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive ? "bg-red-600 hover:bg-red-700" : "bg-[#1F9C63] hover:bg-[#178050]"
            }`}
          >
            {saving
              ? "Memproses..."
              : (confirmLabel ?? (isActive ? "Ya, nonaktifkan" : "Ya, aktifkan"))}
          </button>
        </div>
      </div>
    </div>
  );
}