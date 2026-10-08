import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { isAllowedCertificateType } from "@/admin/data";
import { getCurrentUser } from "@/lib/session";

/**
 * Unduh berkas sertifikat milik peserta yang sedang login.
 *
 * Sertifikat disimpan sebagai data URL di `certificates.file_url`. Berkasnya
 * disajikan lewat route ini (bukan disisipkan ke HTML halaman) supaya halaman
 * Sertifikat peserta tidak ikut memuat berkas sebesar itu.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  }

  // `userId` ikut difilter supaya peserta lain tidak bisa menebak URL
  // sertifikat milik orang lain.
  const rows = await db
    .select({
      fileUrl: certificates.fileUrl,
      courseName: certificates.courseName,
    })
    .from(certificates)
    .where(and(eq(certificates.id, id), eq(certificates.userId, user.id)))
    .limit(1);

  const record = rows[0];
  if (!record) {
    return NextResponse.json(
      { error: "Sertifikat tidak ditemukan." },
      { status: 404 },
    );
  }

  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.*)$/i.exec(record.fileUrl);
  if (!match) {
    return NextResponse.json(
      { error: "Berkas sertifikat rusak." },
      { status: 422 },
    );
  }

  const [, mimeType, payload] = match;
  if (!isAllowedCertificateType(mimeType)) {
    return NextResponse.json(
      { error: "Jenis berkas tidak didukung." },
      { status: 415 },
    );
  }

  const bytes = Buffer.from(payload, "base64");
  const extension = mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1];
  const safeCourse = record.courseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "kelulusan";

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="sertifikat-${safeCourse}.${extension}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}