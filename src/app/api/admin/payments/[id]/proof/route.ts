import { NextResponse } from "next/server";
import { findPaymentProof } from "@/admin/data";
import {
  isAllowedPaymentProofType,
  parseProofDataUrl,
} from "@/lib/payment-proof";
import { getCurrentUser } from "@/lib/session";

/**
 * Ambil bukti bayar untuk pratinjau admin.
 *
 * Bukti disimpan sebagai data URL di `payments.proof_url`, jadi route ini
 * mengembalikannya sebagai response biner dengan `Content-Type` yang benar.
 * Berkasnya sengaja tidak ikut di payload tabel pembayaran — besar sampai 5 MB,
 * dan hanya perlu ada di memori ketika admin benar-benar membuka pratinjau.
 *
 * `?download=1` memaksa browser menyimpan berkasnya.
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
      { error: "Hanya admin yang bisa melihat bukti pembayaran." },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  }

  const record = await findPaymentProof(id);
  if (!record) {
    return NextResponse.json(
      { error: "Bukti pembayaran tidak ditemukan." },
      { status: 404 },
    );
  }

  const proof = parseProofDataUrl(record.proofUrl);
  if (!proof) {
    return NextResponse.json(
      { error: "Berkas bukti pembayaran rusak." },
      { status: 422 },
    );
  }

  if (!isAllowedPaymentProofType(proof.mimeType)) {
    return NextResponse.json(
      { error: "Jenis berkas tidak didukung." },
      { status: 415 },
    );
  }

  const wantsDownload =
    new URL(request.url).searchParams.get("download") === "1";
  const extension =
    proof.mimeType === "application/pdf" ? "pdf" : proof.mimeType.split("/")[1];

  // Disalin ke buffer baru supaya tipenya `ArrayBuffer`-backed, yang diterima
  // `BodyInit`.
  const body = new Uint8Array(proof.bytes);

  return new NextResponse(body, {
    headers: {
      "Content-Type": proof.mimeType,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `${wantsDownload ? "attachment" : "inline"}; filename="bukti-pembayaran.${extension}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}