import { and, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  courseSessions,
  courses,
  enrollments,
  payments,
  sessionAttendances,
} from "@/db/schema";
import type {
  CourseSummary,
  NextScheduleItem,
  PaymentSummary,
  ProgressSummary,
  ScheduleItem,
} from "./enrollment-types";
import { clockToMinutes, dayOfWeek, minutesOfDay } from "./jakarta-time";
import type { PaymentMethod } from "./payment-method";

export type {
  CourseSummary,
  NextScheduleItem,
  PaymentSummary,
  ProgressSummary,
  ScheduleItem,
} from "./enrollment-types";
export { DAY_NAMES } from "./enrollment-types";

function toNumber(value: string | null | undefined): number {
  return Number(value ?? 0);
}

export async function getActiveEnrollments(
  userId: string,
): Promise<CourseSummary[]> {
  const rows = await db
    .select({
      courseId: courses.id,
      name: courses.name,
      slug: courses.slug,
      priceMonthly: courses.priceMonthly,
      durationSessions: courses.durationSessions,
      coachName: courses.coachName,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(and(eq(enrollments.userId, userId), eq(enrollments.status, "active")));

  return rows.map((row) => ({
    ...row,
    priceMonthly: toNumber(row.priceMonthly),
    coachName: row.coachName ?? "Belum ditentukan",
  }));
}

export async function getWeeklySchedule(
  courseIds: string[],
): Promise<ScheduleItem[]> {
  if (courseIds.length === 0) return [];

  const rows = await db
    .select({
      id: courseSessions.id,
      courseId: courseSessions.courseId,
      courseName: courses.name,
      coachName: courseSessions.coachName,
      dayOfWeek: courseSessions.dayOfWeek,
      startTime: courseSessions.startTime,
      endTime: courseSessions.endTime,
      sessionDate: courseSessions.sessionDate,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courseSessions.courseId, courses.id))
    .where(
      and(
        inArray(courseSessions.courseId, courseIds),
        eq(courseSessions.isActive, true),
      ),
    );

  return rows
    .map((row) => ({
      ...row,
      coachName: row.coachName ?? "Belum ditentukan",
    }))
    .sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
    );
}

/**
 * Sesi terdekat berikutnya untuk peserta.
 *
 * Semua jadwal di `getWeeklySchedule` bersifat mingguan (`session_date` NULL),
 * jadi "berikutnya" dihitung dari `day_of_week` versus hari ini di zona waktu
 * Indonesia. Sesi hari ini yang jam mulainya sudah lewat digeser ke minggu
 * depan, bukan disembunyikan.
 */
export async function getNextSessions(
  courseIds: string[],
  limit = 3,
): Promise<NextScheduleItem[]> {
  const schedule = await getWeeklySchedule(courseIds);
  if (schedule.length === 0) return [];

  const today = dayOfWeek();
  const now = minutesOfDay();

  return schedule
    .map((item) => {
      const start = clockToMinutes(item.startTime);
      let dayOffset = (item.dayOfWeek - today + 7) % 7;
      if (dayOffset === 0 && start <= now) dayOffset = 7;

      return { ...item, dayOffset };
    })
    .sort(
      (a, b) =>
        a.dayOffset - b.dayOffset ||
        clockToMinutes(a.startTime) - clockToMinutes(b.startTime),
    )
    .slice(0, limit);
}

export async function getProgress(userId: string): Promise<ProgressSummary[]> {
  const active = await getActiveEnrollments(userId);
  if (active.length === 0) return [];

  const enrollmentRows = await db
    .select({ id: enrollments.id, courseId: enrollments.courseId })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.status, "active")));

  if (enrollmentRows.length === 0) return [];

  const attendanceRows = await db
    .select({
      enrollmentId: sessionAttendances.enrollmentId,
      status: sessionAttendances.status,
    })
    .from(sessionAttendances)
    .where(
      inArray(
        sessionAttendances.enrollmentId,
        enrollmentRows.map((r) => r.id),
      ),
    );

  return active.map((course) => {
    const enrollment = enrollmentRows.find((e) => e.courseId === course.courseId);
    const attended = enrollment
      ? attendanceRows.filter(
          (a) =>
            a.enrollmentId === enrollment.id &&
            (a.status === "hadir" || a.status === "izin"),
        ).length
      : 0;

    const percent =
      course.durationSessions > 0
        ? Math.min(100, Math.round((attended / course.durationSessions) * 100))
        : 0;

    return {
      courseId: course.courseId,
      courseName: course.name,
      totalSessions: course.durationSessions,
      attendedSessions: attended,
      percent,
    };
  });
}

export async function getPayments(userId: string): Promise<PaymentSummary[]> {
  const rows = await db
    .select({
      id: payments.id,
      periodMonth: payments.periodMonth,
      dueDate: payments.dueDate,
      amount: payments.amount,
      status: payments.status,
      method: payments.method,
      // Yang dibutuhkan hanya "ada atau tidak"; isi base64-nya dibaca terpisah
      // lewat `findPaymentProof` supaya tidak ikut masuk payload halaman.
      hasProof: sql<boolean>`${payments.proofUrl} is not null`,
    })
    .from(payments)
    .where(eq(payments.userId, userId));

  return rows
    .map((row) => ({ ...row, amount: toNumber(row.amount) }))
    .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth));
}

export async function getUpcomingPayment(
  userId: string,
): Promise<PaymentSummary | null> {
  const all = await getPayments(userId);
  const pending = all.filter((p) => p.status !== "paid");
  return pending[0] ?? null;
}

/**
 * Simpan bukti bayar milik seorang peserta.
 *
 * Kepemilikan tagihan ikut jadi syarat di `WHERE`, bukan dicek terpisah di
 * aplikasi: kalau `paymentId` milik orang lain, query ini tidak mengubah
 * apa pun dan mengembalikan null, jadi peserta tidak bisa menimpa bukti tagihan
 * peserta lain hanya dengan menebak id.
 *
 * Status langsung pindah ke `verification` karena bukti sudah ada dan
 * menunggu dicek admin. `paidAt` dikosongkan supaya kolom "lunas pada tanggal
 * berapa" tidak menyesatkan kalau sebelumnya tagihan ini sempat disetujui lalu
 * diunggah ulang.
 *
 * Tagihan yang sudah `paid` tidak bisa diunggah ulang supaya bukti yang sudah
 * disetujui admin tidak bisa digantisepihak oleh peserta.
 */
export async function submitPaymentProof(
  userId: string,
  paymentId: string,
  proofUrl: string,
  method: PaymentMethod,
): Promise<PaymentSummary["id"] | null> {
  const updated = await db
    .update(payments)
    .set({ proofUrl, method, status: "verification", paidAt: null })
    .where(
      and(
        eq(payments.id, paymentId),
        eq(payments.userId, userId),
        ne(payments.status, "paid"),
      ),
    )
    .returning({ id: payments.id });

  return updated[0]?.id ?? null;
}

export async function countSessionsThisWeek(courseIds: string[]) {
  if (courseIds.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const result = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(courseSessions)
    .where(
      and(
        inArray(courseSessions.courseId, courseIds),
        eq(courseSessions.isActive, true),
        sql`${courseSessions.sessionDate} is not null`,
        gte(courseSessions.sessionDate, today),
        lte(courseSessions.sessionDate, nextWeek),
      ),
    );

  return result[0]?.n ?? 0;
}