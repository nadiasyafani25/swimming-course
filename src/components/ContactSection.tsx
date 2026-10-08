"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { getWhatsAppUrl } from "@/lib/settings";

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { address, phone } = useSiteSettings();

  // Alamat dan nomor telepon berasal dari halaman Pengaturan admin, jadi
  // perubahan di sana langsung terlihat di halaman kontak ini.
  const contactInfo = [
    { icon: MapPin, text: address },
    { icon: Phone, text: phone },
    { icon: Mail, text: "info@swimmingcourse.id" },
    { icon: Clock, text: "Senin - Minggu, 07.00 - 21.00" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; message?: string } = {};

    if (!name.trim()) newErrors.name = "Nama wajib diisi.";
    if (!email.trim()) {
      newErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format email tidak valid.";
    }
    if (!message.trim()) newErrors.message = "Pesan wajib diisi.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSending(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
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

  return (
    <section className="w-full bg-[#F3F8FD]">
      <div className="mx-auto max-w-[1030px] px-5 pb-24 pt-16">
        <div className="grid items-start gap-[18px] lg:grid-cols-2">
          {/* Kiri - Informasi kontak */}
          <div className="flex flex-col">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#368DDF]">
              Hubungi Kami
            </p>
            <h1 className="mt-3 text-[22px] font-bold leading-snug text-[#073763]">
              Kami siap membantu
            </h1>

            {/* Peta */}
            <div className="relative mt-6 h-[168px] w-full overflow-hidden rounded-lg border border-[#D6E5F3]">
              <iframe
                src="https://maps.google.com/maps?q=0.9148472286190716,104.4807708555231&t=m&z=15&output=embed&iwloc=near"
                title="Peta lokasi Hotel Pelangi"
                className="h-full w-full border-0"
                allowFullScreen
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
            <a
              href={getWhatsAppUrl(phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[11px] font-medium text-[#1769AA] hover:underline"
            >
              Chat lewat WhatsApp
            </a>

            {/* Informasi kontak */}
            <div className="mt-5 flex flex-col gap-y-1.5">
              {contactInfo.map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-2.5 text-[12px] leading-[1.8] text-[#526B84]"
                >
                  <item.icon className="mt-[3px] h-4 w-4 shrink-0 text-[#1769AA]" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kanan - Form kirim pesan */}
          <div className="rounded-[9px] border border-[#D6E5F3] bg-white p-5">
            <h2 className="text-[14px] font-bold text-[#073763]">
              Kirim pesan
            </h2>

            {sent ? (
              <p className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-[12px] text-green-700">
                Pesan Anda berhasil terkirim. Kami akan segera menghubungi Anda.
              </p>
            ) : (
              <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
                {/* Nama */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-name"
                    className="text-[11px] font-semibold text-[#073763]"
                  >
                    Nama
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`h-[34px] rounded-md border px-3 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#368DDF] ${
                      errors.name ? "border-red-400" : "border-[#D6E5F3]"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-email"
                    className="text-[11px] font-semibold text-[#073763]"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-[34px] rounded-md border px-3 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#368DDF] ${
                      errors.email ? "border-red-400" : "border-[#D6E5F3]"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Pesan */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-message"
                    className="text-[11px] font-semibold text-[#073763]"
                  >
                    Pesan
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder="Tulis pesan Anda"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`resize-y rounded-md border px-3 py-2.5 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#368DDF] ${
                      errors.message ? "border-red-400" : "border-[#D6E5F3]"
                    }`}
                  />
                  {errors.message && (
                    <p className="text-[10px] text-red-500">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="h-[30px] w-full rounded-md bg-[#0D4D85] text-[11px] font-semibold text-white transition-colors hover:bg-[#0a3f6d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Mengirim..." : "Kirim pesan"}
                </button>
                {submitError && (
                  <p className="text-[10px] text-red-500">{submitError}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}