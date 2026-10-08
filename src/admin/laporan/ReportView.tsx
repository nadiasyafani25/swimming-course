"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import AdminHeaderAction from "@/admin/layout/AdminHeaderAction";
import RevenueChart from "@/admin/laporan/RevenueChart";
import { downloadReportPdf } from "@/admin/laporan/report-pdf";
import {
  REPORT_RANGES,
  getChartMonths,
  getRangeLabel,
  type ReportData,
  type ReportRange,
} from "@/admin/laporan/report-range";
import { formatRupiah } from "@/admin/pembayaran/payment-format";

type ReportViewProps = {
  data: ReportData;
};

export default function ReportView({ data }: ReportViewProps) {
  const [range, setRange] = useState<ReportRange>("month");
  const [exporting, setExporting] = useState(false);

  const rangeMonths = useMemo(
    () => getChartMonths(range).map((month) => month.key),
    [range],
  );

  /**
   * Bulan yang memakai batang navy.
   *
   * Bulan berjalan didahulukan supaya admin langsung tahu posisi "sekarang";
   * kalau bulan ini belum ada transaksi, bulan tertinggi dalam rentang yang
   * dipakai supaya grafik tetap punya sorotan.
   */
  const { chartData, highlightKey, topKey } = useMemo(() => {
    const currentMonth = getChartMonths("year").at(-1)?.key ?? null;
    const window = getChartMonths(range)
      .map((month) => data.months.find((item) => item.key === month.key))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const bestKey = window.reduce<string | null>((best, item) => {
      if (item.total <= 0) return best;
      if (!best) return item.key;
      const bestTotal = window.find((row) => row.key === best)?.total ?? 0;
      return item.total > bestTotal ? item.key : best;
    }, null);

    return {
      chartData: window,
      highlightKey:
        rangeMonths.includes(currentMonth ?? "") && bestKey !== currentMonth
          ? bestKey
          : currentMonth,
      topKey: bestKey,
    };
  }, [data.months, range, rangeMonths]);

  const summary = data.summaries[range];
  const packages = data.packages[range];

  const handleExport = async () => {
    setExporting(true);

    try {
      await downloadReportPdf({
        rangeLabel: getRangeLabel(range),
        summary,
        months: chartData,
        packages,
        totalActiveParticipants: data.totalActiveParticipants,
        generatedAt: new Date(),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <AdminHeaderAction>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting}
          className="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[#0A3966] bg-white px-3.5 text-[12px] font-semibold text-[#0A3966] transition-colors hover:bg-[#0A3966] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Unduh PDF
        </button>
      </AdminHeaderAction>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter periode laporan"
          className="inline-flex w-fit items-center gap-1 rounded-xl border border-[#D6E5F3] bg-white p-1"
        >
          {REPORT_RANGES.map((item) => {
            const active = item.value === range;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setRange(item.value)}
                aria-pressed={active}
                className={`h-[30px] rounded-lg px-3.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? "bg-[#0A3966] text-white"
                    : "text-[#526B84] hover:bg-[#F1F6FB] hover:text-[#073763]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-[#8FA3B8]">
          Periode {getRangeLabel(range)} · total masuk{" "}
          <span className="font-semibold text-[#1F9C63]">
            {formatRupiah(summary.revenue)}
          </span>{" "}
          dari {summary.paidCount} transaksi lunas
        </p>
      </div>

      <div className="grid gap-[18px] xl:grid-cols-5">
        <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)] xl:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[13px] font-bold text-[#073763]">
              Pendapatan per bulan
            </h2>
            <span className="flex items-center gap-3 text-[10px] text-[#8FA3B8]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#7FB3E8]" />
                Bulan berjalan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#0A3966]" />
                Tertinggi
              </span>
            </span>
          </div>

          <p className="mt-1 text-[11px] text-[#8FA3B8]">
            Hanya tagihan berstatus lunas. Batang navy menandai bulan dengan
            pendapatan tertinggi pada periode ini.
          </p>

          <div className="mt-4">
            {chartData.every((item) => item.total === 0) ? (
              <div className="flex h-[260px] items-center justify-center rounded-[9px] border border-dashed border-[#D6E5F3] bg-[#FBFDFF] text-center">
                <p className="px-6 text-[12px] text-[#8FA3B8]">
                  Belum ada transaksi lunas pada periode ini. Grafik akan terisi
                  begitu ada pembayaran disetujui.
                </p>
              </div>
            ) : (
              <RevenueChart
                data={chartData}
                highlightKey={highlightKey}
                topKey={topKey}
              />
            )}
          </div>
        </section>

        <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)] xl:col-span-2">
          <h2 className="text-[13px] font-bold text-[#073763]">
            Paket terpopuler
          </h2>
          <p className="mt-1 text-[11px] text-[#8FA3B8]">
            Enrollment aktif berdasarkan tanggal pendaftaran pada periode ini.
          </p>

          <div className="mt-4 overflow-hidden rounded-[9px] border border-[#D6E5F3]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                    Paket
                  </th>
                  <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                    Peserta
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-10 text-center text-[11px] text-[#8FA3B8]"
                    >
                      Belum ada pendaftaran pada periode ini.
                    </td>
                  </tr>
                ) : (
                  packages.map((item, index) => (
                    <tr
                      key={item.name}
                      className={index === 0 ? "bg-[#F7FBFF]" : undefined}
                    >
                      <td className="border-b border-[#EAF2FA] px-3 py-[11px] text-[11px] font-medium text-[#073763]">
                        <span className="flex items-center gap-2">
                          <span className="w-4 text-[10px] font-bold text-[#A9BACB]">
                            {index + 1}
                          </span>
                          {item.name}
                        </span>
                      </td>
                      <td className="border-b border-[#EAF2FA] px-3 py-[11px] text-right text-[12px] font-bold text-[#0A3966]">
                        {item.participants}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[10px] text-[#A9BACB]">
            Total {data.totalActiveParticipants} peserta aktif dengan{" "}
            {data.totalActiveEnrollments} enrollment aktif di seluruh paket.
          </p>
        </section>
      </div>
    </>
  );
}