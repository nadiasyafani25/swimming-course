"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { DEFAULT_HOME } from "@/lib/roles";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format email tidak valid.";
    }
    if (!password) newErrors.password = "Kata sandi wajib diisi.";

    setErrors(newErrors);
    setLoginError("");

    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Terjadi kesalahan.");
      }

      const data = await res.json().catch(() => null);

      router.push(data?.redirectTo ?? DEFAULT_HOME);
      router.refresh();
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Terjadi kesalahan server.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `h-[34px] w-full rounded-md border px-[11px] text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#2F8FE5] ${
      hasError ? "border-red-400" : "border-[#D6E5F3]"
    } bg-[#F8FBFE]`;

  return (
    <div className="flex w-full justify-center bg-white px-5 py-14 lg:w-1/2 lg:min-h-screen lg:items-center lg:py-0">
      <div className="w-full max-w-[340px]">
        <h2 className="text-[20px] font-bold text-[#073763]">
          Masuk ke akun Anda
        </h2>
        <p className="mt-1 text-[11px] text-[#9AA7B4]">
          Gunakan email yang terdaftar untuk masuk.
        </p>

        {loginError && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {loginError}
          </p>
        )}

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-[11px] font-semibold text-[#073763]"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass(!!errors.email)}
            />
            {errors.email && (
              <p className="text-[10px] text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Kata sandi */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-password"
              className="text-[11px] font-semibold text-[#073763]"
            >
              Kata sandi
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
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
            disabled={submitting}
            className="h-[38px] w-full rounded-md bg-[#0A3966] text-[12px] font-semibold text-white transition-colors hover:bg-[#0D2F54] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        <p className="mt-5 text-center text-[10px] text-[#526B84]">
          Belum punya akun?{" "}
          <Link
            href="/daftar"
            className="font-medium text-[#1769AA] hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}