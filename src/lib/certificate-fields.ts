/**
 * Kontrak data untuk generator sertifikat.
 *
 * Sengaja tidak memakai tabel database: generator ini murni alat untuk membuat
 * berkas PDF/PNG/JPG, hasilnya diunggah sendiri oleh admin lewat tombol
 * "Terbitkan sertifikat". Tidak ada yang perlu disimpan di server.
 */

export type CertificateDraft = {
  studentName: string;
  certificateNo: string;
  programName: string;
  level: string;
  startDate: string;
  endDate: string;
  locationName: string;
  /** Satu kompetensi per baris. */
  competencies: string;
  issueCity: string;
  issueDate: string;
  coachName: string;
  coachTitle: string;
  organizationName: string;
  organizationContact: string;
  organizationWebsite: string;
};

/**
 * Key draft sertifikat di localStorage.
 *
 * Versinya naik setiap kali template memakai nilai default baru (mis. nama
 * tempat kursus dari halaman Pengaturan), supaya draft lama yang masih menyimpan
 * teks paket lama ikut tergantikan.
 */
export const DRAFT_STORAGE_KEY = "swimmingcourse:sertifikat-draft:v2";

/**
 * Ukuran A4 pada 96 dpi untuk kedua orientasi, dipakai certificate sebagai
 * kerangka fix supaya koordinat ornamennya bisa dihitung sekali saja.
 */
export const CERTIFICATE_SIZES = {
  portrait: { width: 794, height: 1123 },
  landscape: { width: 1123, height: 794 },
} as const;

export type CertificateOrientation = keyof typeof CERTIFICATE_SIZES;

export const CERTIFICATE_ORIENTATIONS: CertificateOrientation[] = [
  "portrait",
  "landscape",
];

export const ORIENTATION_LABELS: Record<CertificateOrientation, string> = {
  portrait: "Potrait",
  landscape: "Landscape",
};

export function certificateSize(orientation: CertificateOrientation): {
  width: number;
  height: number;
} {
  return CERTIFICATE_SIZES[orientation];
}

export const CERTIFICATE_PRESETS = {
  organizationName: "SwimmingCourse",
  locationName: "Kolam Renang Hotel Pelangi, Tanjungpinang",
  issueCity: "Tanjungpinang",
  coachTitle: "Head Coach Renang",
  organizationContact: "Tanjungpinang | 0812-3456-7890",
  organizationWebsite: "www.swimmingcourse.id",
} as const;

/** Saran untuk dropdown tingkat - nilainya tetap bisa diketik bebas. */
export const LEVEL_SUGGESTIONS = [
  "Tingkat Dasar",
  "Tingkat Menengah",
  "Tingkat Lanjutan",
  "Intermediate",
  "Advanced",
  "Kelas Reguler",
  "Semi Private",
  "Private",
];

/**
 * Daftar kompetensi siap pakai per tingkat.
 *
 * Hanya mempercepat pengisian awal - admin tetap bebas menambah, menghapus,
 * atau menulis sendiri barisnya di textarea.
 */
export const COMPETENCY_TEMPLATES: Record<string, string[]> = {
  "Tingkat Dasar": [
    "Adaptasi di lingkungan kolam",
    "Gaya bebas dan gaya dada",
    "Mengapung dan keselamatan air",
    "Renang 25 meter",
  ],
  "Tingkat Menengah": [
    "Gaya bebas dan dada",
    "Renang bolak-balik 50 meter",
    "Keselamatan air",
    "Teknik kaki dan lengan",
  ],
  "Tingkat Lanjutan": [
    "Empat teknik gaya berenang",
    "Renang 100 meter",
    "Start dan turn",
    "Renang 500 meter",
  ],
};

/** Tanggal hari ini di zona waktu Indonesia, format YYYY-MM-DD. */
export function todayInputValue(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function emptyDraft(site?: {
  businessName?: string;
  address?: string;
  phone?: string;
}): CertificateDraft {
  return {
    studentName: "",
    certificateNo: "",
    programName: "",
    level: "",
    startDate: "",
    endDate: "",
    locationName: site?.address?.trim() || CERTIFICATE_PRESETS.locationName,
    competencies: "",
    issueCity: CERTIFICATE_PRESETS.issueCity,
    issueDate: todayInputValue(),
    coachName: "",
    coachTitle: CERTIFICATE_PRESETS.coachTitle,
    organizationName: site?.businessName?.trim() || CERTIFICATE_PRESETS.organizationName,
    organizationContact:
      site?.phone?.trim() || CERTIFICATE_PRESETS.organizationContact,
    organizationWebsite: CERTIFICATE_PRESETS.organizationWebsite,
  };
}

export function parseCompetencies(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\u2022]\s*/, "").trim())
    .filter(Boolean);
}

/** Nomor sertifikat dengan format `001/SWIM/2026`. */
export function formatCertificateNo(
  prefix: string,
  sequence: number,
  year: number,
): string {
  const padded = String(sequence).padStart(3, "0");
  return `${padded}/${prefix.toUpperCase()}/${year}`;
}

/**
 * Saran nomor berikutnya, dihitung dari jumlah sertifikat yang sudah terbit
 * tahun ini. Ini hanya saran yang bisa diedit admin - bukan nomor urut atomik,
 * jadi nomor kembar tetap mungkin terjadi bila ada sertifikat dibatalkan.
 */
export function suggestCertificateNo(
  issuedThisYear: number,
  prefix = "SWIM",
  now: Date = new Date(),
): string {
  const year = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
    }).format(now),
  );

  return formatCertificateNo(prefix, issuedThisYear + 1, year);
}

/** Nama berkas unduhan tanpa ekstensi. */
export function certificateFileBase(draft: CertificateDraft): string {
  const slug = draft.studentName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `sertifikat-${slug || "murid"}`;
}