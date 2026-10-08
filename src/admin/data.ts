import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  certificates,
  coaches,
  contactMessages,
  courseSessions,
  courses,
  enrollments,
  payments,
  registrations,
  users,
} from "@/db/schema";
import type { SwimStatus } from "@/db/schema";
import { formatPriceLabel, parseAgeGroups } from "@/lib/course-format";
import { getPaymentMethodLabel } from "@/lib/payment-method";
import {
  currentMonthStart,
  dayOfWeek,
  minutesOfDay,
  previousMonthStart,
  todayDate,
} from "./time";
import type {
  CatalogCourse,
  CertificateRow,
  CertificateStats,
  CoachRow,
  ContactMessageFilter,
  ContactMessagePage,
  CoursePackageRow,
  ParticipantRow,
  ParticipantScheduleRow,
  ParticipantStatus,
  PaymentRow,
  PaymentStats,
  PaymentStatus,
  RecentRegistrationRow,
  ScheduleRow,
} from "./types";

export type {
  ContactMessageFilter,
  ContactMessagePage,
  ContactMessageRow,
} from "./types";
export type {
  AdminStatCardData,
  AdminStatTone,
  CatalogCourse,
  CertificateRow,
  CertificateStats,
  CoachRow,
  CoursePackageRow,
  ParticipantRow,
  ParticipantScheduleRow,
  ParticipantStatus,
  PaymentRow,
  PaymentStats,
  PaymentStatus,
  RecentRegistrationRow,
  RegistrationStatus,
  ScheduleRow,
  SwimStatus,
} from "./types";

function toSwimStatus(value: string): SwimStatus {
  return value === "bisa_berenang" ? "bisa_berenang" : "belum_dievaluasi";
}

export const MESSAGES_PER_PAGE = 10;
export const RECENT_REGISTRATIONS_LIMIT = 5;

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: string | null | undefined): number {
  return Number(value ?? 0);
}

export function parsePage(value: unknown): number {
  const parsed = Number.parseInt(normalize(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseFilter(value: unknown): ContactMessageFilter {
  return value === "unread" || value === "read" ? value : "all";
}

// ---------------------------------------------------------------------------
// Inbox pesan kontak
// ---------------------------------------------------------------------------

export async function listContactMessages(options: {
  page: number;
  filter: ContactMessageFilter;
  query: string;
}): Promise<ContactMessagePage> {
  const { page, filter, query } = options;

  const conditions = [];
  if (filter === "unread") conditions.push(eq(contactMessages.isRead, false));
  if (filter === "read") conditions.push(eq(contactMessages.isRead, true));
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(
      or(
        ilike(contactMessages.name, pattern),
        ilike(contactMessages.email, pattern),
        ilike(contactMessages.message, pattern),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(where);
  const total = totalResult[0]?.n ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / MESSAGES_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const rows = await db
    .select({
      id: contactMessages.id,
      name: contactMessages.name,
      email: contactMessages.email,
      message: contactMessages.message,
      isRead: contactMessages.isRead,
      createdAt: contactMessages.createdAt,
    })
    .from(contactMessages)
    .where(where)
    .orderBy(desc(contactMessages.createdAt), asc(contactMessages.id))
    .limit(MESSAGES_PER_PAGE)
    .offset((currentPage - 1) * MESSAGES_PER_PAGE);

  return {
    rows: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    total,
    page: currentPage,
    totalPages,
    perPage: MESSAGES_PER_PAGE,
    filter,
    query,
  };
}

export async function countUnreadMessages(): Promise<number> {
  const result = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(eq(contactMessages.isRead, false));

  return result[0]?.n ?? 0;
}

export async function countMessages(): Promise<number> {
  const result = await db.select({ n: count() }).from(contactMessages);
  return result[0]?.n ?? 0;
}

export async function setMessageRead(
  id: string,
  isRead: boolean,
): Promise<boolean> {
  const updated = await db
    .update(contactMessages)
    .set({ isRead })
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id });

  return updated.length > 0;
}

export async function deleteMessage(id: string): Promise<boolean> {
  const deleted = await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id });

  return deleted.length > 0;
}

// ---------------------------------------------------------------------------
// Statistik dashboard
// ---------------------------------------------------------------------------

export async function countUsers(role?: "peserta" | "admin"): Promise<number> {
  const result = await db
    .select({ n: count() })
    .from(users)
    .where(role ? eq(users.role, role) : undefined);

  return result[0]?.n ?? 0;
}

/** Peserta baru yang daftar sejak awal bulan berjalan (menurut waktu Indonesia). */
export async function countNewParticipantsThisMonth(): Promise<number> {
  const result = await db
    .select({ n: count() })
    .from(users)
    .where(
      and(
        eq(users.role, "peserta"),
        gte(users.createdAt, new Date(`${currentMonthStart()}T00:00:00+07:00`)),
      ),
    );

  return result[0]?.n ?? 0;
}

export async function countActiveCoaches(): Promise<number> {
  const result = await db
    .select({ n: count() })
    .from(coaches)
    .where(eq(coaches.isActive, true));

  return result[0]?.n ?? 0;
}

/** Pelatih aktif yang kolom sertifikasinya masih kosong. */
export async function countUncertifiedCoaches(): Promise<number> {
  const result = await db
    .select({ n: count() })
    .from(coaches)
    .where(and(eq(coaches.isActive, true), sql`${coaches.certification} is null`));

  return result[0]?.n ?? 0;
}

/**
 * Sesi yang jatuh pada hari ini according to `day_of_week`.
 *
 * Sengaja memakai `day_of_week`, bukan `session_date`: semua jadwal yang di-seed
 * masih berupa template mingguan dengan `session_date` NULL, jadi memfilter
 * `session_date is not null` selalu mengembalikan 0 baris.
 */
export async function getTodaySessions(): Promise<
  { id: string; courseName: string; startTime: string; endTime: string }[]
> {
  const rows = await db
    .select({
      id: courseSessions.id,
      courseName: courses.name,
      startTime: courseSessions.startTime,
      endTime: courseSessions.endTime,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courseSessions.courseId, courses.id))
    .where(
      and(
        eq(courseSessions.dayOfWeek, dayOfWeek()),
        eq(courseSessions.isActive, true),
      ),
    )
    .orderBy(asc(courseSessions.startTime));

  return rows.map((row) => ({
    ...row,
    startTime: row.startTime.slice(0, 5),
    endTime: row.endTime.slice(0, 5),
  }));
}

/** Sesi hari ini yang jam mulainya belum lewat. */
export function countNotStartedToday(
  sessions: { startTime: string }[],
): number {
  const nowMinutes = minutesOfDay();

  return sessions.filter((session) => {
    const [hour, minute] = session.startTime.split(":").map(Number);
    return hour * 60 + minute > nowMinutes;
  }).length;
}

export async function getPaidRevenue(periodMonth: string): Promise<number> {
  const result = await db
    .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(
      and(eq(payments.status, "paid"), eq(payments.periodMonth, periodMonth)),
    );

  return toNumber(result[0]?.total);
}

export async function getRevenueThisMonth(): Promise<number> {
  return getPaidRevenue(currentMonthStart());
}

export async function getRevenuePreviousMonth(): Promise<number> {
  return getPaidRevenue(previousMonthStart());
}

// ---------------------------------------------------------------------------
// Pendaftaran terbaru
// ---------------------------------------------------------------------------

/**
 * Pendaftaran dari form publik, beserta status pembayaran turunan.
 *
 * Status dihitung dengan EXISTS supaya satu baris registrations tidak
 * menggandakan diri ketika user punya beberapa tagihan yang sudah lunas.
 * Perbandingan email memakai lower() karena form publik menyimpan email apa
 * adanya, sedangkan akun hasil daftar selalu sudah dinormalisasi lowercase.
 */
export async function listRecentRegistrations(options?: {
  limit?: number;
  todayOnly?: boolean;
}): Promise<RecentRegistrationRow[]> {
  const { limit = RECENT_REGISTRATIONS_LIMIT, todayOnly = false } = options ?? {};

  const paidExists = sql<boolean>`exists (
    select 1
    from users u
    join payments p on p.user_id = u.id
    where lower(u.email) = lower(${registrations.email})
      and p.status = 'paid'
  )`;

  const where = todayOnly
    ? gte(registrations.createdAt, new Date(`${todayDate()}T00:00:00+07:00`))
    : undefined;

  const rows = await db
    .select({
      id: registrations.id,
      name: registrations.name,
      program: registrations.program,
      createdAt: registrations.createdAt,
      isPaid: paidExists,
    })
    .from(registrations)
    .where(where)
    .orderBy(desc(registrations.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    program: row.program,
    createdAt: row.createdAt.toISOString(),
    status: row.isPaid ? "lunas" : "menunggu",
  }));
}

