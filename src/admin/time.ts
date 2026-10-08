/**
 * Zona waktu dan helper waktu yang dipakai bersama oleh panel admin dan
 * halaman peserta.
 */
import {
  TIME_ZONE,
  clockToMinutes,
  dayOfWeek,
  minutesOfDay,
} from "@/lib/jakarta-time";

export { TIME_ZONE, clockToMinutes, dayOfWeek, minutesOfDay };

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

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

/** Tanggal hari ini di zona waktu Indonesia, format YYYY-MM-DD. */
export function todayDate(now: Date = new Date()): string {
  return dateFormatter.format(now);
}

/** Awal bulan berjalan (YYYY-MM-01) menurut zona waktu Indonesia. */
export function currentMonthStart(now: Date = new Date()): string {
  const month = monthFormatter.format(now);
  return `${month}-01`;
}

/** Awal bulan sebelumnya (YYYY-MM-01) menurut zona waktu Indonesia. */
export function previousMonthStart(now: Date = new Date()): string {
  const month = monthFormatter.format(now);
  const [year, monthIndex] = month.split("-").map(Number);
  const previous = new Date(Date.UTC(year, monthIndex - 2, 1));
  return `${previous.getUTCFullYear()}-${String(
    previous.getUTCMonth() + 1,
  ).padStart(2, "0")}-01`;
}

export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(iso)}, ${hours}:${minutes}`;
}

/**
 * Tanggal tampil ringkas, mis. "15 Jul 2026".
 *
 * Wajib diformat dengan `TIME_ZONE`, bukan `getUTCDate()` seperti
 * `formatDate`: tanggal terbit diisi admin sebagai tanggal kalender WIB, jadi
 * "15 Juli 2026 00:00 WIB" tersimpan sebagai "14 Juli 2026 17:00 UTC" dan akan
 * mundur satu hari kalau dibaca memakai UTC.
 */
export function formatDateShort(iso: string | Date): string {
  return shortDateFormatter.format(toDate(iso));
}

/** Sama seperti `formatDateShort`, dengan nama bulan panjang. */
export function formatDateLong(iso: string | Date): string {
  return longDateFormatter.format(toDate(iso));
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}