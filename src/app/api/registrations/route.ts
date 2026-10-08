import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, payments, registrations } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const program = typeof body.program === "string" ? body.program.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!name || !email || !phone || !program) {
      return NextResponse.json(
        { error: "Nama, email, nomor HP, dan program wajib diisi." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 },
      );
    }

    // Daftar program diambil dari tabel courses, bukan dari daftar hardcode,
    // supaya paket yang baru dibuat admin langsung bisa dipilih di form publik.
    const targetCourse = await db
      .select({ id: courses.id, priceMonthly: courses.priceMonthly })
      .from(courses)
      .where(and(eq(courses.name, program), eq(courses.isActive, true)))
      .limit(1);

    if (targetCourse.length === 0) {
      return NextResponse.json(
        { error: "Program yang dipilih tidak valid." },
        { status: 400 },
      );
    }

    await db.insert(registrations).values({
      name,
      email,
      phone,
      program,
      notes: notes || null,
    });

    // Kalau ada user yang login dan email-nya cocok, buat enrollment + tagihan.
    const user = await getCurrentUser();
    let enrolled = false;

    if (user && user.email === email) {
      const target = targetCourse[0];
      const existing = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, user.id),
            eq(enrollments.courseId, target.id),
          ),
        )
        .limit(1);

      let enrollmentId = existing[0]?.id;

      if (!enrollmentId) {
        const inserted = await db
          .insert(enrollments)
          .values({
            userId: user.id,
            courseId: target.id,
            status: "active",
          })
          .returning({ id: enrollments.id });
        enrollmentId = inserted[0].id;
      }

      // Tagihan bulan berjalan, jatuh tempo 3 hari sebelum bulan berikutnya.
      const now = new Date();
      const periodMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      const nextMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
      );
      const dueDate = new Date(nextMonth);
      dueDate.setUTCDate(dueDate.getUTCDate() - 3);

      const hasPayment = await db
        .select({ id: payments.id })
        .from(payments)
        .where(
          and(
            eq(payments.userId, user.id),
            eq(payments.periodMonth, periodMonth.toISOString().slice(0, 10)),
          ),
        )
        .limit(1);

      if (hasPayment.length === 0) {
        await db.insert(payments).values({
          userId: user.id,
          enrollmentId,
          periodMonth: periodMonth.toISOString().slice(0, 10),
          dueDate: dueDate.toISOString().slice(0, 10),
          amount: target.priceMonthly,
          status: "unpaid",
        });
      }

      enrolled = true;
    }

    return NextResponse.json({ ok: true, enrolled }, { status: 201 });
  } catch (err) {
    console.error("Gagal menyimpan pendaftaran kursus:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}