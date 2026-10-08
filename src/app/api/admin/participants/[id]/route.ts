import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { findUserByEmail } from "@/admin/data";
import { getErrorCode, UNIQUE_VIOLATION } from "@/lib/errors";
import { getCurrentUser } from "@/lib/session";
import { isValidEmail, isValidPhone, normalizeEmail } from "@/lib/validation";

function readString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Ubah data peserta.
 *
 * `isActive` dipakai untuk arsip: baris tidak dihapus dari tabel supaya
 * enrollment, pembayaran, absensi, dan sertifikat peserta tidak ikut hilang
 * (semua FK-nya ON DELETE CASCADE). Peserta yang dinonaktifkan juga langsung
 * kehilangan sesi aktifnya supaya tidak bisa login lagi.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  }
  if (admin.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa mengubah peserta." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    // Arsip / aktifkan kembali
    if (typeof body.isActive === "boolean") {
      const isActive = body.isActive;

      if (admin.id === id && !isActive) {
        return NextResponse.json(
          { error: "Anda tidak bisa menonaktifkan akun Anda sendiri." },
          { status: 400 },
        );
      }

      const updated = await db
        .update(users)
        .set({ isActive })
        .where(and(eq(users.id, id), eq(users.role, "peserta")))
        .returning({ id: users.id });

      if (updated.length === 0) {
        return NextResponse.json(
          { error: "Peserta tidak ditemukan." },
          { status: 404 },
        );
      }

      if (!isActive) {
        await db.delete(sessions).where(eq(sessions.userId, id));
      }

      return NextResponse.json({ ok: true, id, isActive });
    }

    const firstName = readString(body, "firstName");
    const lastName = readString(body, "lastName");
    const email = normalizeEmail(readString(body, "email"));
    const phone = readString(body, "phone");

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

    const target = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "peserta")))
      .limit(1);

    if (target.length === 0) {
      return NextResponse.json(
        { error: "Peserta tidak ditemukan." },
        { status: 404 },
      );
    }

    if (email !== target[0].email) {
      const clash = await findUserByEmail(email);
      if (clash) {
        return NextResponse.json(
          { error: "Email sudah dipakai peserta lain." },
          { status: 409 },
        );
      }
    }

    const updated = await db
      .update(users)
      .set({ firstName, lastName, email, phone })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
      });

    return NextResponse.json({ ok: true, participant: updated[0] });
  } catch (err) {
    if (getErrorCode(err) === UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "Email sudah dipakai peserta lain." },
        { status: 409 },
      );
    }
    console.error("Gagal mengubah peserta:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}