export async function countRecentRegistrations(todayOnly = false): Promise<number> {
  const where = todayOnly
    ? gte(registrations.createdAt, new Date(`${todayDate()}T00:00:00+07:00`))
    : undefined;

  const result = await db
    .select({ n: count() })
    .from(registrations)
    .where(where);

  return result[0]?.n ?? 0;
}

// ---------------------------------------------------------------------------
// Data peserta
// ---------------------------------------------------------------------------

/**
 * Semua user berrole peserta beserta paket yang sedang diambilnya.
 *
 * `packageName` diambil dari enrollment aktif terbaru. Kalau seorang peserta
 * punya lebih dari satu enrollment, hanya yang terakhir yang ditampilkan —
 * kolom PAKET di tabel memang satu sel, bukan daftar.
 */
export async function listParticipants(): Promise<ParticipantRow[]> {
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
      courseName: courses.name,
    })
    .from(users)
    .leftJoin(
      enrollments,
      and(eq(enrollments.userId, users.id), eq(enrollments.status, "active")),
    )
    .leftJoin(courses, eq(courses.id, enrollments.courseId))
    .where(eq(users.role, "peserta"))
    .orderBy(
      desc(users.createdAt),
      asc(users.firstName),
      desc(enrollments.enrolledAt),
    );

  // Satu peserta bisa punya lebih dari satu enrollment aktif, jadi barisnya
  // perlu diringkas. Urutan di atas sudah menempatkan enrollment terbaru di
  // baris pertama untuk tiap peserta.
  const seen = new Set<string>();
  const result: ParticipantRow[] = [];

  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);

    result.push({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      packageName: row.courseName,
      status: resolveParticipantStatus(row.isActive, row.courseName),
    });
  }

  return result;
}

function resolveParticipantStatus(
  isActive: boolean,
  courseName: string | null,
): ParticipantStatus {
  if (!isActive) return "nonaktif";
  return courseName ? "aktif" : "menunggu";
}

export async function countParticipantsActive(): Promise<number> {
  const result = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.role, "peserta"), eq(users.isActive, true)));

  return result[0]?.n ?? 0;
}

