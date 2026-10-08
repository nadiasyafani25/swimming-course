import { NextResponse } from "next/server";
import {
  findCoursePackageByName,
  setCoursePackageActive,
  updateCoursePackage,
} from "@/admin/data";
import { validateCoursePackagePayload } from "@/admin/paket/validation";
import { getCurrentUser } from "@/lib/session";

/**
 * Ubah paket kursus, atau arsip lewat `{ isActive: false }`.
 *
 * Paket tidak dihapus dari tabel karena `enrollments.course_id` dan
 * `course_sessions.course_id` cascade — menghapus paket akan ikut menghapus
 * enrollment dan jadwal peserta. Arsip menyembunyikannya dari katalog publik
 * tanpa merusak riwayat.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa mengubah paket." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.isActive === "boolean") {
      const changed = await setCoursePackageActive(id, body.isActive);

      if (!changed) {
        return NextResponse.json(
          { error: "Paket tidak ditemukan." },
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true, id, isActive: body.isActive });
    }

    const validated = validateCoursePackagePayload(body);

    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error, field: validated.field },
        { status: validated.status },
      );
    }

    const clash = await findCoursePackageByName(validated.data.name);
    if (clash && clash.id !== id) {
      return NextResponse.json(
        { error: "Paket dengan nama itu sudah ada.", field: "name" },
        { status: 409 },
      );
    }

    const updated = await updateCoursePackage(id, validated.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Paket tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, package: updated });
  } catch (err) {
    console.error("Gagal mengubah paket kursus:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}