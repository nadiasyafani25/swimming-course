import { NextResponse } from "next/server";
import { findCoachByName, setCoachActive, updateCoach } from "@/admin/data";
import { validateCoachPayload } from "@/admin/coaches/validation";
import { getErrorCode, UNIQUE_VIOLATION } from "@/lib/errors";
import { getCurrentUser } from "@/lib/session";

/**
 * Ubah data pelatih, atau arsip lewat `{ isActive: false }`.
 *
 * Pelatih tidak dihapus dari tabel supaya course dan sesi yang memakainya tetap
 * punya rujukan. `courses.coach_name` disinkronkan otomatis kalau namanya
 * berubah — kolom itu masih teks bebas, bukan foreign key.
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
      { error: "Hanya admin yang bisa mengubah pelatih." },
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
      const changed = await setCoachActive(id, body.isActive);

      if (!changed) {
        return NextResponse.json(
          { error: "Pelatih tidak ditemukan." },
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true, id, isActive: body.isActive });
    }

    const validated = validateCoachPayload(body);

    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error },
        { status: validated.status },
      );
    }

    const clash = await findCoachByName(validated.data.name);
    if (clash && clash.id !== id) {
      return NextResponse.json(
        { error: "Pelatih dengan nama itu sudah ada." },
        { status: 409 },
      );
    }

    const updated = await updateCoach(id, validated.data);

    if (!updated) {
      return NextResponse.json(
        { error: "Pelatih tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, coach: updated });
  } catch (err) {
    if (getErrorCode(err) === UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "Pelatih dengan nama itu sudah ada." },
        { status: 409 },
      );
    }
    console.error("Gagal mengubah pelatih:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}