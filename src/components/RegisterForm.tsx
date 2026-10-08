"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { DEFAULT_HOME } from "@/lib/roles";

const MIN_PASSWORD_LENGTH = 8;

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export default function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FieldErrors = {};

    if (!firstName.trim()) newErrors.firstName = "Nama depan wajib diisi.";
    if (!lastName.trim()) newErrors.lastName = "Nama belakang wajib diisi.";
    if (!email.trim()) {
      newErrors.email = "Email wajib diisi.";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Format email tidak valid.";
    }
    if (!phone.trim()) {
      newErrors.phone = "Nomor telepon wajib diisi.";
    } else if (!isValidPhone(phone)) {
      newErrors.phone = "Nomor telepon tidak valid. Gunakan 9-15 digit.";
    }
    if (!password) {
      newErrors.password = "Kata sandi wajib diisi.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    }

    setErrors(newErrors);
    setSubmitError("");

    if (Object.keys(newErrors).length > 0) return;

    setSending(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Terjadi kesalahan.");
      }

      const data = await res.json().catch(() => null);

      router.push(data?.redirectTo ?? DEFAULT_HOME);
      router.refresh();
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
    <div className="flex w-full justify-center bg-white px-5 py-14 lg:w-[45%] lg:min-h-screen lg:items-center lg:py-0">
      <div className="w-full max-w-[360px]">
        <h2 className="text-[20px] font-bold text-[#073763]">
          Buat akun baru
        </h2>
        <p className="mt-1 text-[11px] text-[#526B84]">
          Lengkapi data diri Anda untuk membuat akun.
        </p>

        {submitError && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {submitError}
          </p>
        )}

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Nama depan & nama belakang */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-first-name"
                className="text-[11px] font-semibold text-[#073763]"
              >
                Nama depan
              </label>
              <input
                id="register-first-name"
                type="text"
                autoComplete="given-name"
                placeholder="Budi"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass(!!errors.firstName)}
              />
              {errors.firstName && (
                <p className="text-[10px] text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-last-name"
                className="text-[11px] font-semibold text-[#073763]"
              >
                Nama belakang
              </label>
              <input
                id="register-last-name"
                type="text"
                autoComplete="family-name"
                placeholder="Santoso"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass(!!errors.lastName)}
              />
              {errors.lastName && (
                <p className="text-[10px] text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-email"
              className="text-[11px] font-semibold text-[#073763]"
            >
              Email
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass(!!errors.email)}
            />
            {errors.email && (
              <p className="text-[10px] text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Nomor telepon */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-phone"
              className="text-[11px] font-semibold text-[#073763]"
            >
              No. telepon
            </label>
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              placeholder="0812-3456-7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass(!!errors.phone)}
            />
            {errors.phone && (
              <p className="text-[10px] text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Kata sandi */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-password"
              className="text-[11px] font-semibold text-[#073763]"
            >
              Kata sandi
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass(!!errors.password)} pr-9`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8FA3B8] hover:text-[#073763]"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-red-500">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={sending}
            className="h-[34px] w-full rounded-md bg-[#0D4D85] text-[11px] font-semibold text-white transition-colors hover:bg-[#0a3f6d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <p className="mt-5 text-center text-[10px] text-[#526B84]">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-[#1769AA] hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
