"use client";

import { useMemo } from "react";
import QRCode from "react-qr-code";
import { Building2, Copy, QrCode } from "lucide-react";
import type { PaymentMethod } from "@/lib/payment-method";
import type { SiteSettings } from "@/lib/settings";

type PaymentMethodPickerProps = {
  /** Metode yang sedang dipilih; null kalau belum ada pilihan. */
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  /** Metode yang diaktifkan admin lewat Pengaturan. */
  available: PaymentMethod[];
  settings: Pick<
    SiteSettings,
    "qrisPayload" | "bankName" | "bankAccountNumber" | "bankAccountHolder"
  >;
  /** Nominal yang harus dibayar, sudah diformat. */
  amount: string;
  /** Tagihan sudah punya bukti, jadi metode yang terkirim tidak bisa diganti. */
  locked: boolean;
};

const OPTIONS: {
  method: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof QrCode;
}[] = [
  {
    method: "qris",
    label: "QRIS",
    hint: "Scan dengan e-wallet atau m-banking.",
    icon: QrCode,
  },
  {
    method: "bank_transfer",
    label: "Transfer Bank",
    hint: "Transfer manual ke rekening kami.",
    icon: Building2,
  },
];

/**
 * Pilih metode pembayaran dan tampilkan instruksinya.
 *
 * Daftar metode ditentukan admin lewat toggle di Pengaturan. Detail
 * pembayaran (kode QRIS, nomor rekening) sengaja TIDAK ikut menentukan pilihan:
 * peserta tetap mendapat pilihan walau rinciannya belum diisi, karena
 * memblokirnya hanya menghasilkan halaman buntu. Metode yang rinciannya belum
 * ada tetap bisa dipilih dan buktinya tetap terkirim — admin tetap melihat
 * metode mana yang dipakai peserta saat memverifikasi.
 *
 * Bukti yang sudah terkirim mengunci pilihan, karena `payments.method` dan
 * `proof_url` dikirim bersamaan sebagai satu paket.
 */
export default function PaymentMethodPicker({
  value,
  onChange,
  available,
  settings,
  amount,
  locked,
}: PaymentMethodPickerProps) {
  const selected = value ?? available[0] ?? null;

  const qrisReady = settings.qrisPayload.trim().length > 0;
  const bankReady = settings.bankAccountNumber.trim().length > 0;
  const isConfigured = (method: PaymentMethod | null) =>
    method === "qris" ? qrisReady : method === "bank_transfer" ? bankReady : false;

  const bankDetails = useMemo(
    () =>
      [
        { label: "Bank", value: settings.bankName },
        { label: "Nomor rekening", value: settings.bankAccountNumber },
        { label: "Atas nama", value: settings.bankAccountHolder },
      ].filter((row) => row.value.length > 0),
    [settings.bankName, settings.bankAccountNumber, settings.bankAccountHolder],
  );

  // Admin mematikan kedua metode lewat Pengaturan. Ini satu-satunya kondisi
  // yang benar-benar tidak ada pilihannya. Yang ditampilkan hanya pengingat
  // bahwa tagihan sudah tercatat — tanpa arahan menghubungi siapa pun, karena
  // di titik ini tidak ada yang bisa diperbaiki oleh peserta.
  if (available.length === 0) {
    return (
      <div className="rounded-[9px] border-2 border-dashed border-[#D6E5F3] bg-[#FAFCFF] px-6 py-6 text-center">
        <p className="text-[12px] font-medium text-[#073763]">
          Metode pembayaran belum dibuka
        </p>
        <p className="mt-1 text-[11px] text-[#8FA3B8]">
          Pilih QRIS atau Transfer Bank di bawah setelah metode dibuka.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-[#073763]">
          Metode pembayaran
        </h2>
        <span className="inline-block rounded-full bg-[#E5F1FC] px-2.5 py-1 text-[9px] font-medium text-[#1769AA]">
          {available.length === 1
            ? available[0] === "qris"
              ? "QRIS"
              : "Transfer Bank"
            : `${available.length} metode`}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Metode pembayaran"
        className="grid gap-2.5 sm:grid-cols-2"
      >
        {OPTIONS.filter((option) => available.includes(option.method)).map(
          (option) => {
            const active = selected === option.method;
            const Icon = option.icon;

            return (
              <button
                key={option.method}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={locked}
                onClick={() => onChange(option.method)}
                className={`flex items-start gap-2.5 rounded-[9px] border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                  active
                    ? "border-[#0D4D85] bg-[#F0F7FF]"
                    : "border-[#D6E5F3] bg-white hover:border-[#368DDF]"
                }`}
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    active ? "text-[#0D4D85]" : "text-[#A9BACB]"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-[#073763]">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-[1.5] text-[#8FA3B8]">
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          },
        )}
      </div>

      {locked && (
        <p className="mt-2 text-[10px] text-[#B56A00]">
          Bukti sudah dikirim. Metode pembayaran terkunci sampai bukti dikirim
          ulang.
        </p>
      )}

      <div className="mt-4 flex flex-col items-center rounded-[9px] border border-[#D6E5F3] bg-[#F0F7FF] px-6 py-6">
        {!isConfigured(selected) ? (
          <>
            {/* Rincian belum diisi admin. Metodenya tetap bisa dipilih dan
                bukti tetap bisa diunggah, jadi yang ditampilkan di sini
               placeholder netral — bukan QR kosong atau daftar rekening
                tanpa isi. */}
            <QrCode className="mb-2 h-6 w-6 text-[#C7D7E6]" />
            <p className="text-center text-[12px] font-semibold text-[#073763]">
              Rincian {selected === "qris" ? "QRIS" : "transfer bank"} belum
              ditampilkan
            </p>
            <p className="mt-1.5 max-w-[320px] text-center text-[11px] leading-[1.6] text-[#526B84]">
              Selesaikan pembayaran dengan
              {selected === "qris" ? " QRIS" : " transfer bank"}, lalu unggah
              bukti pembayarannya di bawah ini. Metode yang kamu pilih ikut
              tercatat untuk dicek admin.
            </p>
          </>
        ) : selected === "qris" ? (
          <>
            <div className="flex aspect-square w-full max-w-[240px] items-center justify-center rounded-[9px] border border-[#D6E5F3] bg-white p-2">
              <div className="aspect-square w-full">
                <QRCode
                  value={settings.qrisPayload}
                  size={512}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#073763"
                />
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-[#526B84]">
              Scan menggunakan aplikasi e-wallet atau m-banking Anda
            </p>
          </>
        ) : (
          <>
            <p className="mb-2 text-[11px] font-semibold text-[#073763]">
              Transfer ke rekening berikut
            </p>
            <dl className="w-full space-y-1.5">
              {bankDetails.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3 rounded-[7px] bg-white px-3 py-2"
                >
                  <dt className="text-[10px] text-[#8FA3B8]">{row.label}</dt>
                  <dd className="flex items-center gap-1.5 text-[12px] font-semibold text-[#073763]">
                    {row.value}
                    {row.label === "Nomor rekening" && (
                      <button
                        type="button"
                        title="Salin nomor rekening"
                        aria-label="Salin nomor rekening"
                        onClick={() =>
                          void navigator.clipboard?.writeText(
                            settings.bankAccountNumber,
                          )
                        }
                        className="text-[#1769AA] hover:text-[#0D4D85]"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-center text-[11px] text-[#526B84]">
              Setelah transfer, unggah bukti di bawah agar admin bisa
              memverifikasi.
            </p>
          </>
        )}

        <div className="mt-4 text-[28px] font-bold leading-tight text-[#073763]">
          {amount}
        </div>
      </div>
    </div>
  );
}