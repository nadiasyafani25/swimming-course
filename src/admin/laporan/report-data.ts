import {
  getActiveEnrollmentTotals,
  getMonthlyRevenue,
  getPackagePopularityInRange,
} from "@/admin/data";
import {
  REPORT_RANGES,
  getCurrentMonth,
  getRangeDateBounds,
  getRangeMonths,
  type PackagePopularity,
  type RangeSummary,
  type ReportData,
  type ReportRange,
} from "@/admin/laporan/report-range";

/**
 * Menyusun data halaman laporan di server.
 *
 * Satu kali baca bulanan untuk ketiga rentang, lalu ringkasan dan tabel paket
 * dihitung di memori. Ini membuat tombol "Bulan ini / Kuartal ini / Tahun ini"
 * hanya mengubah tampilan di browser tanpa query ulang, tanpa mengorbankan
 * angka yang tetap berasal dari database.
 */
export async function getReportData(now: Date = new Date()): Promise<ReportData> {
  const current = getCurrentMonth(now);
  const monthly = await getMonthlyRevenue();

  const summaries = {} as Record<ReportRange, RangeSummary>;
  const packages = {} as Record<ReportRange, PackagePopularity[]>;

  const packageQueries = REPORT_RANGES.map(async (item) => {
    const bounds = getRangeDateBounds(item.value, now);
    const rows = await getPackagePopularityInRange(bounds.start, bounds.end);
    packages[item.value] = rows;
  });

  for (const item of REPORT_RANGES) {
    const months = getRangeMonths(item.value, now);
    let revenue = 0;
    let paidCount = 0;

    for (const month of months) {
      const found = monthly.get(month.key);
      if (!found) continue;
      revenue += found.total;
      paidCount += found.paidCount;
    }

    summaries[item.value] = {
      revenue,
      paidCount,
      average: paidCount > 0 ? Math.round(revenue / paidCount) : 0,
    };
  }

  await Promise.all(packageQueries);
  const totals = await getActiveEnrollmentTotals();

  // 12 bulan terakhir, termasuk bulan ini, supaya grafik punya isi walau belum
  // ada transaksi di bulan-bulan awal.
  const months = Array.from({ length: 12 }, (_, index) => {
    const zeroBased = current.year * 12 + (current.month - 1) + (index - 11);
    const year = Math.floor(zeroBased / 12);
    const month = (zeroBased % 12) + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const found = monthly.get(key);

    return {
      key,
      year,
      month,
      total: found?.total ?? 0,
      paidCount: found?.paidCount ?? 0,
    };
  });

  return {
    months,
    summaries,
    packages,
    totalActiveParticipants: totals.participants,
    totalActiveEnrollments: totals.enrollments,
  };
}