export async function findUserByEmail(email: string) {
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Data pelatih
// ---------------------------------------------------------------------------

export async function listCoaches(): Promise<CoachRow[]> {
  const rows = await db
    .select({
      id: coaches.id,
      name: coaches.name,
      certification: coaches.certification,
      background: coaches.background,
      phone: coaches.phone,
      email: coaches.email,
      isActive: coaches.isActive,
      courseCount: sql<number>`(
        select count(*)::int from courses c where c.coach_name = ${coaches.name}
      )`,
    })
    .from(coaches)
    .orderBy(desc(coaches.isActive), asc(coaches.name));

  return rows.map((row) => ({
    ...row,
    phone: row.phone ?? "",
    email: row.email ?? "",
  }));
}

export async function createCoach(input: {
  name: string;
  certification: string | null;
  background: string | null;
  phone: string | null;
  email: string | null;
}): Promise<{ id: string; name: string }> {
  const inserted = await db
    .insert(coaches)
    .values({
      name: input.name,
      certification: input.certification,
      background: input.background,
      phone: input.phone,
      email: input.email,
      isActive: true,
    })
    .returning({ id: coaches.id, name: coaches.name });

  return inserted[0];
}

export async function updateCoach(
  id: string,
  input: {
    name: string;
    certification: string | null;
    background: string | null;
    phone: string | null;
    email: string | null;
  },
): Promise<{ id: string; name: string } | null> {
  const existing = await db
    .select({ id: coaches.id, name: coaches.name })
    .from(coaches)
    .where(eq(coaches.id, id))
    .limit(1);

  if (existing.length === 0) return null;

  const updated = await db
    .update(coaches)
    .set({
      name: input.name,
      certification: input.certification,
      background: input.background,
      phone: input.phone,
      email: input.email,
    })
    .where(eq(coaches.id, id))
    .returning({ id: coaches.id, name: coaches.name });

  const renamed = existing[0].name !== input.name;

  if (renamed) {
    await renameCoachReferences(existing[0].name, input.name);
  }

  return updated[0];
}

/**
 * `courses.coach_name` dan `course_sessions.coach_name` masih teks bebas, bukan
 * foreign key ke `coaches`. Kalau nama pelatih diubah, keduanya ikut diperbarui
 * supaya halaman publik dan jadwal tidak menampilkan nama lama.
 */
export async function renameCoachReferences(
  oldName: string,
  newName: string,
): Promise<void> {
  await db
    .update(courses)
    .set({ coachName: newName })
    .where(eq(courses.coachName, oldName));

  await db
    .update(courseSessions)
    .set({ coachName: newName })
    .where(eq(courseSessions.coachName, oldName));
}

export async function setCoachActive(
  id: string,
  isActive: boolean,
): Promise<boolean> {
  const updated = await db
    .update(coaches)
    .set({ isActive })
    .where(eq(coaches.id, id))
    .returning({ id: coaches.id });

  return updated.length > 0;
}

export async function findCoachByName(name: string) {
  const rows = await db
    .select({ id: coaches.id, name: coaches.name })
    .from(coaches)
    .where(eq(coaches.name, name))
    .limit(1);

  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Paket kursus
// ---------------------------------------------------------------------------

type PackageBaseRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: string;
  priceLabel: string | null;
  priceUnit: string | null;
  capacityLabel: string | null;
  ageGroups: string | null;
  durationSessions: number;
  coachName: string | null;
  isActive: boolean;
};

const packageColumns = {
  id: courses.id,
  name: courses.name,
  slug: courses.slug,
  description: courses.description,
  priceMonthly: courses.priceMonthly,
  priceLabel: courses.priceLabel,
  priceUnit: courses.priceUnit,
  capacityLabel: courses.capacityLabel,
  ageGroups: courses.ageGroups,
  durationSessions: courses.durationSessions,
  coachName: courses.coachName,
  isActive: courses.isActive,
};

function toPackageRow(
  row: PackageBaseRow,
  sessionCount: number,
  enrollmentCount: number,
): CoursePackageRow {
  const amount = Number(row.priceMonthly ?? 0);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    priceMonthly: amount,
    priceLabel: row.priceLabel?.trim() || formatPriceLabel(amount),
    priceUnit: row.priceUnit?.trim() || "/ bulan",
    capacityLabel: row.capacityLabel?.trim() || "Tidak dibatasi",
    ageGroups: parseAgeGroups(row.ageGroups),
    durationSessions: row.durationSessions,
    coachName: row.coachName?.trim() || "Belum ditentukan",
    isActive: row.isActive,
    sessionCount,
    enrollmentCount,
  };
}

/**
 * Jumlah sesi dan enrollment diambil lewat agregasi terpisah, bukan
 * subquery di dalam select. Subquery yang menyisipkan kolom tabel lain
 * menghasilkan nama kolom tanpa nama tabel, jadi `course_id = "id"` jadi
 * ambigu terhadap `course_sessions.id` dan `enrollments.id`.
 */
async function getPackageCounts(): Promise<{
  sessions: Map<string, number>;
  enrollments: Map<string, number>;
}> {
  const [sessionRows, enrollmentRows] = await Promise.all([
    db
      .select({ courseId: courseSessions.courseId, n: count() })
      .from(courseSessions)
      .groupBy(courseSessions.courseId),
    db
      .select({ courseId: enrollments.courseId, n: count() })
      .from(enrollments)
      .groupBy(enrollments.courseId),
  ]);

  return {
    sessions: new Map(sessionRows.map((row) => [row.courseId, row.n])),
    enrollments: new Map(enrollmentRows.map((row) => [row.courseId, row.n])),
  };
}

export async function listCoursePackages(): Promise<CoursePackageRow[]> {
  const [rows, counts] = await Promise.all([
    db
      .select(packageColumns)
      .from(courses)
      .orderBy(desc(courses.isActive), asc(courses.name)),
    getPackageCounts(),
  ]);

  return rows.map((row) =>
    toPackageRow(
      row,
      counts.sessions.get(row.id) ?? 0,
      counts.enrollments.get(row.id) ?? 0,
    ),
  );
}

/** Dipakai katalog publik: hanya paket aktif. */
export async function listCatalogCourses(): Promise<CatalogCourse[]> {
  const rows = await db
    .select(packageColumns)
    .from(courses)
    .where(eq(courses.isActive, true))
    .orderBy(asc(courses.name));

  return rows.map((row) => {
    const amount = Number(row.priceMonthly ?? 0);
    const price = row.priceLabel?.trim() || formatPriceLabel(amount);

    return {
      slug: row.slug,
      title: row.name,
      badge: row.capacityLabel?.trim() || "Tidak dibatasi",
      price: `${price} ${row.priceUnit?.trim() || "/ bulan"}`,
      categories: parseAgeGroups(row.ageGroups),
    };
  });
}

