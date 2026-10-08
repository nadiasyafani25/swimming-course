import { NextResponse } from "next/server";
import { createCoach, findCoachByName } from "@/admin/data";
import { validateCoachPayload } from "@/admin/coaches/validation";
import { getErrorCode, UNIQUE_VIOLATION } from "@/lib/errors";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menambah pelatih." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validated = validateCoachPayload(body);

    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error },
        { status: validated.status },
      );
    }

    const clash = await findCoachByName(validated.data.name);
    if (clash) {
      return NextResponse.json(
        { error: "Pelatih dengan nama itu sudah ada." },
        { status: 409 },
      );
    }

    const created = await createCoach(validated.data);

    return NextResponse.json({ ok: true, coach: created }, { status: 201 });
  } catch (err) {
    if (getErrorCode(err) === UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "Pelatih dengan nama itu sudah ada." },
        { status: 409 },
      );
    }
    console.error("Gagal menambah pelatih:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}