"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import type { SiteSettings } from "@/lib/settings";
import { getWhatsAppUrl, SETTING_KEYS } from "@/lib/settings";
import {
  isPaymentMethodConfigured,
  type PaymentMethod,
} from "@/lib/payment-method";

type SettingsFormProps = {
  initial: SiteSettings;
};

type FieldKey =
  | "businessName"
  | "address"
  | "phone"
  | "qrisPayload"
  | "bankName"
  | "bankAccountNumber"
  | "bankAccountHolder";

type Toast = { tone: "sukses" | "gagal"; text: string } | null;

/** Metode pembayaran yang bisa dinyalakan atau dimatikan dari panel ini. */
type MethodToggleKey = "enableQrisPayment" | "enableBankTransfer";

const METHOD_ROWS: {
  key: MethodToggleKey;
  label: string;
  note: string;
}[] = [
  {
    key: "enableQrisPayment",
    label: "QRIS",
    note: "Peserta_memindai kode QR dari e-wallet atau m-banking.",
  },
  {
    key: "enableBankTransfer",
    label: "Transfer bank",
    note: "Peserta transfer manual ke rekening yang dicantumkan di bawah.",
  },
];

const NOTIFICATION_ROWS: {
  key: "notifyNewRegistration" | "notifyPaymentReminder" | "notifyWeeklyReport";
  label: string;
  note: string;
}[] = [
  {
    key: "notifyNewRegistration",
    label: "Email pendaftaran baru",
    note: "Kirim email ke admin setiap ada peserta baru mendaftar.",
  },
  {
    key: "notifyPaymentReminder",
    label: "Pengingat pembayaran",
    note: "Kirim pengingat tagihan ke peserta yang belum lunas.",
  },
  {
    key: "notifyWeeklyReport",
    label: "Ringkasan laporan mingguan",
    note: "Kirim ringkasan pendapatan dan paket mingguan ke admin.",
  },
];

