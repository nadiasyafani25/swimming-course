const TIME_ZONE = "Asia/Jakarta";

export { TIME_ZONE };

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Jam dan hari dalam zona waktu Indonesia, dipakai bersama oleh panel admin
 * dan halaman peserta supaya "hari ini" di matriks jadwal sama dengan yang
 * dilihat peserta di dashboardnya.
 */

/** Menit sejak tengah malam di zona waktu Indonesia. */
export function minutesOfDay(now: Date = new Date()): number {
  const parts = timeFormatter.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/**
 * Konvensi `course_sessions.day_of_week` di database: 0 = Minggu ... 6 = Sabtu,
 * sama seperti `Date.prototype.getDay()`.
 */
export function dayOfWeek(now: Date = new Date()): number {
  const [year, month, day] = dayFormatter.format(now).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Ubah "16:00" (atau "16:00:00") menjadi menit sejak tengah malam. */
export function clockToMinutes(time: string): number {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
}