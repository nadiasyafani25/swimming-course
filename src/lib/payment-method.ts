/**
 * Metode pembayaran yang bisa dipilih peserta.
 *
 * Modul ini bebas dari import database supaya bisa ikut terbundel di komponen
 * client, sama seperti `@/lib/settings`. Tipe dan labelnya dipakai di dua sisi:
 * peserta memilih sebelum mengunggah bukti, admin membaca hasilnya saat
 * memverifikasi.
 *
 * Nilai yang disimpan di `payments.method` persis string di bawah, jadi jangan
 * diubah tanpa migrasi.
 */

export type PaymentMethod = "qris" | "bank_transfer";

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  "qris",
  "bank_transfer",
];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" &&
    (PAYMENT_METHODS as readonly string[]).includes(value);
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  qris: "QRIS",
  bank_transfer: "Transfer Bank",
};

/** Nilai dari database atau input pengguna, selalu aman untuk ditampilkan. */
export function getPaymentMethodLabel(value: string): string {
  return isPaymentMethod(value) ? PAYMENT_METHOD_LABEL[value] : "Belum dipilih";
}

/**
 * Apakah metode punya data pembayaran yang lengkap.
 *
 * Admin bisa mengaktifkan metode sebelum mengisi rekening atau kode QRIS-nya.
 * Metode yang belum terkonfigurasi disembunyikan dari pilihan peserta supaya
 * tidak ada yang membayar ke rekening yang belum benar.
 */
export function isPaymentMethodConfigured(
  method: PaymentMethod,
  settings: { qrisPayload: string; bankAccountNumber: string },
): boolean {
  if (method === "qris") return settings.qrisPayload.length > 0;
  return settings.bankAccountNumber.length > 0;
}