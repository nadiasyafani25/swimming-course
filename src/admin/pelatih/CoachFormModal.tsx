"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { CoachRow } from "@/admin/types";

type Errors = {
  name?: string;
  certification?: string;
  background?: string;
  phone?: string;
  email?: string;
  form?: string;
};

type CoachFormModalProps = {
  mode: "create" | "edit";
  coach: CoachRow | null;
  onClose: () => void;
  onSaved: () => void;
};

const emptyForm = {
  name: "",
  certification: "",
  background: "",
  phone: "",
  email: "",
};

export default function CoachFormModal({
  mode,
  coach,
  onClose,
  onSaved,
}: CoachFormModalProps) {
  const isEdit = mode === "edit";

  // Modal di-mount ulang tiap dibuka, jadi initial state cukup dari props.
  const [form, setForm] = useState(() =>
    coach
      ? {
          name: coach.name,
          certification: coach.certification ?? "",
          background: coach.background ?? "",
          phone: coach.phone,
          email: coach.email,
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

    if (!form.name.trim()) {
      next.name = "Nama pelatih wajib diisi.";
    } else if (form.name.trim().length > 100) {
      next.name = "Nama maksimal 100 karakter.";
    }

    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 15) {
        next.phone = "Nomor telepon harus 9-15 digit.";
      }
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Format email tidak valid.";
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
        isEdit ? `/api/admin/coaches/${coach?.id}` : "/api/admin/coaches",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error ?? "Gagal menyimpan pelatih.";

        if (/nama/i.test(message)) setErrors({ name: message });
        else if (/telepon/i.test(message)) setErrors({ phone: message });
        else if (/email/i.test(message)) setErrors({ email: message });
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
    `w-full rounded-lg border px-3 text-[12px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5] ${
      error ? "border-red-400" : "border-[#D6E5F3]"
    } bg-white`;

  const textField = (
    key: "name" | "certification" | "phone" | "email",
    label: string,
    placeholder = "",
    optional = false,
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-[#A9BACB]">(opsional)</span>
        )}
      </span>
      <input
        type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setField(key)(e.target.value)}
        className={`${inputClass(errors[key])} h-[36px]`}
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
        aria-labelledby="coach-form-title"
        className="max-h-full w-full max-w-[460px] overflow-y-auto rounded-xl border border-[#D6E5F3] bg-white p-5 shadow-[0_12px_32px_rgba(10,37,64,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="coach-form-title" className="text-[15px] font-bold text-[#073763]">
              {isEdit ? "Ubah data pelatih" : "Tambah pelatih"}
            </h3>
            <p className="mt-1 text-[11px] leading-[1.6] text-[#526B84]">
              {isEdit
                ? "Kalau nama diubah, course dan jadwal yang memakai nama ini ikut terupdate."
                : "Kosongkan lisensi kalau Belum ada. Pelatih baru langsung aktif."}
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
          {textField("name", "Nama pelatih", "Nama lengkap")}

          {textField("certification", "Status lisensi", "Contoh: Berlisensi resmi")}

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Latar belakang
              <span className="ml-1 font-normal text-[#A9BACB]">(opsional)</span>
            </span>
            <textarea
              rows={3}
              value={form.background}
              placeholder="Contoh: Atlet tingkat kota, provinsi, nasional"
              onChange={(e) => setField("background")(e.target.value)}
              className={`${inputClass(errors.background)} resize-none py-2 leading-[1.6]`}
            />
            {errors.background && (
              <span className="mt-1 block text-[10px] text-red-500">
                {errors.background}
              </span>
            )}
          </label>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {textField("phone", "No. telepon", "081234567890", true)}
            {textField("email", "Email", "nama@email.com", true)}
          </div>

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
                : isEdit
                  ? "Simpan perubahan"
                  : "Tambah pelatih"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}