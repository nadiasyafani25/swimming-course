import { isValidEmail, isValidPhone, normalizeEmail } from "@/lib/validation";

export type CoachInput = {
  name: string;
  certification: string | null;
  background: string | null;
  phone: string | null;
  email: string | null;
};

export type CoachValidationResult =
  | { ok: true; data: CoachInput }
  | { ok: false; status: number; error: string };

function readTrimmedString(
  body: Record<string, unknown>,
  key: string,
): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

/** String kosong dinormalkan jadi null supaya tidak tersimpan sebagai "". */
function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

/**
 * Kolom nama, lisensi, dan telepon wajib dicek di server, bukan hanya di form,
 * karena route API bisa dipanggil langsung tanpa lewat UI.
 */
export function validateCoachPayload(
  body: Record<string, unknown>,
): CoachValidationResult {
  const name = readTrimmedString(body, "name");
  const certification = readTrimmedString(body, "certification");
  const background = readTrimmedString(body, "background");
  const phone = readTrimmedString(body, "phone");
  const email = normalizeEmail(readTrimmedString(body, "email"));

  if (!name) {
    return { ok: false, status: 400, error: "Nama pelatih wajib diisi." };
  }

  if (name.length > 100) {
    return { ok: false, status: 400, error: "Nama maksimal 100 karakter." };
  }

  if (phone && !isValidPhone(phone)) {
    return {
      ok: false,
      status: 400,
      error: "Nomor telepon harus 9-15 digit.",
    };
  }

  if (email && !isValidEmail(email)) {
    return { ok: false, status: 400, error: "Format email tidak valid." };
  }

  return {
    ok: true,
    data: {
      name,
      certification: emptyToNull(certification),
      background: emptyToNull(background),
      phone: emptyToNull(phone),
      email: emptyToNull(email),
    },
  };
}