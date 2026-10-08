/**
 * Definisi pengaturan situs.
 *
 * Modul ini sengaja bebas dari import database supaya bisa ikut terbundel di
 * komponen client (mis. pratinjau tautan WhatsApp di form pengaturan).
 * Pembacaan dan penulisan database ada di `@/lib/settings-db`.
 */
export type SiteSettings = {
  /** Nama tempat kursus; dipakai di sidebar, navbar, footer, dan sertifikat. */
  businessName: string;
  /** Alamat lokasi; dipakai di kontak, footer, dan kolom lokasi sertifikat. */
  address: string;
  /** Nomor telepon; dipakai di kontak, footer, dan tautan WhatsApp. */
  phone: string;
  /**
   * String QRIS (payload EMV) dari penyedia pembayaran, mis.awalnya
   * `00020101021226...`. Peserta tidak pernah melihat string ini: halaman
   * pembayaran merender-nya jadi gambar QR.
   */
  qrisPayload: string;
  /** Nama bank penerima transfer, mis. "Bankmandiri". */
  bankName: string;
  /** Nomor rekening tujuan transfer. */
  bankAccountNumber: string;
  /** Nama pemilik rekening, wajib sama dengan yang tertera di kartu ATM. */
  bankAccountHolder: string;
  /** Tampilkan pilihan QRIS ke peserta. */
  enableQrisPayment: boolean;
  /** Tampilkan pilihan transfer bank ke peserta. */
  enableBankTransfer: boolean;
  /** Kirim email ke admin setiap ada pendaftaran baru. */
  notifyNewRegistration: boolean;
  /** Kirim pengingat pembayaran ke peserta. */
  notifyPaymentReminder: boolean;
  /** Kirim ringkasan laporan mingguan ke admin. */
  notifyWeeklyReport: boolean;
};

export const SETTING_DEFAULTS: SiteSettings = {
  businessName: "SwimmingCourse",
  address: "Hotel Pelangi, Jl. Yos Sudarso, Tanjungpinang, Kepulauan Riau",
  phone: "+62 812-0000-0000",
  // Kosong sampai admin mengisi kredensialnya. Metode yang datanya belum
  // lengkap tidak akan muncul sebagai pilihan di halaman pembayaran.
  qrisPayload: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountHolder: "",
  enableQrisPayment: true,
  enableBankTransfer: true,
  notifyNewRegistration: true,
  notifyPaymentReminder: true,
  notifyWeeklyReport: false,
};

export const SETTING_KEYS = Object.keys(
  SETTING_DEFAULTS,
) as (keyof SiteSettings)[];

/**
 * Bagian dari `SiteSettings` yang aman dikirim ke komponen client.
 *
 * Root layout menaruhnya di context, dan React menyerialkan isi context itu ke
 * HTML tiap halaman. Kalau objek penuh yang dikirim, nomor rekening, nama bank,
 * dan string QRIS ikut terbawa dan bisa dibaca siapa pun lewat "View Page
 * Source" — termasuk di halaman publik yang tidak butuh data pembayaran itu.
 *
 * Yang dikembalikan ke browser hanya identitas tempat kursus. Halaman
 * pembayaran tetap membaca data bank dari server sebagai prop, dan form
 * pengaturan admin membacanya lewat `/api/admin/settings`, jadi keduanya tidak
 * bergantung pada context ini.
 */
export type SiteInfo = Pick<SiteSettings, "businessName" | "address" | "phone">;

export function pickSiteInfo(settings: SiteSettings): SiteInfo {
  return {
    businessName: settings.businessName,
    address: settings.address,
    phone: settings.phone,
  };
}

const BOOLEAN_KEYS = new Set<keyof SiteSettings>([
  "notifyNewRegistration",
  "notifyPaymentReminder",
  "notifyWeeklyReport",
  "enableQrisPayment",
  "enableBankTransfer",
]);

export function isBooleanSetting(
  key: keyof SiteSettings,
): key is
  | "notifyNewRegistration"
  | "notifyPaymentReminder"
  | "notifyWeeklyReport"
  | "enableQrisPayment"
  | "enableBankTransfer" {
  return BOOLEAN_KEYS.has(key);
}

