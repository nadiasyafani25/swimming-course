import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Endpoint diagnostik sementara.
 *
 * Halaman produksi membalas 500 dan penyebabnya hanya muncul di log server,
 * sehingga mustahil dibedakan dari luar: env var kosong, host yang salah,
 * atau tabel yang belum termigrasi. Endpoint ini menjawab ketiganya langsung
 * dan harus DIHAPUS setelah masalah beres.
 */
export async function GET() {
  const url = process.env.DATABASE_URL ?? null;

  let host = null;
  try {
    host = url ? new URL(url).host : null;
  } catch {
    host = "URL tidak bisa diparse";
  }

  if (!url) {
    return NextResponse.json({
      diagnosis: "DATABASE_URL belum diset di environment ini.",
      region: process.env.VERCEL_REGION ?? null,
      host: null,
    });
  }

  try {
    const rows = await db.execute(sql`select current_database() as db, version()`);
    return NextResponse.json({
      diagnosis: "Koneksi berhasil.",
      host,
      result: rows.rows ?? rows,
    });
  } catch (err) {
    return NextResponse.json(
      {
        diagnosis: "DATABASE_URL ada tapi query gagal.",
        host,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}