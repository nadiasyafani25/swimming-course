import { NextResponse } from "next/server";
import {
  createCoursePackage,
  findCoursePackageByName,
} from "@/admin/data";
import { validateCoursePackagePayload } from "@/admin/paket/validation";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menambah paket." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validated = validateCoursePackagePayload(body);

    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error, field: validated.field },
        { status: validated.status },
      );
    }

    const clash = await findCoursePackageByName(validated.data.name);
    if (clash) {
      return NextResponse.json(
        { error: "Paket dengan nama itu sudah ada.", field: "name" },
        { status: 409 },
      );
    }

    const created = await createCoursePackage(validated.data);

    return NextResponse.json({ ok: true, package: created }, { status: 201 });
  } catch (err) {
    console.error("Gagal menambah paket kursus:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}