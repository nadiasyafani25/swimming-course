import type {
  MonthlyRevenue,
  PackagePopularity,
  RangeSummary,
} from "@/admin/laporan/report-range";
import { MONTH_NAMES } from "@/admin/laporan/report-range";
import { formatRupiah } from "@/admin/pembayaran/payment-format";

/**
 * Ringkasan laporan untuk berkas PDF.
 *
 * `jspdf` (pustaka PDF) sengaja di-import dinamis supaya tidak ikut terbundel
 * di awal halaman laporan - baru dimuat saat admin menekan "Unduh PDF".
 */
export type PdfReportInput = {
  rangeLabel: string;
  summary: RangeSummary;
  months: MonthlyRevenue[];
  packages: PackagePopularity[];
  totalActiveParticipants: number;
  generatedAt: Date;
};

const NAVY = "#0A2540";
const ACCENT = "#0A3966";
const LINE = "#D6E5F3";
const MUTED = "#526B84";

const PAGE_MARGIN = 14;
const CONTENT_WIDTH = 182;

export async function downloadReportPdf(input: PdfReportInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = PAGE_MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > 283) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  doc.setFillColor(NAVY);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SwimmingCourse", PAGE_MARGIN, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Laporan pendapatan dan paket kursus", PAGE_MARGIN, 19);

  y = 36;

  doc.setTextColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Periode: ${input.rangeLabel}`, PAGE_MARGIN, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(
    `Dicetak ${input.generatedAt.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`,
    PAGE_MARGIN,
    y,
  );

  y += 10;

  const summaryBoxes: [string, string][] = [
    ["Total masuk", formatRupiah(input.summary.revenue)],
    ["Transaksi lunas", String(input.summary.paidCount)],
    [
      "Rata-rata per transaksi",
      input.summary.paidCount > 0
        ? formatRupiah(input.summary.average)
        : "-",
    ],
    ["Peserta aktif", String(input.totalActiveParticipants)],
  ];

  const boxWidth = (CONTENT_WIDTH - 9) / 2;
  summaryBoxes.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = PAGE_MARGIN + column * (boxWidth + 9);
    const boxY = y + row * 22;

    doc.setDrawColor(LINE);
    doc.setFillColor("#F8FAFC");
    doc.roundedRect(x, boxY, boxWidth, 18, 1.5, 1.5, "FD");

    doc.setTextColor(MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label, x + 4, boxY + 6.5);

    doc.setTextColor(index === 0 ? ACCENT : NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(value, x + 4, boxY + 14);
  });

  y += 22 * 2 + 6;

  doc.setTextColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Pendapatan per bulan", PAGE_MARGIN, y);
  y += 6;

  const headerRow = () => {
    doc.setFillColor("#E5F1FC");
    doc.rect(PAGE_MARGIN, y - 4, CONTENT_WIDTH, 7, "F");
    doc.setTextColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("BULAN", PAGE_MARGIN + 3, y);
    doc.text("TRANSAKSI LUNAS", 110, y);
    doc.text("PENDAPATAN", 148, y);
  };

  headerRow();
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  input.months.forEach((month, index) => {
    ensureSpace(8);

    if (index % 2 === 1) {
      doc.setFillColor("#FBFDFF");
      doc.rect(PAGE_MARGIN, y - 4.5, CONTENT_WIDTH, 7, "F");
    }

    const periodLabel =
      month.year !== input.generatedAt.getFullYear()
        ? `${MONTH_NAMES[month.month - 1]} ${month.year}`
        : MONTH_NAMES[month.month - 1];

    doc.setTextColor(NAVY);
    doc.text(periodLabel, PAGE_MARGIN + 3, y);
    doc.setTextColor(MUTED);
    doc.text(String(month.paidCount), 110, y);
    doc.setTextColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.text(formatRupiah(month.total), 148, y);
    doc.setFont("helvetica", "normal");

    y += 7;
  });

  y += 8;

  ensureSpace(24);
  doc.setTextColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Paket terpopuler", PAGE_MARGIN, y);
  y += 6;

  doc.setFillColor("#E5F1FC");
  doc.rect(PAGE_MARGIN, y - 4, CONTENT_WIDTH, 7, "F");
  doc.setTextColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("PAKET", PAGE_MARGIN + 3, y);
  doc.text("PESERTA", 148, y);
  y += 8;

  if (input.packages.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text("Tidak ada pendaftaran pada periode ini.", PAGE_MARGIN + 3, y);
    y += 7;
  } else {
    doc.setFontSize(9);

    input.packages.forEach((item, index) => {
      ensureSpace(8);

      if (index % 2 === 1) {
        doc.setFillColor("#FBFDFF");
        doc.rect(PAGE_MARGIN, y - 4.5, CONTENT_WIDTH, 7, "F");
      }

      doc.setTextColor(NAVY);
      doc.text(item.name, PAGE_MARGIN + 3, y);
      doc.setFont("helvetica", "bold");
      doc.text(String(item.participants), 148, y);
      doc.setFont("helvetica", "normal");

      y += 7;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `SwimmingCourse - Laporan ${input.rangeLabel}`,
      PAGE_MARGIN,
      292,
    );
    doc.text(`Halaman ${page} dari ${pages}`, 196, 292, { align: "right" });
  }

  const fileName = `laporan-pembayaran-${input.rangeLabel
    .toLowerCase()
    .replace(/\s+/g, "-")}.pdf`;

  doc.save(fileName);
}