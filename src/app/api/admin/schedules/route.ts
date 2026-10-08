import { NextResponse } from "next/server";
import {
  createScheduleSession,
  findActiveCoachByName,
  findActiveCoursePackage,
  findScheduleConflict,
  listScheduleRows,
} from "@/admin/data";
import { validateSchedulePayload } from "@/admin/jadwal/validation";
import { revalidateScheduleViews } from "@/lib/schedule-revalidate";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa melihat semua jadwal." },
      { status: 403 },
    );
  }

  const sessions = await listScheduleRows();
  return NextResponse.json({ ok: true, sessions });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menambah sesi." },
      { status: 403 },
    );
  }

  try {
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

    const conflict = await findScheduleConflict(validated.data);
    if (conflict) {
      return NextResponse.json(
        { error: conflict.error, field: conflict.field },
        { status: 409 },
      );
    }

    const created = await createScheduleSession(validated.data);

    revalidateScheduleViews();

    return NextResponse.json(
      { ok: true, session: created, courseName: pkg.name },
      { status: 201 },
    );
  } catch (err) {
    console.error("Gagal menambah sesi jadwal:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}