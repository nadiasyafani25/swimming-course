"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const MIN_PASSWORD_LENGTH = 8;

type PasswordErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type DashboardProfileFormProps = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export default function DashboardProfileForm({
  firstName,
  lastName,
  email,
  phone,
}: DashboardProfileFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass = (hasError: boolean) =>
    `h-[34px] w-full rounded-md border px-[11px] pr-9 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#2F8FE5] ${
      hasError ? "border-red-400" : "border-[#D6E5F3]"
    } bg-[#F8FBFE]`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: PasswordErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Kata sandi saat ini wajib diisi.";
    }
    if (!newPassword) {
      newErrors.newPassword = "Kata sandi baru wajib diisi.";
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      newErrors.newPassword = `Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    } else if (newPassword === currentPassword) {
      newErrors.newPassword =
        "Kata sandi baru harus berbeda dari kata sandi saat ini.";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi kata sandi wajib diisi.";
    } else if (newPassword && confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
    }

    setErrors(newErrors);
    setSubmitError("");
    setSuccess("");

    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);

    try {
      const res = await fetch("/api/auth/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          setErrors({ currentPassword: data?.error ?? "Kata sandi saat ini salah." });
        }
        throw new Error(data?.error ?? "Terjadi kesalahan.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Kata sandi berhasil diubah. Silakan gunakan kata sandi baru.");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan server.",
      );
    } finally {
      setSaving(false);
    }
  };

  const accountRows = [
    { label: "Nama depan", value: firstName },
    { label: "Nama belakang", value: lastName },
    { label: "Email", value: email },
    { label: "No. telepon", value: phone || "-" },
  ];

  const passwordFields = [
    {
      id: "current-password",
      label: "Kata sandi saat ini",
      value: currentPassword,
      onChange: setCurrentPassword,
      error: errors.currentPassword,
      visible: visible.current,
      onToggle: () =>
        setVisible((v) => ({ ...v, current: !v.current })),
    },
    {
      id: "new-password",
      label: "Kata sandi baru",
      value: newPassword,
      onChange: setNewPassword,
      error: errors.newPassword,
      visible: visible.next,
      onToggle: () => setVisible((v) => ({ ...v, next: !v.next })),
    },
    {
      id: "confirm-password",
      label: "Konfirmasi kata sandi baru",
      value: confirmPassword,
      onChange: setConfirmPassword,
      error: errors.confirmPassword,
      visible: visible.confirm,
      onToggle: () => setVisible((v) => ({ ...v, confirm: !v.confirm })),
    },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Informasi akun */}
      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5">
        <h2 className="text-[14px] font-bold text-[#073763]">
          Informasi akun
        </h2>
        <p className="mt-1 text-[11px] text-[#8FA3B8]">
          Data ini diambil dari pendaftaran Anda dan belum bisa diubah sendiri.
        </p>

        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {accountRows.map((row) => (
            <div key={row.label}>
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8FA3B8]">
                {row.label}
              </dt>
              <dd className="mt-1 text-[12px] font-medium text-[#073763]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Ubah kata sandi */}
      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5">
        <h2 className="text-[14px] font-bold text-[#073763]">
          Ubah kata sandi
        </h2>
        <p className="mt-1 text-[11px] text-[#8FA3B8]">
          Gunakan minimal {MIN_PASSWORD_LENGTH} karakter dan jangan memakai kata
          sandi lama.
        </p>

        {success && (
          <p className="mt-4 flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {success}
          </p>
        )}

        {submitError && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {submitError}
          </p>
        )}

        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {passwordFields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <label
                htmlFor={field.id}
                className="text-[11px] font-semibold text-[#073763]"
              >
                {field.label}
              </label>
              <div className="relative">
                <input
                  id={field.id}
                  type={field.visible ? "text" : "password"}
                  autoComplete="off"
                  placeholder={field.label}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={inputClass(!!field.error)}
                />
                <button
                  type="button"
                  onClick={field.onToggle}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8FA3B8] hover:text-[#073763]"
                  aria-label={
                    field.visible
                      ? `Sembunyikan ${field.label}`
                      : `Tampilkan ${field.label}`
                  }
                >
                  {field.visible ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {field.error && (
                <p className="text-[10px] text-red-500">{field.error}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="h-[34px] w-full rounded-md bg-[#0D4D85] text-[11px] font-semibold text-white transition-colors hover:bg-[#0a3f6d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
          >
            {saving ? "Menyimpan..." : "Simpan kata sandi"}
          </button>
        </form>
      </section>

      {/* Sesi */}
      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5">
        <h2 className="text-[14px] font-bold text-[#073763]">Sesi masuk</h2>
        <p className="mt-1 text-[11px] text-[#8FA3B8]">
          Keluar dari akun ini. Anda akan perlu masuk kembali dengan email dan
          kata sandi Anda.
        </p>

        <LogoutButton
          className="mt-4 inline-flex h-[34px] items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-[11px] font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          label="Keluar dari akun"
          iconClassName="h-3.5 w-3.5"
          confirm={false}
        />
      </section>
    </div>
  );
}
