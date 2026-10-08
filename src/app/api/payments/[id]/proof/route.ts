import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  isAllowedPaymentProofType,
  MAX_PAYMENT_PROOF_BYTES,
  parseProofDataUrl,
} from "@/lib/payment-proof";
import { isPaymentMethod } from "@/lib/payment-method";
import { submitPaymentProof } from "@/lib/enrollment-data";
import { getCurrentUser } from "@/lib/session";

/**
 * Peserta mengirim bukti pembayaran.
 *
 * Body: `{ "fileUrl": "data:image/jpeg;base64,...", "method": "qris" }`.
 *
 * `method` dikirim bersama berkasnya, bukan disimpan terpisah, karena yang
 * menggambarkan bukti adalah metode yang benar-benar dipakai peserta — bukan
 * pilihannya sebelum mengirim.
 *
 * Client mengirim berkas sebagai data URL karena proyek ini belum punya object
 * storage; kolom `payments.proof_url` bertipe `text` memang sudah disiapkan
 * untuk itu, dan bukti disimpan apa adanya supaya panel admin bisa
 * menampilkannya.
 *
 * Ini route handler, bukan server action: `next.config.ts` tidak mengatur
 * `serverActions.bodySizeLimit`, jadi batas bawaan 1 MB akan menolak hampir
 * semua bukti bayaran.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role === "admin") {
    return NextResponse.json(
      { error: "Hanya peserta yang bisa mengirim bukti pembayaran." },
      { status: 403 },
    );
  }

  try {
    const { id: paymentId } = await params;
    if (!paymentId) {
      return NextResponse.json(
        { error: "id wajib diisi." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    // Metode dicek di sini, bukan dipercaya dari browser: kalau peserta mengirim
    // `method: "free"` atau mengirim apa saja, nilainya akan tersimpan utuh di
    // `payments.method` dan muncul sebagai teks asing di panel admin.
    if (!isPaymentMethod(body.method)) {
      return NextResponse.json(
        { error: "Metode pembayaran tidak valid." },
        { status: 400 },
      );
    }

    const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";
    if (!fileUrl) {
      return NextResponse.json(
        { error: "Bukti pembayaran wajib diunggah." },
        { status: 400 },
      );
    }

    const proof = parseProofDataUrl(fileUrl);
    if (!proof) {
      return NextResponse.json(
        { error: "Format berkas tidak valid." },
        { status: 400 },
      );
    }

    if (!isAllowedPaymentProofType(proof.mimeType)) {
      return NextResponse.json(
        { error: "Hanya JPG, PNG, atau PDF yang diperbolehkan." },
        { status: 400 },
      );
    }

    if (proof.bytes.byteLength === 0) {
      return NextResponse.json(
        { error: "Berkas kosong. Pilih ulang bukti pembayaran Anda." },
        { status: 400 },
      );
    }

    if (proof.bytes.byteLength > MAX_PAYMENT_PROOF_BYTES) {
      return NextResponse.json(
        { error: "Ukuran berkas maksimal 5 MB." },
        { status: 400 },
      );
    }

    const savedId = await submitPaymentProof(
      user.id,
      paymentId,
      fileUrl,
      body.method,
    );
    if (!savedId) {
      // Tagihan tidak ada, bukan milik peserta ini, atau sudah lunas. Semuanya
      // dibalas sama supaya id tagihan orang lain tidak bisa ditebak.
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan atau tidak bisa diunggah ulang." },
        { status: 404 },
      );
    }

    revalidatePath("/dashboard/pembayaran");
    revalidatePath("/dashboard");
    revalidatePath("/admin/pembayaran");
    revalidatePath("/admin");

    return NextResponse.json({ ok: true, id: savedId }, { status: 201 });
  } catch (err) {
    console.error("Gagal menyimpan bukti pembayaran:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}