/** Opsi dropdown program untuk form pendaftaran publik. */
export async function listCourseOptions(): Promise<string[]> {
  const rows = await db
    .select({ name: courses.name })
    .from(courses)
    .where(eq(courses.isActive, true))
    .orderBy(asc(courses.name));

  return rows.map((row) => row.name);
}

export async function slugifyCourseName(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "paket";

  const clash = await db
    .select({ slug: courses.slug })
    .from(courses)
    .where(sql`${courses.slug} = ${base} or ${courses.slug} like ${`${base}-%`}`)
    .limit(20);

  if (clash.length === 0) return base;

  const used = new Set(clash.map((row) => row.slug));
  let counter = 2;
  while (used.has(`${base}-${counter}`)) counter++;

  return `${base}-${counter}`;
}

export type CoursePackageInput = {
  name: string;
  description: string | null;
  priceMonthly: number;
  priceLabel: string | null;
  priceUnit: string | null;
  capacityLabel: string | null;
  ageGroups: string[];
  durationSessions: number;
  coachName: string | null;
};

export async function createCoursePackage(
  input: CoursePackageInput,
): Promise<{ id: string; name: string; slug: string }> {
  const slug = await slugifyCourseName(input.name);

  const inserted = await db
    .insert(courses)
    .values({
      name: input.name,
      slug,
      description: input.description,
      priceMonthly: input.priceMonthly.toFixed(2),
      priceLabel: input.priceLabel,
      priceUnit: input.priceUnit,
      capacityLabel: input.capacityLabel,
      ageGroups: input.ageGroups.length > 0 ? input.ageGroups.join(",") : null,
      durationSessions: input.durationSessions,
      coachName: input.coachName,
      isActive: true,
    })
    .returning({ id: courses.id, name: courses.name, slug: courses.slug });

  return inserted[0];
}

export async function updateCoursePackage(
  id: string,
  input: CoursePackageInput,
): Promise<{ id: string; name: string } | null> {
  const previous = await db
    .select({ name: courses.name })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);

  if (previous.length === 0) return null;

  const updated = await db
    .update(courses)
    .set({
      name: input.name,
      description: input.description,
      priceMonthly: input.priceMonthly.toFixed(2),
      priceLabel: input.priceLabel,
      priceUnit: input.priceUnit,
      capacityLabel: input.capacityLabel,
      ageGroups: input.ageGroups.length > 0 ? input.ageGroups.join(",") : null,
      durationSessions: input.durationSessions,
      coachName: input.coachName,
    })
    .where(eq(courses.id, id))
    .returning({ id: courses.id, name: courses.name });

  if (previous[0].name !== input.name) {
    await renameCoachReferences(previous[0].name, input.name);
  }

  return updated[0];
}

export async function setCoursePackageActive(
  id: string,
  isActive: boolean,
): Promise<boolean> {
  const updated = await db
    .update(courses)
    .set({ isActive })
    .where(eq(courses.id, id))
    .returning({ id: courses.id });

  return updated.length > 0;
}

export async function findCoursePackageByName(name: string) {
  const rows = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.name, name))
    .limit(1);

  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Kelola sertifikat
// ---------------------------------------------------------------------------

/** Batas ukuran berkas sertifikat, dalam byte. */
export const MAX_CERTIFICATE_BYTES = 2 * 1024 * 1024;

const ALLOWED_CERTIFICATE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export function isAllowedCertificateType(type: string): boolean {
  return (ALLOWED_CERTIFICATE_TYPES as readonly string[]).includes(type);
}

/**
 * Ringkasan seluruh peserta beserta sertifikat terbarunya.
 *
 * Satu baris per peserta, bukan per sertifikat. Sertifikat diambil terpisah
 * lalu diringkas per user supaya peserta yang sudah punya beberapa sertifikat
 * tidak tampil berkali-kali, sementara `certificateCount` tetap menyimpan
 * jumlah sertifikat sebenarnya.
 */
export async function listCertificateRows(): Promise<CertificateRow[]> {
  const [participantRows, certificateRows] = await Promise.all([
    db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        isActive: users.isActive,
        swimStatus: users.swimStatus,
        courseName: courses.name,
      })
      .from(users)
      .leftJoin(
        enrollments,
        and(eq(enrollments.userId, users.id), eq(enrollments.status, "active")),
      )
      .leftJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(users.role, "peserta"))
      .orderBy(
        desc(users.isActive),
        asc(users.firstName),
        asc(users.lastName),
        desc(enrollments.enrolledAt),
      ),

    db
      .select({
        id: certificates.id,
        userId: certificates.userId,
        courseName: certificates.courseName,
        issueDate: certificates.issueDate,
        fileUrl: certificates.fileUrl,
        issuedBy: certificates.issuedBy,
      })
      .from(certificates)
      .orderBy(desc(certificates.issueDate), asc(certificates.id)),
  ]);

  const latest = new Map<string, (typeof certificateRows)[number]>();
  const totals = new Map<string, number>();

  for (const row of certificateRows) {
    totals.set(row.userId, (totals.get(row.userId) ?? 0) + 1);
    if (!latest.has(row.userId)) latest.set(row.userId, row);
  }

  const seen = new Set<string>();
  const result: CertificateRow[] = [];

  for (const row of participantRows) {
    // enrolment aktif terbaru sudah diprioritaskan oleh ORDER BY di atas,
    // jadi peserta cukup dilewati setelah baris pertamanya encountered.
    if (seen.has(row.id)) continue;
    seen.add(row.id);

    const certificate = latest.get(row.id) ?? null;

    result.push({
      userId: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      programName: row.courseName ?? certificate?.courseName ?? null,
      swimStatus: toSwimStatus(row.swimStatus),
      isActive: row.isActive,
      certificateId: certificate?.id ?? null,
      issueDate: certificate ? certificate.issueDate.toISOString() : null,
      issuedBy: certificate?.issuedBy ?? null,
      certificateCourse: certificate?.courseName ?? null,
      certificateCount: totals.get(row.id) ?? 0,
    });
  }

  return result;
}

