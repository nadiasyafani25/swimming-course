/** "Rp 2.000.000" */
export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

/**
 * Nominal ringkas untuk kartu ringkasan, mis. "Rp 24,5jt".
 *
 * Angka di bawah satu juta ditulis penuh supaya nominal kecil tetap terbaca
 * ("Rp 850.000"), bukan "Rp 0,9jt".
 */
export function formatRupiahShort(value: number): string {
  const amount = Math.round(value);

  if (Math.abs(amount) < 1_000_000) return formatRupiah(amount);

  if (Math.abs(amount) < 1_000_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  }

  return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(".", ",")}M`;
}

const MONTH_NAMES = [
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

/** "2026-10-01" -> "Oktober 2026" */
export function formatPeriodMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return `${MONTH_NAMES[month - 1] ?? "-"} ${year}`;
}

/** Tanggal jatuh tempo, mis. "10 Oktober 2026". */
export function formatDueDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1] ?? "-"} ${year}`;
}