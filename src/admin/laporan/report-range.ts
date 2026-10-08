/**
 * Rentang waktu laporan: bulan ini, kuartal ini, atau tahun ini.
 *
 * Semua perhitungan memakai waktu Indonesia, sama seperti "hari ini" di matriks
 * jadwal, supaya angka laporan tidak bergeser satu hari dari zona waktu server.
 */

export type ReportRange = "month" | "quarter" | "year";

export type ReportMonth = {
  /** "2026-10" */
  key: string;
  year: number;
  /** 1 = Januari ... 12 = Desember */
  month: number;
};

export type RangeSummary = {
  revenue: number;
  paidCount: number;
  average: number;
};

export type MonthlyRevenue = ReportMonth & {
  /** Nominal tagihan lunas pada bulan itu. */
  total: number;
  /** Berapa transaksi lunas pada bulan itu. */
  paidCount: number;
};

export type PackagePopularity = {
  name: string;
  participants: number;
};

export type ReportData = {
  /** 12 bulan terakhir, termasuk bulan ini. */
  months: MonthlyRevenue[];
  summaries: Record<ReportRange, RangeSummary>;
  packages: Record<ReportRange, PackagePopularity[]>;
  totalActiveParticipants: number;
  totalActiveEnrollments: number;
};

export const REPORT_RANGES: { value: ReportRange; label: string }[] = [
  { value: "month", label: "Bulan ini" },
  { value: "quarter", label: "Kuartal ini" },
  { value: "year", label: "Tahun ini" },
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(year: number, month: number, delta: number): ReportMonth {
  const zeroBased = year * 12 + (month - 1) + delta;
  return {
    key: monthKey(Math.floor(zeroBased / 12), (zeroBased % 12) + 1),
    year: Math.floor(zeroBased / 12),
    month: (zeroBased % 12) + 1,
  };
}

/** Tahun dan bulan berjalan menurut zona waktu Indonesia. */
export function getCurrentMonth(now: Date = new Date()): ReportMonth {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  return { key: monthKey(year, month), year, month };
}

/** Bulan-bulan yang termasuk dalam satu rentang laporan. */
export function getRangeMonths(
  range: ReportRange,
  now: Date = new Date(),
): ReportMonth[] {
  const current = getCurrentMonth(now);

  if (range === "month") return [current];

  if (range === "quarter") {
    const firstMonth = Math.floor((current.month - 1) / 3) * 3 + 1;
    return [0, 1, 2].map((offset) =>
      shiftMonth(current.year, firstMonth + offset, 0),
    );
  }

  return Array.from({ length: 12 }, (_, index) =>
    shiftMonth(current.year, index + 1, 0),
  );
}

/**
 * Bulan yang ditampilkan di grafik.
 *
 * "Bulan ini" memakai enam bulan terakhir supaya admin masih punya garis
 * tren, bukan satu batang tunggal; kuartal dan tahun memakai persis bulan-bulan
 * dalam rentang itu.
 */
export function getChartMonths(
  range: ReportRange,
  now: Date = new Date(),
): ReportMonth[] {
  if (range === "month") {
    const current = getCurrentMonth(now);
    return Array.from({ length: 6 }, (_, index) =>
      shiftMonth(current.year, current.month, index - 5),
    );
  }

  return getRangeMonths(range, now);
}

export function isMonthInRange(month: ReportMonth, range: ReportRange, now?: Date) {
  return getRangeMonths(range, now).some((item) => item.key === month.key);
}

/** Judul periode untuk kartu dan PDF, mis. "Oktober 2026". */
export function getRangeLabel(range: ReportRange, now: Date = new Date()): string {
  const current = getCurrentMonth(now);

  if (range === "month") {
    return `${MONTH_NAMES[current.month - 1]} ${current.year}`;
  }

  if (range === "quarter") {
    const quarter = Math.floor((current.month - 1) / 3) + 1;
    return `Kuartal ${quarter} ${current.year}`;
  }

  return `Tahun ${current.year}`;
}

/** Rentang tanggal untuk query enrollment, format YYYY-MM-DD. */
export function getRangeDateBounds(
  range: ReportRange,
  now: Date = new Date(),
): { start: string; end: string } {
  const months = getRangeMonths(range, now);
  const first = months[0];
  const last = months[months.length - 1];

  const lastDay = new Date(Date.UTC(last.year, last.month, 0)).getUTCDate();

  return {
    start: `${first.key}-01`,
    end: `${last.key}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function getMonthShortLabel(month: number): string {
  return MONTH_SHORT[month - 1] ?? "-";
}

/** Sumbu kiri grafik: "24,5jt" supaya tidak perlu menulis "Rp" di setiap label. */
export function formatAxisValue(value: number): string {
  if (Math.abs(value) < 1_000_000) return `${Math.round(value / 1000)}rb`;
  if (Math.abs(value) < 1_000_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  }
  return `${(value / 1_000_000_000).toFixed(1).replace(".", ",")}M`;
}