/**
 * Angka untuk tiga kartu ringkasan.
 *
 * `issuedCount` menghitung baris `certificates` — inilah jumlah sertifikat
 * yang benar-benar sudah diunggah, bukan jumlah peserta yang punya sertifikat.
 */
export async function getCertificateStats(): Promise<CertificateStats> {
  const [statusRows, issuedRows, totalRows] = await Promise.all([
    db
      .select({ swimStatus: users.swimStatus, n: count() })
      .from(users)
      .where(and(eq(users.role, "peserta"), eq(users.isActive, true)))
      .groupBy(users.swimStatus),

    db.select({ n: count() }).from(certificates),
    db
      .select({ n: count() })
      .from(users)
      .where(and(eq(users.role, "peserta"), eq(users.isActive, true))),
  ]);

  let passCount = 0;
  let pendingCount = 0;

  for (const row of statusRows) {
    if (row.swimStatus === "bisa_berenang") passCount = row.n;
    else if (row.swimStatus === "belum_dievaluasi") pendingCount = row.n;
  }

  return {
    passCount,
    issuedCount: issuedRows[0]?.n ?? 0,
    pendingCount,
    totalCount: totalRows[0]?.n ?? 0,
  };
}

/** Update status kemampuan seorang peserta. */
export async function setParticipantSwimStatus(
  userId: string,
  swimStatus: SwimStatus,
): Promise<boolean> {
  const updated = await db
    .update(users)
    .set({ swimStatus })
    .where(and(eq(users.id, userId), eq(users.role, "peserta")))
    .returning({ id: users.id });

  return updated.length > 0;
}

/**
 * Berkas sertifikat untuk endpoint pratinjau/unduh.
 *
 * `fileUrl` tidak ikut di `CertificateRow` supaya tabel admin tidak pernah
 * membawa berkas (hingga 2 MB) ke payload HTML — berkasnya diambil lewat
 * route `/api/admin/certificates/[id]/file` saat admin benar-benar membuka
 * pratinjau atau mengunduhnya.
 */
export async function findCertificateFile(
  certificateId: string,
): Promise<{ fileUrl: string; courseName: string } | null> {
  const rows = await db
    .select({
      fileUrl: certificates.fileUrl,
      courseName: certificates.courseName,
    })
    .from(certificates)
    .where(eq(certificates.id, certificateId))
    .limit(1);

  return rows[0] ?? null;
}

export type CertificateInput = {
  userId: string;
  /** Nama program pada sertifikat; dipakai juga sebagai fallback kolom PROGRAM. */
  courseName: string;
  fileUrl: string;
  issueDate: string;
  issuedBy: string | null;
  swimStatus: SwimStatus;
};

async function findParticipant(userId: string) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.role, "peserta")))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Terbitkan atau perbarui sertifikat seorang peserta.
 *
 * `certificates` punya unique constraint (user_id, course_name), jadi kalau
 * peserta sudah punya sertifikat untuk program yang sama, barisnya di-update
 * alih-alih insert — supaya admin bisa memperbaiki berkas atau tanggal tanpa
 * membuat sertifikat ganda.
 *
 * Penulisan status kemampuan mengikuti operasi sertifikat (bukan satu
 * transaksi) karena driver `neon-http` yang dipakai project ini tidak
 * mendukung transaksi. Statusnya ditulis terakhir supaya kondisi sebagian
 * selesai tidak pernah menampilkan "Bisa berenang" tanpa sertifikatnya.
 */
/** Pelatih aktif untuk dropdown nama pelatih di generator sertifikat. */
export async function listActiveCoachOptions(): Promise<
  { id: string; name: string }[]
> {
  const rows = await db
    .select({ id: coaches.id, name: coaches.name })
    .from(coaches)
    .where(eq(coaches.isActive, true))
    .orderBy(asc(coaches.name));

  return rows;
}

/**
 * Jumlah sertifikat yang sudah terbit tahun ini.
 *
 * Dipakai hanya sebagai saran nomor sertifikat berikutnya di generator, bukan
 * sebagai penghitung nomor urut - makanya query ini tidak memakai tabel
 * counter dan tidak perlu atomic.
 */
export async function countCertificatesIssuedThisYear(
  now: Date = new Date(),
): Promise<number> {
  const result = await db
    .select({ n: count() })
    .from(certificates)
    .where(
      gte(
        certificates.issueDate,
        new Date(`${currentMonthStart(now).slice(0, 4)}-01-01T00:00:00+07:00`),
      ),
    );

  return result[0]?.n ?? 0;
}

export async function saveCertificate(
  input: CertificateInput,
): Promise<{ certificateId: string; swimStatus: SwimStatus } | null> {
  const participant = await findParticipant(input.userId);
  if (!participant) return null;

  const existing = await db
    .select({ id: certificates.id, courseName: certificates.courseName })
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, input.userId),
        eq(certificates.courseName, input.courseName),
      ),
    )
    .limit(1);

  const previous = existing[0];
  let certificateId: string;

  if (previous) {
    const updatedRows = await db
      .update(certificates)
      .set({
        fileUrl: input.fileUrl,
        issueDate: new Date(input.issueDate),
        issuedBy: input.issuedBy,
      })
      .where(eq(certificates.id, previous.id))
      .returning({ id: certificates.id });

    certificateId = updatedRows[0]?.id ?? previous.id;
  } else {
    const insertedRows = await db
      .insert(certificates)
      .values({
        userId: input.userId,
        courseName: input.courseName,
        fileUrl: input.fileUrl,
        issueDate: new Date(input.issueDate),
        issuedBy: input.issuedBy,
      })
      .returning({ id: certificates.id });

    certificateId = insertedRows[0].id;
  }

  await setParticipantSwimStatus(input.userId, input.swimStatus);

  return { certificateId, swimStatus: input.swimStatus };
}

