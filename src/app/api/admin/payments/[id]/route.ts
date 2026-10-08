import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { findPaymentById, isPaymentStatus, setPaymentStatus } from "@/admin/data";
import { getCurrentUser } from "@/lib/session";

/**
 * Setujui atau tolak bukti bayar.
 *
 * Body: `{ "status": "paid" | "rejected" | "verification" | "unpaid", "note": "..." }`.
 *
 * `note` hanya dipakai sebagai jejak audit di server — belum ada tabel
 * notifikasi, jadi pesannya belum sampai ke peserta. Yang sampai ke peserta
 * sekarang adalah statusnya: dashboard dan halaman pembayaran peserta membaca
 * tabel `payments` yang sama.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa memverifikasi pembayaran." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const status = typeof body.status === "string" ? body.status : "";

    if (!isPaymentStatus(status)) {
      return NextResponse.json(
        { error: "Status pembayaran tidak dikenali.", field: "status" },
        { status: 400 },
      );
    }

    const payment = await findPaymentById(id);
    if (!payment) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan." },
        { status: 404 },
      );
    }

    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (status === "rejected" && note) {
      console.info(
        `Pembayaran ${id} ditolak untuk ${payment.participantName}: ${note}`,
      );
    }

    const updatedId = await setPaymentStatus(id, status);
    if (!updatedId) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan." },
        { status: 404 },
      );
    }

    revalidatePath("/admin/pembayaran");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pembayaran");

    return NextResponse.json({
      ok: true,
      id: updatedId,
      status,
      participantName: payment.participantName,
    });
  } catch (err) {
    console.error("Gagal memperbarui status pembayaran:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}