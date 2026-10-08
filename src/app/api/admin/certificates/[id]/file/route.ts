import { NextResponse } from "next/server";
import { findCertificateFile, isAllowedCertificateType } from "@/admin/data";
import { getCurrentUser } from "@/lib/session";

/**
 * Ambil berkas sertifikat untuk pratinjau atau unduhan.
 *
 * Data URL dipecah supaya bisa dikirim sebagai response biner dengan
 * `Content-Type` yang benar. `?download=1` memaksa browser menyimpan berkas
 * dengan nama `sertifikat-<program>.pdf`.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (admin.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa melihat berkas sertifikat." },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  }

  const record = await findCertificateFile(id);
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
  const wantsDownload =
    new URL(request.url).searchParams.get("download") === "1";

  const extension = mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1];
  const safeCourse = record.courseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "kelulusan";
  const filename = `sertifikat-${safeCourse}.${extension}`;

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": wantsDownload
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}