// ---------------------------------------------------------------------------
// Kelola jadwal
// ---------------------------------------------------------------------------

export type ScheduleInput = {
  courseId: string;
  /** `course_sessions.coach_name` masih teks, bukan foreign key ke `coaches`. */
  coachName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity?: number;
};

const scheduleColumns = {
  id: courseSessions.id,
  courseId: courseSessions.courseId,
  courseName: courses.name,
  coachName: courseSessions.coachName,
  dayOfWeek: courseSessions.dayOfWeek,
  startTime: courseSessions.startTime,
  endTime: courseSessions.endTime,
  capacity: courseSessions.capacity,
  sessionDate: courseSessions.sessionDate,
  isActive: courseSessions.isActive,
};

export async function listScheduleRows(options?: {
  includeInactive?: boolean;
}): Promise<ScheduleRow[]> {
  const rows = await db
    .select(scheduleColumns)
    .from(courseSessions)
    .innerJoin(courses, eq(courseSessions.courseId, courses.id))
    .where(
      options?.includeInactive ? undefined : eq(courseSessions.isActive, true),
    )
    .orderBy(
      asc(courseSessions.dayOfWeek),
      asc(courseSessions.startTime),
      asc(courses.name),
    );

  return rows.map((row) => ({
    ...row,
    startTime: row.startTime.slice(0, 5),
    endTime: row.endTime.slice(0, 5),
    coachName: row.coachName?.trim() || "Belum ditentukan",
  }));
}

/** Opsi dropdown "Program / Paket" di form sesi: hanya paket aktif. */
export async function listActivePackageOptions(): Promise<
  { id: string; name: string }[]
> {
  const rows = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.isActive, true))
    .orderBy(asc(courses.name));

  return rows;
}

/** Opsi dropdown "Pelatih" di form sesi: hanya pelatih aktif. */
export async function listActiveCoachNames(): Promise<string[]> {
  const rows = await db
    .select({ name: coaches.name })
    .from(coaches)
    .where(eq(coaches.isActive, true))
    .orderBy(asc(coaches.name));

  return rows.map((row) => row.name);
}

/**
 * Peserta aktif beserta paket yang sedang diambilnya.
 *
 * Dasar pratinjau jadwal peserta di panel admin: hanya sesi dari paket di
 * daftar ini yang tampil untuk peserta tersebut, sama seperti query
 * `getWeeklySchedule(courseIds)` yang dipakai halaman "Jadwal saya".
 */
export async function listParticipantScheduleRows(): Promise<
  ParticipantScheduleRow[]
> {
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      packageId: courses.id,
      packageName: courses.name,
    })
    .from(users)
    .leftJoin(
      enrollments,
      and(eq(enrollments.userId, users.id), eq(enrollments.status, "active")),
    )
    .leftJoin(courses, eq(courses.id, enrollments.courseId))
    .where(and(eq(users.role, "peserta"), eq(users.isActive, true)))
    .orderBy(asc(users.firstName), asc(users.lastName));

  const byUser = new Map<string, ParticipantScheduleRow>();

  for (const row of rows) {
    const name = `${row.firstName} ${row.lastName}`.trim();
    const existing = byUser.get(row.id);

    if (!existing) {
      byUser.set(row.id, {
        id: row.id,
        name,
        packageIds: row.packageId ? [row.packageId] : [],
        packageNames: row.packageName ? [row.packageName] : [],
      });
      continue;
    }

    if (row.packageId && !existing.packageIds.includes(row.packageId)) {
      existing.packageIds.push(row.packageId);
      existing.packageNames.push(row.packageName ?? "");
    }
  }

  return [...byUser.values()];
}

export async function findActiveCoursePackage(id: string) {
  const rows = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.isActive, true)))
    .limit(1);

  return rows[0] ?? null;
}

