import { formatPriceLabel, AGE_GROUPS } from "@/lib/course-format";

export type CoursePackageInput = {
  name: string;
  description: string | null;
  priceMonthly: number;
  priceLabel: string | null;
  priceUnit: string | null;
  capacityLabel: string | null;
  ageGroups: string[];
  durationSessions: number;
  coachName: string | null;
};

export type CoursePackageValidation =
  | { ok: true; data: CoursePackageInput }
  | { ok: false; status: number; error: string; field?: string };

function readString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

function parseRupiahToNumber(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;

  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value) || value < 0) return null;

  return value;
}

/**
 * Harga diisi sebagai angka (untuk tagihan) dan opsional string tampilan
 * (untuk rentang/promo yang tidak bisa diturunkan dari angka, mis.
 * "Rp 1,5jt - 3jt"). Kalau string tampilan kosong, kartu akan memakai
 * hasil format otomatis dari angka.
 */
export function validateCoursePackagePayload(
  body: Record<string, unknown>,
): CoursePackageValidation {
  const name = readString(body, "name");
  const capacityLabel = readString(body, "capacityLabel");
  const priceUnit = readString(body, "priceUnit");
  const priceLabel = readString(body, "priceLabel");
  const description = readString(body, "description");
  const coachName = readString(body, "coachName");
  const priceRaw = readString(body, "priceMonthly");
  const durationRaw = readString(body, "durationSessions");

  if (!name) {
    return { ok: false, status: 400, error: "Nama paket wajib diisi.", field: "name" };
  }
  if (name.length > 100) {
    return {
      ok: false,
      status: 400,
      error: "Nama paket maksimal 100 karakter.",
      field: "name",
    };
  }

  const priceMonthly = parseRupiahToNumber(priceRaw);
  if (priceMonthly === null) {
    return {
      ok: false,
      status: 400,
      error: "Harga bulanan wajib diisi dengan angka.",
      field: "priceMonthly",
    };
  }
  if (priceMonthly > 1_000_000_000) {
    return {
      ok: false,
      status: 400,
      error: "Harga terlalu besar.",
      field: "priceMonthly",
    };
  }

  if (!capacityLabel) {
    return {
      ok: false,
      status: 400,
      error: "Label kapasitas wajib diisi.",
      field: "capacityLabel",
    };
  }
  if (capacityLabel.length > 100) {
    return {
      ok: false,
      status: 400,
      error: "Label kapasitas maksimal 100 karakter.",
      field: "capacityLabel",
    };
  }

  if (!priceUnit) {
    return {
      ok: false,
      status: 400,
      error: "Satuan harga wajib diisi.",
      field: "priceUnit",
    };
  }

  if (priceLabel && priceLabel.length > 100) {
    return {
      ok: false,
      status: 400,
      error: "Teks harga maksimal 100 karakter.",
      field: "priceLabel",
    };
  }

  const ageGroupsRaw = body.ageGroups;
  const requested = Array.isArray(ageGroupsRaw)
    ? ageGroupsRaw.filter((item): item is string => typeof item === "string")
    : [];
  const validKeys = new Set(AGE_GROUPS.map((group) => group.key));

  if (requested.some((item) => !validKeys.has(item as never))) {
    return {
      ok: false,
      status: 400,
      error: "Kelompok usia tidak dikenali.",
      field: "ageGroups",
    };
  }

  let durationSessions = 8;
  if (durationRaw) {
    const parsed = Number.parseInt(durationRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 200) {
      return {
        ok: false,
        status: 400,
        error: "Target sesi harus antara 1 dan 200.",
        field: "durationSessions",
      };
    }
    durationSessions = parsed;
  }

  return {
    ok: true,
    data: {
      name,
      description: emptyToNull(description),
      priceMonthly,
      priceLabel: emptyToNull(priceLabel),
      priceUnit,
      capacityLabel,
      ageGroups: requested,
      durationSessions,
      coachName: emptyToNull(coachName),
    },
  };
}

export { formatPriceLabel };
