import { NextResponse } from "next/server";
import {
  deactivateScheduleSession,
  findActiveCoachByName,
  findActiveCoursePackage,
  findScheduleConflict,
  updateScheduleSession,
} from "@/admin/data";
import { validateSchedulePayload } from "@/admin/jadwal/validation";
import { revalidateScheduleViews } from "@/lib/schedule-revalidate";
import { getCurrentUser } from "@/lib/session";

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
      { error: "Hanya admin yang bisa mengubah sesi." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validated = validateSchedulePayload(body);

    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error, field: validated.field },
        { status: validated.status },
      );
    }

    const pkg = await findActiveCoursePackage(validated.data.courseId);
    if (!pkg) {
      return NextResponse.json(
        { error: "Paket tidak ditemukan atau sudah diarsipkan.", field: "courseId" },
        { status: 404 },
      );
    }

    const coach = await findActiveCoachByName(validated.data.coachName);
    if (!coach) {
      return NextResponse.json(
        { error: "Pelatih tidak ditemukan atau sudah nonaktif.", field: "coachName" },
        { status: 404 },
      );
    }

    const conflict = await findScheduleConflict(validated.data, id);
    if (conflict) {
      return NextResponse.json(
        { error: conflict.error, field: conflict.field },
        { status: 409 },
      );
    }

    const updated = await updateScheduleSession(id, validated.data);

    if (!updated) {
      return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    }

    revalidateScheduleViews();

    return NextResponse.json({ ok: true, session: updated, courseName: pkg.name });
  } catch (err) {
    console.error("Gagal mengubah sesi jadwal:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}

/**
 * Hapus sesi.
 *
 * Sesi dinonaktifkan (`is_active = false`), bukan dihapus dari tabel, supaya
 * riwayat kehadiran peserta pada `session_attendances` tetap utuh.
 */
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
      { error: "Hanya admin yang bisa menghapus sesi." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
    }

    const removed = await deactivateScheduleSession(id);

    if (!removed) {
      return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    }

    revalidateScheduleViews();

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Gagal menghapus sesi jadwal:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}