export async function findActiveCoachByName(name: string) {
  const rows = await db
    .select({ id: coaches.id, name: coaches.name })
    .from(coaches)
    .where(and(eq(coaches.name, name), eq(coaches.isActive, true)))
    .limit(1);

  return rows[0] ?? null;
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/**
 * Sesi aktif pada satu hari, dipakai untuk mendeteksi bentrok.
 *
 * Dicek di aplikasi, bukan unique constraint database: `course_sessions` punya
 * unique index pada (course_id, session_date), dan untuk jadwal mingguan
 * `session_date` NULL — di Postgres NULL tidak dianggap sama dengan NULL, jadi
 * dua sesi template di hari dan jam yang sama tetap bisa tersimpan.
 */
async function listActiveSessionsOnDay(
  dayOfWeek: number,
  excludeId?: string,
): Promise<ScheduleRow[]> {
  const rows = await db
    .select(scheduleColumns)
    .from(courseSessions)
    .innerJoin(courses, eq(courseSessions.courseId, courses.id))
    .where(
      and(
        eq(courseSessions.dayOfWeek, dayOfWeek),
        eq(courseSessions.isActive, true),
      ),
    )
    .orderBy(asc(courseSessions.startTime));

  return rows
    .map((row) => ({
      ...row,
      startTime: row.startTime.slice(0, 5),
      endTime: row.endTime.slice(0, 5),
      coachName: row.coachName?.trim() || "Belum ditentukan",
    }))
    .filter((row) => (excludeId ? row.id !== excludeId : true));
}

export type ScheduleConflict = {
  field: "courseId" | "coachName" | "startTime";
  error: string;
};

const DAY_LABELS: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

function formatClock(time: string): string {
  return time.replace(":", ".");
}

/**
 * Validasi bentrok jadwal sebelum disimpan.
 *
 * Dua aturan: satu paket tidak boleh punya dua sesi mulai pada hari dan jam yang
 * sama di hari yang sama, dan satu pelatih tidak boleh punya dua sesi yang
 * waktunya tumpang tindih.
 */
export async function findScheduleConflict(
  input: ScheduleInput,
  excludeId?: string,
): Promise<ScheduleConflict | null> {
  const sameDay = await listActiveSessionsOnDay(input.dayOfWeek, excludeId);

  const sameCourse = sameDay.find(
    (row) =>
      row.courseId === input.courseId && row.startTime === input.startTime,
  );
  if (sameCourse) {
    return {
      field: "courseId",
      error: `${sameCourse.courseName} sudah punya sesi pada ${DAY_LABELS[input.dayOfWeek]} jam ${formatClock(input.startTime)}.`,
    };
  }

  const coachClash = sameDay.find(
    (row) =>
      row.coachName === input.coachName &&
      toMinutes(input.startTime) < toMinutes(row.endTime) &&
      toMinutes(input.endTime) > toMinutes(row.startTime),
  );
  if (coachClash) {
    return {
      field: "coachName",
      error: `${input.coachName} sudah ada sesi ${DAY_LABELS[coachClash.dayOfWeek]} ${formatClock(coachClash.startTime)} - ${formatClock(coachClash.endTime)}.`,
    };
  }

  return null;
}

export async function createScheduleSession(
  input: ScheduleInput,
): Promise<{ id: string }> {
  const inserted = await db
    .insert(courseSessions)
    .values({
      courseId: input.courseId,
      coachName: input.coachName,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      capacity: input.capacity ?? 10,
      sessionDate: null,
      isActive: true,
    })
    .returning({ id: courseSessions.id });

  return inserted[0];
}

export async function updateScheduleSession(
  id: string,
  input: ScheduleInput,
): Promise<{ id: string } | null> {
  const updated = await db
    .update(courseSessions)
    .set({
      courseId: input.courseId,
      coachName: input.coachName,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      ...(input.capacity ? { capacity: input.capacity } : {}),
    })
    .where(eq(courseSessions.id, id))
    .returning({ id: courseSessions.id });

  return updated[0] ?? null;
}

/**
 * Hapus sesi dengan menonaktifkannya, bukan delete.
 *
 * `session_attendances.session_id` menunjuk ke `course_sessions` dengan cascade,
 * jadi delete hard akan ikut menghapus riwayat kehadiran peserta. Nonaktifkan
 * membuat sesi hilang dari matriks admin dan dari query jadwal peserta
 * (`is_active = true`) tanpa merusak riwayat.
 */
export async function deactivateScheduleSession(id: string): Promise<boolean> {
  const updated = await db
    .update(courseSessions)
    .set({ isActive: false })
    .where(eq(courseSessions.id, id))
    .returning({ id: courseSessions.id });

  return updated.length > 0;
}

// ---------------------------------------------------------------------------
// Kelola pembayaran
// ---------------------------------------------------------------------------

/** Hanya empat status ini yang boleh ditulis lewat panel admin. */
const PAYMENT_STATUSES: PaymentStatus[] = [
  "unpaid",
  "verification",
  "paid",
  "rejected",
];

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as string[]).includes(value);
}

function toPaymentStatus(value: string): PaymentStatus {
  return isPaymentStatus(value) ? value : "unpaid";
}

const paymentColumns = {
  id: payments.id,
  userId: payments.userId,
  amount: payments.amount,
  status: payments.status,
  method: payments.method,
  // Yang dibutuhkan tabel admin cuma "ada atau tidak", bukan isi base64-nya.
  hasProof: sql<boolean>`${payments.proofUrl} is not null`,
  periodMonth: payments.periodMonth,
  dueDate: payments.dueDate,
  createdAt: payments.createdAt,
  paidAt: payments.paidAt,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  packageName: courses.name,
};

/**
 * Semua tagihan beserta peserta dan paketnya.
 *
 * Paket diambil lewat `enrollments` yang ditautkan di baris pembayaran, bukan
 * lewat enrollment aktif peserta: satu orang bisa punya beberapa enrollment
 * aktif, dan tagihan bulan ini harus tetap menunjukkan paket yang ditagihkan.
 */
export async function listPaymentRows(options?: {
  status?: PaymentStatus | "all";
  query?: string;
}): Promise<PaymentRow[]> {
  const conditions = [];

  if (options?.status && options.status !== "all") {
    conditions.push(eq(payments.status, options.status));
  }
  if (options?.query) {
    const pattern = `%${options.query}%`;
    conditions.push(
      or(
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(users.email, pattern),
        ilike(courses.name, pattern),
      ),
    );
  }

  const rows = await db
    .select(paymentColumns)
    .from(payments)
    .innerJoin(users, eq(payments.userId, users.id))
    .leftJoin(enrollments, eq(enrollments.id, payments.enrollmentId))
    .leftJoin(courses, eq(courses.id, enrollments.courseId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(payments.createdAt), desc(payments.periodMonth));

  return rows.map((row) => ({
    id: row.id,
    participantName: `${row.firstName} ${row.lastName}`.trim(),
    participantEmail: row.email,
    packageName: row.packageName,
    amount: toNumber(row.amount),
    status: toPaymentStatus(row.status),
    methodLabel: getPaymentMethodLabel(row.method),
    hasProof: row.hasProof,
    periodMonth: row.periodMonth.slice(0, 7),
    createdAt: row.createdAt.toISOString(),
    dueDate: row.dueDate.slice(0, 10),
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
  }));
}

/**
 * Angka untuk empat kartu ringkasan.
 *
 * "Total masuk bulan ini" dijumlahkan dari tagihan yang sudah lunas pada bulan
 * tagihan berjalan — angka yang sama dipakai kartu pendapatan di dashboard
 * admin, supaya dua tempat tidak pernah berbeda.
 */
export async function getPaymentStats(): Promise<PaymentStats> {
  const periodStart = currentMonthStart();
  const todayStart = `${todayDate()}T00:00:00+07:00`;

  const [revenueRows, pendingRows, unpaidRows, todayRows] = await Promise.all([
    db
      .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "paid"),
          eq(payments.periodMonth, periodStart),
        ),
      ),
    db
      .select({ n: count() })
      .from(payments)
      .where(eq(payments.status, "verification")),
    db
      .select({ n: count() })
      .from(payments)
      .where(eq(payments.status, "unpaid")),
    db
      .select({ n: count() })
      .from(payments)
      .where(gte(payments.createdAt, new Date(todayStart))),
  ]);

  return {
    revenueThisMonth: toNumber(revenueRows[0]?.total),
    pendingVerification: pendingRows[0]?.n ?? 0,
    unpaid: unpaidRows[0]?.n ?? 0,
    createdToday: todayRows[0]?.n ?? 0,
  };
}

