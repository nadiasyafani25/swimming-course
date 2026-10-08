/**
 * Urut hari sesuai tampilan matriks jadwal: Senin sampai Minggu.
 *
 * Nilai `value` mengikuti kolom `course_sessions.day_of_week`, yaitu konvensi
 * `Date.prototype.getDay()` (0 = Minggu ... 6 = Sabtu) — bukan urutan indeks
 * array di bawah ini.
 */
export const SCHEDULE_DAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 0, label: "Minggu" },
] as const;

export function getDayLabel(dayOfWeek: number): string {
  return SCHEDULE_DAYS.find((day) => day.value === dayOfWeek)?.label ?? "-";
}

export function getDayIndex(dayOfWeek: number): number {
  return SCHEDULE_DAYS.findIndex((day) => day.value === dayOfWeek);
}

/** "16:00" -> "16.00", gaya jam yang dipakai di matriks. */
export function toDotTime(time: string): string {
  return time.slice(0, 5).replace(":", ".");
}

export function toMinutes(time: string): number {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
}

export function fromMinutes(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hour = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const minute = String(wrapped % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

/**
 * Nama ringkas untuk pill sesi, mis. "Kelas reguler - Budi S.".
 *
 * Inisial diambil dari token kedua dari belakang: pada nama Indonesia lengkap
 * ("Budi Santoso") nama belakang yang lazim ditampilkan ada di posisi itu,
 * bukan nama panggilan terakhir.
 */
export function getCoachShortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Belum ditentukan";
  if (parts.length === 1) return parts[0];

  const surname = parts[parts.length - 2];
  return `${parts[0]} ${surname.charAt(0).toUpperCase()}.`;
}

/** Warna pill per paket, diturunkan dari nama paket agar konsisten antar halaman. */
export function getProgramTone(courseName: string): string {
  const name = courseName.trim().toLowerCase();

  if (name.includes("private")) return "bg-[#0A2540]";
  if (name.includes("semi")) return "bg-[#0D3B63]";
  if (name.includes("reguler") || name.includes("kelas")) return "bg-[#15558F]";
  if (name.includes("anak")) return "bg-[#1D5FA8]";

  return "bg-[#0A3966]";
}