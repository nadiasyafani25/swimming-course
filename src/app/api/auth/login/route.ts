import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import {
  createSession,
  deleteExpiredSessions,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";
import { normalizeEmail } from "@/lib/validation";
import { homeForRole } from "@/lib/roles";

const INVALID_CREDENTIALS = "Email atau kata sandi salah. Coba lagi.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(
      typeof body.email === "string" ? body.email : "",
    );
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 },
      );
    }

    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = found[0];
    const isValid = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !isValid) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Akun ini sudah dinonaktifkan. Hubungi admin." },
        { status: 403 },
      );
    }

    const token = await createSession(user.id);
    const response = NextResponse.json(
      { ok: true, role: user.role, redirectTo: homeForRole(user.role) },
      { status: 200 },
    );
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);

    void deleteExpiredSessions().catch((err) => {
      console.error("Gagal membersihkan session kedaluwarsa:", err);
    });

    return response;
  } catch (err) {
    console.error("Gagal memproses login:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