export async function findPaymentById(id: string) {
  const rows = await db
    .select({
      id: payments.id,
      userId: payments.userId,
      amount: payments.amount,
      status: payments.status,
      participantName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
    })
    .from(payments)
    .innerJoin(users, eq(payments.userId, users.id))
    .where(eq(payments.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    amount: toNumber(row.amount),
    status: toPaymentStatus(row.status),
    participantName: row.participantName,
  };
}

/**
 * Ambil bukti bayar satu tagihan untuk pratinjau admin.
 *
 * Hanya `proof_url` yang dibaca, terpisah dari `listPaymentRows` yang sengaja
 * hanya mengambil flag "ada atau tidak" supaya bukti sebesar 5 MB tidak ikut
 * ter-inline ke payload halaman admin.
 */
export async function findPaymentProof(
  id: string,
): Promise<{ proofUrl: string } | null> {
  const rows = await db
    .select({ proofUrl: payments.proofUrl })
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);

  const row = rows[0];
  if (!row?.proofUrl) return null;

  return { proofUrl: row.proofUrl };
}

/**
 * Ubah status tagihan.
 *
 * `paidAt` hanya diisi saat tagihan disetujui, dan dikosongkan lagi kalau status
 * ditarik mundur, supaya kolom "lunas pada tanggal berapa" tidak pernah
 * menyesatkan. Status peserta sendiri tidak disimpan terpisah: dashboard dan
 * halaman pembayaran peserta membaca tabel `payments` yang sama, jadi approve di
 * sini langsung terlihat di sisi peserta.
 */
export async function setPaymentStatus(
  id: string,
  status: PaymentStatus,
): Promise<PaymentRow["id"] | null> {
  const updated = await db
    .update(payments)
    .set({
      status,
      paidAt: status === "paid" ? new Date() : null,
    })
    .where(eq(payments.id, id))
    .returning({ id: payments.id });

  return updated[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Laporan pendapatan dan paket
// ---------------------------------------------------------------------------

const monthKeyExpr = sql<string>`to_char(${payments.periodMonth}, 'YYYY-MM')`;

/**
 * Pendapatan bulanan dari tagihan yang sudah lunas.
 *
 * Dikelompokkan berdasarkan `period_month` (bulan tagihan), bukan `paid_at`,
 * supaya angka bulan ini sama dengan kartu "Pendapatan bulan ini" di dashboard
 * admin. Pengelompokan terjadi di database supaya tidak menarik semua tagihan
 * ke memori server.
 */
export async function getMonthlyRevenue(): Promise<
  Map<string, { total: number; paidCount: number }>
> {
  const rows = await db
    .select({
      key: monthKeyExpr,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      paidCount: count(),
    })
    .from(payments)
    .where(eq(payments.status, "paid"))
    .groupBy(monthKeyExpr)
    .orderBy(asc(monthKeyExpr));

  const result = new Map<string, { total: number; paidCount: number }>();

  for (const row of rows) {
    result.set(row.key, {
      total: toNumber(row.total),
      paidCount: row.paidCount,
    });
  }

  return result;
}

/**
 * Jumlah peserta per paket dalam satu rentang tanggal.
 *
 * Yang dihitung enrollment aktif yang tanggal daftarnya (`enrolled_at`) berada
 * di rentang itu, jadi tombol "Bulan ini / Kuartal ini / Tahun ini" benar-benar
 * mengubah isi tabel dan bukan hanya menдомbolkan angka.
 */
export async function getPackagePopularityInRange(
  start: string,
  end: string,
): Promise<{ name: string; participants: number }[]> {
  const rows = await db
    .select({ name: courses.name, participants: count() })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(
      and(
        eq(enrollments.status, "active"),
        gte(enrollments.enrolledAt, start),
        lte(enrollments.enrolledAt, end),
      ),
    )
    .groupBy(courses.name)
    .orderBy(desc(count()), asc(courses.name));

  return rows;
}

/** Total peserta aktif dan enrollment aktif, untuk catatan di bawah tabel. */
export async function getActiveEnrollmentTotals(): Promise<{
  participants: number;
  enrollments: number;
}> {
  const [enrollmentRows, participantRows] = await Promise.all([
    db
      .select({ n: count() })
      .from(enrollments)
      .where(eq(enrollments.status, "active")),
    db
      .select({ n: sql<number>`count(distinct ${enrollments.userId})::int` })
      .from(enrollments)
      .where(eq(enrollments.status, "active")),
  ]);

  return {
    participants: participantRows[0]?.n ?? 0,
    enrollments: enrollmentRows[0]?.n ?? 0,
  };
}