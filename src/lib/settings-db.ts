import { cache } from "react";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import {
  SETTING_DEFAULTS,
  SETTING_KEYS,
  isBooleanSetting,
  type SiteSettings,
} from "@/lib/settings";

/**
 * Pembacaan dan penulisan pengaturan situs.
 *
 * Dipisah dari `@/lib/settings` supaya modul yang menyimpan definisi dan helper
 * tetap bisa diimpor komponen client tanpa menarik driver database ke bundel
 * browser.
 */

/**
 * Baca seluruh pengaturan.
 *
 * `cache()` membuat satu query per request walaupun `getSiteSettings()` dipanggil
 * dari banyak komponen (layout, navbar, footer, sertifikat).
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings);

  const result: SiteSettings = { ...SETTING_DEFAULTS };

  for (const row of rows) {
    const key = row.key as keyof SiteSettings;
    if (!(key in SETTING_DEFAULTS)) continue;

    if (isBooleanSetting(key)) {
      result[key] = row.value === "true";
      continue;
    }

    const value = row.value.trim();
    if (value) result[key] = value as never;
  }

  return result;
});

/**
 * Simpan seluruh pengaturan.
 *
 * Satu upsert untuk semua key, bukan update per baris, supaya satu klik Simpan
 * selalu menyimpan keenam nilai apa adanya. Driver `neon-http` yang dipakai
 * project ini tidak mendukung transaksi, jadi lebih baik satu statement.
 */
export async function saveSiteSettings(
  input: SiteSettings,
): Promise<SiteSettings> {
  const values = SETTING_KEYS.map((key) => ({
    key,
    value: String(input[key]),
  }));

  await db
    .insert(settings)
    .values(values)
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: sql`excluded.value`,
        updatedAt: new Date(),
      },
    });

  return input;
}