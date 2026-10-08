export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type ContactMessageFilter = "all" | "unread" | "read";

export type ContactMessagePage = {
  rows: ContactMessageRow[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  filter: ContactMessageFilter;
  query: string;
};

export type AdminStatTone = "navy" | "blue" | "green" | "amber";

export type AdminStatCardData = {
  label: string;
  value: string;
  hint: string;
  tone: AdminStatTone;
};

export type RegistrationStatus = "lunas" | "menunggu";

export type RecentRegistrationRow = {
  id: string;
  name: string;
  program: string;
  createdAt: string;
  status: RegistrationStatus;
};

export type ParticipantStatus = "aktif" | "menunggu" | "nonaktif";

export type ParticipantRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: ParticipantStatus;
  /** Nama paket dari enrollment aktif; null kalau belum mendaftar kursus. */
  packageName: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CoachRow = {
  id: string;
  name: string;
  certification: string | null;
  background: string | null;
  phone: string;
  email: string;
  isActive: boolean;
  /** Berapa course + sesi yang memakai nama pelatih ini. */
  courseCount: number;
};

export type CoursePackageRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  /** String harga siap tampil; sudah termasuk prefix "Rp". */
  priceLabel: string;
  priceUnit: string;
  capacityLabel: string;
  ageGroups: string[];
  durationSessions: number;
  coachName: string;
  isActive: boolean;
  sessionCount: number;
  enrollmentCount: number;
};

/** Bentuk yang dipakai katalog publik di dashboard peserta. */
export type CatalogCourse = {
  slug: string;
  title: string;
  badge: string;
  price: string;
  categories: string[];
};

/**
 * Satu baris matriks jadwal mingguan (`course_sessions`).
 *
 * `dayOfWeek` memakai konvensi database: 0 = Minggu ... 6 = Sabtu, sama seperti
 * `Date.prototype.getDay()`. Jam disimpan sebagai "HH:MM" supaya bisa langsung
 * dibandingkan dan diurutkan tanpa parsing ulang.
 */
export type ScheduleRow = {
  id: string;
  courseId: string;
  courseName: string;
  coachName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  /** Tanggal khusus untuk sesi sekali jalan; null untuk template mingguan. */
  sessionDate: string | null;
  isActive: boolean;
};

/**
 * Peserta beserta paket yang sedang dia ambil.
 *
 * Dipakai pratinjau di panel admin: hanya sesi dari `packageIds` inilah yang
 * akan muncul di "Jadwal saya" peserta tersebut.
 */
export type ParticipantScheduleRow = {
  id: string;
  name: string;
  packageIds: string[];
  packageNames: string[];
};

/**
 * Status tagihan di tabel `payments`.
 *
 * `paid` sudah dipakaiquery pendapatan dan dashboard peserta, jadi nilainya tidak
 * diubah. Dua status lain ditambahkan untuk alur verifikasi bukti bayar:
 * `verification` (bukti sudah diunggah, menunggu dicek admin) dan `rejected`
 * (bukti ditolak, peserta diminta mengunggah ulang).
 */
export type PaymentStatus = "unpaid" | "verification" | "paid" | "rejected";

/**
 * Status tagihan di tabel `payments`.
 *
 * `paid` sudah dipakai query pendapatan dan dashboard peserta, jadi nilainya
 * tidak diubah. Dua status lain ditambahkan untuk alur verifikasi bukti bayar:
 * `verification` (bukti sudah diunggah, menunggu dicek admin) dan `rejected`
 * (bukti ditolak, peserta diminta mengunggah ulang).
 */

/** Satu baris tabel "Pembayaran" di panel admin. */
export type PaymentRow = {
  id: string;
  participantName: string;
  participantEmail: string;
  /** Nama paket dari enrollment yang terkait; null kalau tagihan tanpa enrollment. */
  packageName: string | null;
  amount: number;
  status: PaymentStatus;
  /** Metode yang dipakai peserta, mis. "QRIS" atau "Transfer Bank". */
  methodLabel: string;
  /**
   * Cuma menyatakan bukti sudah ada atau belum, bukan isi berkasnya.
   *
   * `payments.proof_url` disimpan sebagai data URL base64 yang bisa mencapai
   * 5 MB. Kalau ikut dikirim ke tabel ini, seluruh bukti akan ikut ter-inline
   * ke payload halaman admin setiap kali panel dibuka. Isinya diambil terpisah
   * lewat route `/api/admin/payments/[id]/proof` saat pratinjau dibuka.
   */
  hasProof: boolean;
  /** Bulan tagihan, format YYYY-MM-01. */
  periodMonth: string;
  /** Tanggal bukti dikirim / tagihan dibuat, ISO dengan zona waktu. */
  createdAt: string;
  dueDate: string;
  paidAt: string | null;
};

/**
 * Angka untuk empat kartu ringkasan.
 *
 * Semua dihitung dari baris `payments` yang aktif, bukan dari nilai yang
 * disimpan di frontend, jadi kartu ikut berubah begitu admin menyetujui atau
 * menolak bukti bayar.
 */
export type PaymentStats = {
  /** Total nominal lunas untuk bulan tagihan berjalan. */
  revenueThisMonth: number;
  /** Jumlah tagihan yang buktinya menunggu diperiksa admin. */
  pendingVerification: number;
  /** Jumlah tagihan aktif yang belum dibayar. */
  unpaid: number;
  /** Jumlah tagihan yang dibuat hari ini (WIB). */
  createdToday: number;
};

export type SwimStatus = "belum_dievaluasi" | "bisa_berenang";

/**
 * Satu baris tabel "Kelola sertifikat".
 *
 * Barisnya selalu per peserta (bukan per sertifikat): seorang peserta bisa
 * punya sertifikat untuk beberapa program sekaligus, jadi program yang
 * ditampilkan adalah sertifikat terbaru milik peserta tersebut.
 */
export type CertificateRow = {
  /** Id user peserta, dipakai untuk update status dan sertifikat. */
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Program dari enrollment aktif; fallback ke program sertifikat. */
  programName: string | null;
  swimStatus: SwimStatus;
  isActive: boolean;
  /** Id sertifikat terbaru; null kalau belum ada yang diterbitkan. */
  certificateId: string | null;
  /** ISO date dari `certificates.issue_date`. */
  issueDate: string | null;
  issuedBy: string | null;
  /** Nama program pada sertifikat terbaru. */
  certificateCourse: string | null;
  /** Berapa sertifikat yang sudah terbit untuk peserta ini. */
  certificateCount: number;
};

export type CertificateStats = {
  /** Peserta berstatus "Bisa berenang". */
  passCount: number;
  /** Jumlah sertifikat yang benar-benar sudah diunggah/diterbitkan. */
  issuedCount: number;
  /** Peserta berstatus "Belum dievaluasi". */
  pendingCount: number;
  /** Total peserta aktif, dipakai sebagai pembanding di kartu ringkasan. */
  totalCount: number;
};