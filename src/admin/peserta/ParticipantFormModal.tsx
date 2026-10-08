"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ParticipantRow } from "@/admin/types";

const MIN_PASSWORD_LENGTH = 8;

type Errors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  form?: string;
};

type ParticipantFormModalProps = {
  mode: "create" | "edit";
  participant: ParticipantRow | null;
  onClose: () => void;
  onSaved: () => void;
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

export default function ParticipantFormModal({
  mode,
  participant,
  onClose,
  onSaved,
}: ParticipantFormModalProps) {
  const isEdit = mode === "edit";

  // Modal di-mount ulang setiap kali dibuka, jadi initial state langsung dari
  // props tanpa perlu menyalinnya lewat effect.
  const [form, setForm] = useState(() =>
    participant
      ? {
          firstName: participant.firstName,
          lastName: participant.lastName,
          email: participant.email,
          phone: participant.phone,
          password: "",
        }
      : emptyForm,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const setField = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};

    if (!form.firstName.trim()) next.firstName = "Nama depan wajib diisi.";
    if (!form.lastName.trim()) next.lastName = "Nama belakang wajib diisi.";

    const email = form.email.trim().toLowerCase();
    if (!email) {
      next.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Format email tidak valid.";
    }

    const digits = form.phone.replace(/\D/g, "");
    if (!form.phone.trim()) {
      next.phone = "Nomor telepon wajib diisi.";
    } else if (digits.length < 9 || digits.length > 15) {
      next.phone = "Nomor telepon harus 9-15 digit.";
    }

    if (!isEdit && form.password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setErrors({});

    try {
      const res = await fetch(
        isEdit ? `/api/admin/participants/${participant?.id}` : "/api/admin/participants",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error ?? "Gagal menyimpan peserta.";

        // Petakan pesan server ke field yang relevan supaya tampil inline.
        if (/email/i.test(message)) setErrors({ email: message });
        else if (/telepon/i.test(message)) setErrors({ phone: message });
        else if (/sandi/i.test(message)) setErrors({ password: message });
        else setErrors({ form: message });

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
    `h-[36px] w-full rounded-lg border px-3 text-[12px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5] ${
      error ? "border-red-400" : "border-[#D6E5F3]"
    } bg-white`;

  const field = (
    key: "firstName" | "lastName" | "email" | "phone" | "password",
    label: string,
    type = "text",
    placeholder = "",
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
        {label}
      </span>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setField(key)(e.target.value)}
        className={inputClass(errors[key])}
      />
      {errors[key] && (
        <span className="mt-1 block text-[10px] text-red-500">{errors[key]}</span>
      )}
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A2540]/50 px-4 py-6"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-form-title"
        className="max-h-full w-full max-w-[440px] overflow-y-auto rounded-xl border border-[#D6E5F3] bg-white p-5 shadow-[0_12px_32px_rgba(10,37,64,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              id="participant-form-title"
              className="text-[15px] font-bold text-[#073763]"
            >
              {isEdit ? "Ubah data peserta" : "Tambah peserta"}
            </h3>
            <p className="mt-1 text-[11px] text-[#526B84]">
              {isEdit
                ? "Perubahan langsung tersimpan."
                : "Akun baru dibuat langsung aktif dan bisa dipakai peserta untuk masuk."}
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
          <div className="grid gap-3.5 sm:grid-cols-2">
            {field("firstName", "Nama depan", "text", "Nadia")}
            {field("lastName", "Nama belakang", "text", "Syafani")}
          </div>

          {field("email", "Email", "email", "nama@email.com")}
          {field("phone", "No. telepon", "tel", "081234567890")}

          {!isEdit && field("password", "Kata sandi", "password", "Minimal 8 karakter")}

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
              {saving ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Tambah peserta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}