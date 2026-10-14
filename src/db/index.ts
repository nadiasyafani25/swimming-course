import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Koneksi database.
 *
 * Sengaja dibuat lazy: `next build` mengimpor modul ini untuk setiap route,
 * termasuk route yang tidak pernah menyentuh database. Kalau `DATABASE_URL`
 * dibaca (dan divalidasi) di tingkat modul, build akan gagal setiap kali env var
 * belum diset di platform — persis yang terjadi di Vercel, karena `.env.local`
 * tidak pernah ikut ter-push.
 *
 * `neon()` sendiri hanya membungkus `fetch` dan tidak pernah terhubung sampai
 * ada query yang benar-benar dieksekusi, jadi instantiate saat import aman.
 */
function createDb(): NeonHttpDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL belum diset. Isi di Vercel > Settings > Environment Variables " +
        "dan centang Production, Preview, serta Development. Nilai-nya adalah " +
        "pooled connection string dari Neon Dashboard > Connection Strings.",
    );
  }

  return drizzle(neon(url), { schema });
}

let instance: NeonHttpDatabase<typeof schema> | undefined;

function resolve(): NeonHttpDatabase<typeof schema> {
  instance ??= createDb();
  return instance;
}

/**
 * Proxy agar seluruh call site (`db.select()`, `db.insert()`, `db.delete()`)
 * tetap apa adanya tanpa harus menginisialisasi koneksi lebih dulu.
 *
 * `then` dikembalikan `undefined` supaya objek ini tidak terbaca sebagai
 * thenable ketika-await atau di-resolve oleh runtime.
 */
export const db: NeonHttpDatabase<typeof schema> = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, property) {
    if (property === "then" || property === "$$typeof") return undefined;

    const target = resolve() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(target, property);

    return typeof value === "function" ? value.bind(target) : value;
  },
  has(_target, property) {
    return Reflect.has(resolve() as object, property);
  },
});
