import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import {
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";
import { isValidEmail, isValidPhone, normalizeEmail } from "@/lib/validation";
import { homeForRole } from "@/lib/roles";

const MIN_PASSWORD_LENGTH = 8;
const UNIQUE_VIOLATION = "23505";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if ("code" in err && typeof err.code === "string") return err.code;
  const { cause } = err as { cause?: unknown };
  if (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    typeof cause.code === "string"
  ) {
    return cause.code;
  }
  return undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = readString(body.firstName);
    const lastName = readString(body.lastName);
    const email = normalizeEmail(readString(body.email));
    const phone = readString(body.phone);
    const password = typeof body.password === "string" ? body.password : "";

    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Nama depan, nama belakang, email, nomor telepon, dan kata sandi wajib diisi." },
        { status: 400 },
      );
    }
    if (firstName.length > 100 || lastName.length > 100) {
      return NextResponse.json(
        { error: "Nama depan dan nama belakang maksimal 100 karakter." },
        { status: 400 },
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 },
      );
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Nomor telepon tidak valid. Gunakan 9-15 digit." },
        { status: 400 },
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    const inserted = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
      })
      .returning({ id: users.id, firstName: users.firstName, role: users.role });

    const newUser = inserted[0];

    const token = await createSession(newUser.id);
    const response = NextResponse.json(
      {
        ok: true,
        firstName: newUser.firstName,
        role: newUser.role,
        redirectTo: homeForRole(newUser.role),
      },
      { status: 201 },
    );
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);

    return response;
  } catch (err) {
    if (getErrorCode(err) === UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." },
        { status: 409 },
      );
    }
    console.error("Gagal menyimpan akun pengguna:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
