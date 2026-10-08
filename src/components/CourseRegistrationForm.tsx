"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type CourseRegistrationFormProps = {
  /** Nama paket aktif, diambil dari tabel courses. */
  programs: string[];
};

export default function CourseRegistrationForm({
  programs,
}: CourseRegistrationFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [program, setProgram] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    program?: string;
  }>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {
      name?: string;
      email?: string;
      phone?: string;
      program?: string;
    } = {};

    if (!name.trim()) newErrors.name = "Nama wajib diisi.";
    if (!email.trim()) {
      newErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format email tidak valid.";
    }
    if (!phone.trim()) newErrors.phone = "Nomor HP wajib diisi.";
    if (!program) newErrors.program = "Pilih salah satu program.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSending(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, program, notes }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Terjadi kesalahan.");
      }

      setSent(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan server.",
      );
    } finally {
      setSending(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `h-[34px] w-full rounded-md border px-3 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#368DDF] ${
      hasError ? "border-red-400" : "border-[#D6E5F3]"
    }`;

  if (sent) {
    return (
      <div className="rounded-[9px] border border-[#D6E5F3] bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
        <h2 className="mt-3 text-[16px] font-bold text-[#073763]">
          Pendaftaran berhasil!
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed text-[#526B84]">
          Terima kasih, {name}. Tim kami akan segera menghubungi Anda melalui
          email atau WhatsApp untuk konfirmasi jadwal program{" "}
          <span className="font-semibold text-[#173f63]">{program}</span>.
        </p>
        <Link
          href="/program"
          className="mt-5 inline-block text-[11px] font-medium text-[#1769AA] hover:underline"
        >
          Lihat program lain
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[9px] border border-[#D6E5F3] bg-white p-5">
      <h2 className="text-[14px] font-bold text-[#073763]">Formulir daftar</h2>
      <p className="mt-1 text-[11px] text-[#526B84]">
        Isi data diri Anda untuk mendaftar kursus renang.
      </p>

      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Nama */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reg-name"
            className="text-[11px] font-semibold text-[#073763]"
          >
            Nama
          </label>
          <input
            id="reg-name"
            type="text"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass(!!errors.name)}
          />
          {errors.name && (
            <p className="text-[10px] text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reg-email"
            className="text-[11px] font-semibold text-[#073763]"
          >
            Email
          </label>
          <input
            id="reg-email"
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

        {/* Nomor HP */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reg-phone"
            className="text-[11px] font-semibold text-[#073763]"
          >
            Nomor HP / WhatsApp
          </label>
          <input
            id="reg-phone"
            type="tel"
            placeholder="08xx-xxxx-xxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass(!!errors.phone)}
          />
          {errors.phone && (
            <p className="text-[10px] text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Program */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reg-program"
            className="text-[11px] font-semibold text-[#073763]"
          >
            Program
          </label>
          <select
            id="reg-program"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className={`${inputClass(!!errors.program)} ${
              program ? "text-[#073763]" : "text-[#8FA3B8]"
            }`}
          >
            <option value="" disabled>
              Pilih program
            </option>
            {programs.map((p) => (
              <option key={p} value={p} className="text-[#073763]">
                {p}
              </option>
            ))}
          </select>
          {errors.program && (
            <p className="text-[10px] text-red-500">{errors.program}</p>
          )}
        </div>

        {/* Catatan */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reg-notes"
            className="text-[11px] font-semibold text-[#073763]"
          >
            Catatan (opsional)
          </label>
          <textarea
            id="reg-notes"
            placeholder="Contoh: pemula, jadwal sore, peserta anak usia 7 tahun"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-y rounded-md border border-[#D6E5F3] px-3 py-2.5 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#368DDF]"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="h-[30px] w-full rounded-md bg-[#0D4D85] text-[11px] font-semibold text-white transition-colors hover:bg-[#0a3f6d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Mengirim..." : "Daftar kursus"}
        </button>
        {submitError && (
          <p className="text-[10px] text-red-500">{submitError}</p>
        )}
      </form>
    </div>
  );
}
