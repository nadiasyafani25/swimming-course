import { NextResponse } from "next/server";
import { deleteMessage } from "@/admin/data";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menghapus pesan." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
    }

    const deleted = await deleteMessage(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Pesan tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Gagal menghapus pesan kontak:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}