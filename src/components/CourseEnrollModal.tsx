"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type CourseEnrollModalProps = {
  open: boolean;
  courseTitle: string;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  onClose: () => void;
};

export default function CourseEnrollModal({
  open,
  courseTitle,
  defaultName,
  defaultEmail,
  defaultPhone,
  onClose,
}: CourseEnrollModalProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      errors.name = "Nama wajib diisi.";
    }
    if (!email.trim()) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Format email tidak valid.";
    }
    if (!phone.trim()) {
      errors.phone = "Nomor HP wajib diisi.";
    }

    setFieldErrors(errors);
    setSubmitError("");
    setSuccess("");

    if (Object.keys(errors).length > 0) return;

    setSending(true);

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          program: courseTitle,
          notes,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Terjadi kesalahan.");
      }

      setSuccess("Pendaftaran berhasil dikirim.");
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan server.",
      );
    } finally {
      setSending(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `h-[34px] w-full rounded-md border px-[11px] text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#2F8FE5] ${
      hasError ? "border-red-400" : "border-[#D6E5F3]"
    } bg-[#F8FBFE]`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#062c4e]/40 px-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enroll-modal-title"
        className="w-full max-w-[400px] rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_8px_24px_rgba(7,55,99,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              id="enroll-modal-title"
              className="text-[15px] font-bold text-[#073763]"
            >
              Daftar {courseTitle}
            </h3>
            <p className="mt-1 text-[11px] text-[#8FA3B8]">
              Data sudah terisi dari akun Anda. Periksa sebelum mengirim.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            aria-label="Tutup formulir pendaftaran"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#8FA3B8] transition-colors hover:bg-[#F3F8FD] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success && (
          <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700">
            {success}
          </p>
        )}

        {submitError && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {submitError}
          </p>
        )}

        <form className="mt-4 flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="enroll-name"
              className="text-[11px] font-semibold text-[#073763]"
            >
              Nama
            </label>
            <input
              id="enroll-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass(!!fieldErrors.name)}
            />
            {fieldErrors.name && (
              <p className="text-[10px] text-red-500">{fieldErrors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="enroll-email"
              className="text-[11px] font-semibold text-[#073763]"
            >
              Email
            </label>
            <input
              id="enroll-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass(!!fieldErrors.email)}
            />
            {fieldErrors.email && (
              <p className="text-[10px] text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="enroll-phone"
              className="text-[11px] font-semibold text-[#073763]"
            >
              Nomor HP / WhatsApp
            </label>
            <input
              id="enroll-phone"
              type="tel"
              placeholder="08xx-xxxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass(!!fieldErrors.phone)}
            />
            {fieldErrors.phone && (
              <p className="text-[10px] text-red-500">{fieldErrors.phone}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="enroll-notes"
              className="text-[11px] font-semibold text-[#073763]"
            >
              Catatan (opsional)
            </label>
            <textarea
              id="enroll-notes"
              rows={2}
              placeholder="Contoh: pemula, jadwal sore"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-y rounded-md border border-[#D6E5F3] bg-[#F8FBFE] px-[11px] py-2 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#2F8FE5]"
            />
          </div>

          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="h-[34px] flex-1 rounded-md border border-[#D6E5F3] text-[11px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={sending}
              className="h-[34px] flex-1 rounded-md bg-[#0D4D85] text-[11px] font-semibold text-white transition-colors hover:bg-[#0a3f6d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Mengirim..." : "Kirim pendaftaran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}