import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getCurrentUser } from "@/lib/session";

const MIN_PASSWORD_LENGTH = 8;
const WRONG_CURRENT_PASSWORD = "Kata sandi saat ini salah.";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sesi Anda sudah berakhir. Silakan masuk kembali." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = readString(body.confirmPassword);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          error:
            "Kata sandi saat ini, kata sandi baru, dan konfirmasi wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter.` },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Konfirmasi kata sandi tidak cocok." },
        { status: 400 },
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "Kata sandi baru harus berbeda dari kata sandi saat ini." },
        { status: 400 },
      );
    }

    const found = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const record = found[0];

    if (!record) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan. Silakan masuk kembali." },
        { status: 404 },
      );
    }

    const isValid = await verifyPassword(currentPassword, record.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: WRONG_CURRENT_PASSWORD }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Gagal mengubah kata sandi:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
