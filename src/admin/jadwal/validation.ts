import type { ScheduleInput } from "@/admin/data";

export type SchedulePayload = ScheduleInput;

export type ScheduleValidation =
  | { ok: true; data: SchedulePayload }
  | { ok: false; status: number; error: string; field?: string };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function readString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Jam dari `<input type="time">` bisa berupa "16:00" maupun "16:00:00".
 * Secondiks dipangkas supaya nilai yang tersimpan selalu "HH:MM" dan bisa
 * dibandingkan dengan string lain secara leksikografis.
 */
function normalizeTime(value: string): string {
  const trimmed = value.trim();
  if (!TIME_PATTERN.test(trimmed.slice(0, 5))) return "";

  const [hour, minute] = trimmed.slice(0, 5).split(":");
  return `${hour}:${minute}`;
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/**
 * Validasi payload form sesi jadwal.
 *
 * `dayOfWeek` memakai konvensi `course_sessions.day_of_week`: 0 = Minggu ...
 * 6 = Sabtu. Nilai di luar rentang itu ditolak supaya barisnya tidak pernah
 * hilang dari matriks mingguan.
 */
export function validateSchedulePayload(
  body: Record<string, unknown>,
): ScheduleValidation {
  const courseId = readString(body, "courseId");
  const coachName = readString(body, "coachName");
  const startTime = normalizeTime(readString(body, "startTime"));
  const endTime = normalizeTime(readString(body, "endTime"));

  if (!courseId) {
    return {
      ok: false,
      status: 400,
      error: "Pilih program / paket dulu.",
      field: "courseId",
    };
  }

  if (!coachName) {
    return {
      ok: false,
      status: 400,
      error: "Pilih pelatih dulu.",
      field: "coachName",
    };
  }
  if (coachName.length > 100) {
    return {
      ok: false,
      status: 400,
      error: "Nama pelatih maksimal 100 karakter.",
      field: "coachName",
    };
  }

  const dayOfWeek = Number(body.dayOfWeek);
  if (
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6
  ) {
    return {
      ok: false,
      status: 400,
      error: "Hari tidak dikenali.",
      field: "dayOfWeek",
    };
  }

  if (!startTime) {
    return {
      ok: false,
      status: 400,
      error: "Waktu mulai wajib diisi.",
      field: "startTime",
    };
  }
  if (!endTime) {
    return {
      ok: false,
      status: 400,
      error: "Waktu selesai wajib diisi.",
      field: "endTime",
    };
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return {
      ok: false,
      status: 400,
      error: "Waktu selesai harus lebih besar dari waktu mulai.",
      field: "endTime",
    };
  }
  if (toMinutes(endTime) - toMinutes(startTime) > 12 * 60) {
    return {
      ok: false,
      status: 400,
      error: "Durasi sesi maksimal 12 jam.",
      field: "endTime",
    };
  }

  const capacityRaw = body.capacity;
  let capacity: number | undefined;
  if (capacityRaw !== undefined && capacityRaw !== null && capacityRaw !== "") {
    const parsed = Number(capacityRaw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
      return {
        ok: false,
        status: 400,
        error: "Kapasitas harus antara 1 dan 200.",
        field: "capacity",
      };
    }
    capacity = parsed;
  }

  return {
    ok: true,
    data: { courseId, coachName, dayOfWeek, startTime, endTime, capacity },
  };
}