export const UNIQUE_VIOLATION = "23505";

/**
 * Kode error Postgres yang dibungkus Drizzle muncul di `err.cause.code`,
 * bukan di `err.code`. Lihat register/route.ts untuk kasus yang sama.
 */
export function getErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if ("code" in err && typeof err.code === "string") return err.code;

  const { cause } = err as { cause?: unknown };
  if (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    typeof cause.code === "string"
  ) {
    return cause.code;
  }

  return undefined;
}