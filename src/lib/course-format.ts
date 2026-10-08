/**
 * Format harga untuk ditampilkan di katalog publik.
 *
 * `price_label` di database dipakai kalau diisi manual — misalnya untuk
 * Rentang seperti "Rp 1,5jt - 3jt" yang memang tidak bisa diturunkan dari
 * satu angka. Kalau kosong, format ini yang dipakai dari `price_monthly`.
 */
export function formatPriceLabel(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const text = Number.isInteger(millions)
      ? String(millions)
      : millions.toFixed(1).replace(".", ",");
    return `Rp ${text}jt`;
  }

  if (amount >= 1_000) {
    const thousands = Math.round(amount / 1_000);
    return `Rp ${thousands.toLocaleString("id-ID")}rb`;
  }

  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export const AGE_GROUPS = [
  { key: "anak-anak", label: "Anak-anak" },
  { key: "dewasa", label: "Dewasa" },
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number]["key"];

export function parseAgeGroups(value: string | null): AgeGroup[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is AgeGroup =>
      AGE_GROUPS.some((group) => group.key === item),
    );
}
