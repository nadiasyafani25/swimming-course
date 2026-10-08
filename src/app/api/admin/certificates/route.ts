import { NextResponse } from "next/server";
import {
  isAllowedCertificateType,
  MAX_CERTIFICATE_BYTES,
  saveCertificate,
} from "@/admin/data";
import { getCurrentUser } from "@/lib/session";
import type { SwimStatus } from "@/db/schema";

function readString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function toSwimStatus(value: string): SwimStatus | null {
  return value === "bisa_berenang" || value === "belum_dievaluasi"
    ? value
    : null;
}

/**
 * Terbitkan sertifikat untuk seorang peserta.
 *
 * Client mengirim berkas sebagai data URL (`file.data`) karena proyek ini
 * belum punya object storage; kolom `certificates.file_url` bertipe `text`
 * memang sudah disiapkan untuk menampung tautan berkas. Data URL disimpan
 * apa adanya supaya halaman Sertifikat peserta bisa langsung mengunduhnya.
 */
export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (admin.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menerbitkan sertifikat." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const userId = readString(body, "userId");
    if (!userId) {
      return NextResponse.json({ error: "Peserta wajib diisi." }, { status: 400 });
    }

    const swimStatus = toSwimStatus(readString(body, "swimStatus"));
    if (!swimStatus) {
      return NextResponse.json(
        { error: "Status kemampuan tidak valid." },
        { status: 400 },
      );
    }

    const courseName = readString(body, "courseName");
    if (courseName.length > 150) {
      return NextResponse.json(
        { error: "Nama program maksimal 150 karakter." },
        { status: 400 },
      );
    }

    const issueDate = readString(body, "issueDate");
    const parsedIssueDate = new Date(issueDate);
    if (!issueDate || Number.isNaN(parsedIssueDate.getTime())) {
      return NextResponse.json(
        { error: "Tanggal terbit tidak valid." },
        { status: 400 },
      );
    }

    const fileUrl = readString(body, "fileUrl");
    if (!fileUrl) {
      return NextResponse.json(
        { error: "Berkas sertifikat wajib diunggah." },
        { status: 400 },
      );
    }

    const header = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.*)$/i.exec(fileUrl);
    if (!header) {
      return NextResponse.json(
        { error: "Format berkas tidak valid." },
        { status: 400 },
      );
    }

    const [, mimeType, payload] = header;
    if (!isAllowedCertificateType(mimeType)) {
      return NextResponse.json(
        { error: "Hanya PDF, PNG, JPEG, atau WebP yang diperbolehkan." },
        { status: 400 },
      );
    }

    const base64Length = payload.length;
    // base64 menambah ~33% dari ukuran asli, jadi didekati dari panjang string.
    const approxBytes = Math.floor((base64Length * 3) / 4);
    if (approxBytes > MAX_CERTIFICATE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran berkas maksimal 2 MB." },
        { status: 400 },
      );
    }

    const saved = await saveCertificate({
      userId,
      courseName: courseName || "Sertifikat Kelulusan",
      fileUrl,
      issueDate: parsedIssueDate.toISOString(),
      issuedBy: `${admin.firstName} ${admin.lastName}`.trim() || null,
      swimStatus,
    });

    if (!saved) {
      return NextResponse.json(
        { error: "Peserta tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, ...saved }, { status: 201 });
  } catch (err) {
    console.error("Gagal menerbitkan sertifikat:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}