function parseText(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export type SettingsValidation =
  | { ok: true; data: SiteSettings }
  | { ok: false; status: number; error: string; field?: string };

export function validateSettingsPayload(
  body: Record<string, unknown>,
): SettingsValidation {
  const businessName = parseText(
    body.businessName,
    SETTING_DEFAULTS.businessName,
  );
  const address = parseText(body.address, SETTING_DEFAULTS.address);
  const phone = parseText(body.phone, SETTING_DEFAULTS.phone);

  if (!businessName) {
    return {
      ok: false,
      status: 400,
      error: "Nama tempat kursus wajib diisi.",
      field: "businessName",
    };
  }
  if (businessName.length > 100) {
    return {
      ok: false,
      status: 400,
      error: "Nama tempat kursus maksimal 100 karakter.",
      field: "businessName",
    };
  }

  if (!address) {
    return {
      ok: false,
      status: 400,
      error: "Alamat wajib diisi.",
      field: "address",
    };
  }
  if (address.length > 300) {
    return {
      ok: false,
      status: 400,
      error: "Alamat maksimal 300 karakter.",
      field: "address",
    };
  }

  if (!phone) {
    return {
      ok: false,
      status: 400,
      error: "No. telepon wajib diisi.",
      field: "phone",
    };
  }
  if (phone.length > 40) {
    return {
      ok: false,
      status: 400,
      error: "No. telepon maksimal 40 karakter.",
      field: "phone",
    };
  }
  if (!/^[\d+()\s.-]{6,}$/.test(phone)) {
    return {
      ok: false,
      status: 400,
      error: "No. telepon hanya boleh berisi angka, spasi, dan tanda + - ( ).",
      field: "phone",
    };
  }

  // Detail pembayaran tidak wajib diisi di sini. Yang wajib hanya soal bentuk
  // nilainya, supaya angka rekening atau string QRIS yang rusak tertangkap
  // sekarang, bukan saat peserta sudah salah transfer.
  const qrisPayload = parseText(body.qrisPayload, SETTING_DEFAULTS.qrisPayload);
  const bankName = parseText(body.bankName, SETTING_DEFAULTS.bankName);
  const bankAccountNumber = parseText(
    body.bankAccountNumber,
    SETTING_DEFAULTS.bankAccountNumber,
  );
  const bankAccountHolder = parseText(
    body.bankAccountHolder,
    SETTING_DEFAULTS.bankAccountHolder,
  );

  if (qrisPayload.length > 1000) {
    return {
      ok: false,
      status: 400,
      error: "Kode QRIS terlalu panjang. Pastikan tidak ada teks tambahan.",
      field: "qrisPayload",
    };
  }

  if (bankAccountNumber && !/^[\d\s.-]{4,}$/.test(bankAccountNumber)) {
    return {
      ok: false,
      status: 400,
      error: "Nomor rekening hanya boleh berisi angka, spasi, titik, dan tanda hubung.",
      field: "bankAccountNumber",
    };
  }

  // Rekening yang dipakai harus punya nama bank dan pemilik, kalau tidak
  // peserta tidak punya tujuan transfer yang jelas.
  if (bankAccountNumber && (!bankName || !bankAccountHolder)) {
    return {
      ok: false,
      status: 400,
      error: "Nama bank dan atas nama rekening wajib diisi bersama nomor rekening.",
      field: bankName ? "bankAccountHolder" : "bankName",
    };
  }

  return {
    ok: true,
    data: {
      businessName,
      address,
      phone,
      qrisPayload,
      bankName,
      bankAccountNumber,
      bankAccountHolder,
      enableQrisPayment: parseBoolean(
        body.enableQrisPayment,
        SETTING_DEFAULTS.enableQrisPayment,
      ),
      enableBankTransfer: parseBoolean(
        body.enableBankTransfer,
        SETTING_DEFAULTS.enableBankTransfer,
      ),
      notifyNewRegistration: parseBoolean(
        body.notifyNewRegistration,
        SETTING_DEFAULTS.notifyNewRegistration,
      ),
      notifyPaymentReminder: parseBoolean(
        body.notifyPaymentReminder,
        SETTING_DEFAULTS.notifyPaymentReminder,
      ),
      notifyWeeklyReport: parseBoolean(
        body.notifyWeeklyReport,
        SETTING_DEFAULTS.notifyWeeklyReport,
      ),
    },
  };
}

/** Nomor telepon menjadi tautan WhatsApp yang bisa diklik. */
export function getWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  const normalized = digits.startsWith("62")
    ? digits
    : digits.startsWith("0")
      ? `62${digits.slice(1)}`
      : digits;

  return `https://wa.me/${normalized}`;
}