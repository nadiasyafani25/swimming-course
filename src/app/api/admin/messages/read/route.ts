import { NextResponse } from "next/server";
import { setMessageRead } from "@/admin/data";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa mengubah pesan." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const isRead = body.isRead;

    if (!id || typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "id dan isRead wajib diisi." },
        { status: 400 },
      );
    }

    const updated = await setMessageRead(id, isRead);
    if (!updated) {
      return NextResponse.json(
        { error: "Pesan tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, id, isRead });
  } catch (err) {
    console.error("Gagal mengubah status pesan:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}