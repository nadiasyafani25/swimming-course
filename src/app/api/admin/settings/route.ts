import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { validateSettingsPayload } from "@/lib/settings";
import { getSiteSettings, saveSiteSettings } from "@/lib/settings-db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa melihat pengaturan." },
      { status: 403 },
    );
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa mengubah pengaturan." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validated = validateSettingsPayload(body);

    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error, field: validated.field },
        { status: validated.status },
      );
    }

    const settings = await saveSiteSettings(validated.data);

    /**
     * Nama tempat kursus, alamat, dan nomor telepon dipakai di sidebar,
     * navbar, footer, halaman kontak, dan template sertifikat. `revalidatePath`
     * untuk root layout memastikan semua halaman itu membaca nilai baru di
     * render berikutnya, bukan hanya halaman Pengaturan.
     */
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("Gagal menyimpan pengaturan:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}