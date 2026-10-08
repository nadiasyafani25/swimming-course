import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { findUserByEmail } from "@/admin/data";
import { getErrorCode, UNIQUE_VIOLATION } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { getCurrentUser } from "@/lib/session";
import { isValidEmail, isValidPhone, normalizeEmail } from "@/lib/validation";

const MIN_PASSWORD_LENGTH = 8;

function readString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menambah peserta." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const firstName = readString(body, "firstName");
    const lastName = readString(body, "lastName");
    const email = normalizeEmail(readString(body, "email"));
    const phone = readString(body, "phone");
    const password = typeof body.password === "string" ? body.password : "";

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "Nama depan, nama belakang, email, dan telepon wajib diisi." },
        { status: 400 },
      );
    }
    if (firstName.length > 100 || lastName.length > 100) {
      return NextResponse.json(
        { error: "Nama maksimal 100 karakter." },
        { status: 400 },
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Nomor telepon harus 9-15 digit." },
        { status: 400 },
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
        },
        { status: 400 },
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 },
      );
    }

    const inserted = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        phone,
        passwordHash: await hashPassword(password),
        role: "peserta",
        isActive: true,
      })
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      });

    return NextResponse.json({ ok: true, participant: inserted[0] }, { status: 201 });
  } catch (err) {
    if (getErrorCode(err) === UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 },
      );
    }
    console.error("Gagal menambah peserta:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}