export default function SettingsForm({ initial }: SettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const isDirty =
    SETTING_KEYS.some((key) => form[key] !== initial[key]);

  const setField = (key: FieldKey) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setToast(null);
  };

  const toggle = (
    key: MethodToggleKey | (typeof NOTIFICATION_ROWS)[number]["key"],
  ) => () => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
    setToast(null);
  };

  // Badge "Belum lengkap" memakai helper yang sama dengan halaman pembayaran,
  // supaya definisi "rincian sudah cukup" hanya ada di satu tempat.
  const methodReady = (method: PaymentMethod) =>
    isPaymentMethodConfigured(method, form);

  const handleSave = async () => {
    setSaving(true);
    setToast(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setToast({
          tone: "gagal",
          text: data?.error ?? "Gagal menyimpan.",
        });
        if (data?.field === "qrisPayload") setField("qrisPayload")(form.qrisPayload);
        if (data?.field === "bankName") setField("bankName")(form.bankName);
        if (data?.field === "bankAccountNumber")
          setField("bankAccountNumber")(form.bankAccountNumber);
        if (data?.field === "bankAccountHolder")
          setField("bankAccountHolder")(form.bankAccountHolder);
        return;
      }

      setForm(data.settings as SiteSettings);
      setToast({ tone: "sukses", text: "Pengaturan berhasil disimpan" });
      router.refresh();
    } catch {
      setToast({ tone: "gagal", text: "Gagal menghubungi server." });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "h-[38px] w-full rounded-lg border border-[#D6E5F3] bg-[#F8FAFC] px-3 text-[12px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5] focus:bg-white";

  return (
    <>
      {toast && (
        <div
          role="status"
          className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[11px] font-medium ${
            toast.tone === "sukses"
              ? "border-[#BFE3D2] bg-[#F1FBF6] text-[#0B7A4B]"
              : "border-[#F3C9C4] bg-[#FEF4F3] text-[#B42318]"
          }`}
        >
          {toast.tone === "sukses" && <Check className="h-3.5 w-3.5" />}
          {toast.text}
        </div>
      )}

      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#073763]">
              Profil bisnis
            </h2>
            <p className="mt-1 text-[11px] text-[#8FA3B8]">
              Nilai di sini dipakai di sidebar, judul halaman, footer, halaman
              kontak, template sertifikat, dan tautan WhatsApp.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0A2540] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#123a5e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Simpan perubahan
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Nama tempat kursus
            </span>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => setField("businessName")(e.target.value)}
              placeholder="SwimmingCourse"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Alamat
            </span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setField("address")(e.target.value)}
              placeholder="Hotel Pelangi, Jl. Yos Sudarso, Tanjungpinang, Kepulauan Riau"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              No. telepon
            </span>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setField("phone")(e.target.value)}
              placeholder="+62 812-0000-0000"
              className={inputClass}
            />
            <a
              href={getWhatsAppUrl(form.phone)}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-block text-[10px] text-[#1769AA] hover:underline"
            >
              Pratinjau tautan WhatsApp: {getWhatsAppUrl(form.phone)}
            </a>
          </label>
        </div>
      </section>

      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <h2 className="text-[14px] font-bold text-[#073763]">
          Metode pembayaran
        </h2>
        <p className="mt-1 text-[11px] text-[#8FA3B8]">
          Metode yang aktif tampil sebagai pilihan di halaman pembayaran
          peserta. Metode yang rinciannya belum diisi tetap bisa dipilih peserta,
          hanya saja QR atau rekeningnya belum tampil di halaman itu.
        </p>

        <ul className="mt-3 divide-y divide-[#EAF2FA]">
          {METHOD_ROWS.map((row) => {
            const active = form[row.key];
            const ready = methodReady(
              row.key === "enableQrisPayment" ? "qris" : "bank_transfer",
            );

            return (
              <li
                key={row.key}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#073763]">
                    {row.label}
                    {!ready && (
                      <span className="ml-2 rounded-full bg-[#FFF2E1] px-2 py-0.5 text-[9px] font-medium text-[#B56A00]">
                        Belum lengkap
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#8FA3B8]">{row.note}</p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={active}
                  aria-label={row.label}
                  onClick={toggle(row.key)}
                  className={`relative h-[22px] w-[40px] shrink-0 rounded-full transition-colors ${
                    active ? "bg-[#0A3966]" : "bg-[#C7D7E6]"
                  }`}
                >
                  <span
                    className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                      active ? "left-[21px]" : "left-[3px]"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Kode QRIS (string EMV)
            </span>
            <textarea
              rows={3}
              value={form.qrisPayload}
              onChange={(e) => setField("qrisPayload")(e.target.value)}
              placeholder="00020101021226260814ID.CO.QRIS.WWW..."
              className="w-full resize-none rounded-lg border border-[#D6E5F3] bg-[#F8FAFC] px-3 py-2 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5] focus:bg-white"
            />
            <span className="mt-1.5 block text-[10px] text-[#8FA3B8]">
              Salin dari dashboard penyedia QRIS. String ini dirender jadi gambar
              QR untuk peserta, jadi jangan isi kode QR sebagai gambar.
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Nama bank
              </span>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setField("bankName")(e.target.value)}
                placeholder="Bankmandiri"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Nomor rekening
              </span>
              <input
                type="text"
                value={form.bankAccountNumber}
                onChange={(e) =>
                  setField("bankAccountNumber")(e.target.value)
                }
                placeholder="1234567890"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Atas nama
              </span>
              <input
                type="text"
                value={form.bankAccountHolder}
                onChange={(e) =>
                  setField("bankAccountHolder")(e.target.value)
                }
                placeholder="SwimmingCourse"
                className={inputClass}
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {isDirty && !saving && (
            <p className="text-[10px] text-[#B56A00]">
              Ada perubahan yang belum disimpan.
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="ml-auto inline-flex h-[36px] items-center justify-center gap-1.5 rounded-lg bg-[#0A2540] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#123a5e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Simpan perubahan
          </button>
        </div>
      </section>

      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <h2 className="text-[14px] font-bold text-[#073763]">Notifikasi</h2>
        <p className="mt-1 text-[11px] text-[#8FA3B8]">
          Pilih notifikasi yang ingin dikirim otomatis.
        </p>

        <ul className="mt-3 divide-y divide-[#EAF2FA]">
          {NOTIFICATION_ROWS.map((row) => {
            const active = form[row.key];

            return (
              <li
                key={row.key}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#073763]">
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#8FA3B8]">{row.note}</p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={active}
                  aria-label={row.label}
                  onClick={toggle(row.key)}
                  className={`relative h-[22px] w-[40px] shrink-0 rounded-full transition-colors ${
                    active ? "bg-[#0A3966]" : "bg-[#C7D7E6]"
                  }`}
                >
                  <span
                    className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                      active ? "left-[21px]" : "left-[3px]"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-lg border border-[#0A3966] bg-white px-4 text-[12px] font-semibold text-[#0A3966] transition-colors hover:bg-[#0A3966] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </div>

        {isDirty && !saving && (
          <p className="mt-2 text-right text-[10px] text-[#B56A00]">
            Ada perubahan yang belum disimpan.
          </p>
        )}
      </section>
    </>
  );
}