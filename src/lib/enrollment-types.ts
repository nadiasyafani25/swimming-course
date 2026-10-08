export type CourseSummary = {
  courseId: string;
  name: string;
  slug: string;
  priceMonthly: number;
  durationSessions: number;
  coachName: string;
};

export type ScheduleItem = {
  id: string;
  courseId: string;
  courseName: string;
  coachName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sessionDate: string | null;
};

/**
 * Sesi jadwal berikutnya milik seorang peserta.
 *
 * `dayOffset` dihitung dari zona waktu Indonesia pada saat query, jadi
 * "hari ini" di dashboard sama dengan yang dilihat admin di matriks jadwal.
 */
export type NextScheduleItem = ScheduleItem & {
  /** 0 = hari ini, 1 = besok, 7 = minggu depan. */
  dayOffset: number;
};

export type ProgressSummary = {
  courseId: string;
  courseName: string;
  totalSessions: number;
  attendedSessions: number;
  percent: number;
};

export type PaymentSummary = {
  id: string;
  periodMonth: string;
  dueDate: string;
  amount: number;
  status: string;
  /**
   * Metode pembayaran yang tercatat di tagihan.
   *
   * Baru berarti setelah bukti dikirim; sebelum itu masih nilai default kolom
   * (`qris`). Dibaca string apa adanya, bukan `PaymentMethod`, supaya baris
   * lama atau nilai tak dikenal tidak membuat seluruh query gagal.
   */
  method: string;
  /**
   * Cuma menyatakan bukti sudah ada atau belum, bukan isi berkasnya.
   *
   * `payments.proof_url` disimpan sebagai data URL base64 yang bisa mencapai
   * 5 MB. `PaymentSummary` dipakai di beberapa halaman dashboard, jadi kalau
   * base64-nya ikut dibawa, setiap halaman peserta yang memuat daftar tagihan
   * akan ikut membawa berkas sebesar itu.
   */
  hasProof: boolean;
};

export const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];