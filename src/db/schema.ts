import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const USER_ROLES = ["peserta", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Status kemampuan parceiros yang sudah dievaluasi pelatih.
 *
 * Disimpan terpisah dari tabel `certificates` karena status kemampuan masih
 * bisa diubah admin tanpa menerbitkan sertifikat, dan sebaliknya sertifikat
 * bisa diperbarui tanpa mengubah status ability.
 */
export const SWIM_STATUSES = ["belum_dievaluasi", "bisa_berenang"] as const;
export type SwimStatus = (typeof SWIM_STATUSES)[number];

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("contact_messages_created_at_idx").on(table.createdAt),
    index("contact_messages_is_read_idx").on(table.isRead),
  ],
);

export const registrations = pgTable("registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  program: varchar("program", { length: 100 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 })
      .notNull()
      .default("peserta"),
    swimStatus: varchar("swim_status", { length: 20 })
      .notNull()
      .default("belum_dievaluasi"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_role_is_active_idx").on(table.role, table.isActive),
    check("users_role_check", sql`${table.role} in ('peserta', 'admin')`),
    check(
      "users_swim_status_check",
      sql`${table.swimStatus} in ('belum_dievaluasi', 'bisa_berenang')`,
    ),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("sessions_token_unique").on(table.token)],
);

export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseName: varchar("course_name", { length: 150 }).notNull(),
    issueDate: timestamp("issue_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    fileUrl: text("file_url").notNull(),
    issuedBy: varchar("issued_by", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("certificates_user_course_unique").on(table.userId, table.courseName)],
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    description: text("description"),
    priceMonthly: numeric("price_monthly", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    durationSessions: integer("duration_sessions").notNull().default(8),
    coachName: varchar("coach_name", { length: 100 }),
    capacityLabel: varchar("capacity_label", { length: 100 }),
    priceLabel: varchar("price_label", { length: 100 }),
    priceUnit: varchar("price_unit", { length: 60 }),
    ageGroups: varchar("age_groups", { length: 100 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("courses_slug_unique").on(table.slug)],
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    enrolledAt: date("enrolled_at").notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("enrollments_user_course_unique").on(table.userId, table.courseId),
  ],
);

export const courseSessions = pgTable(
  "course_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    coachName: varchar("coach_name", { length: 100 }),
    dayOfWeek: integer("day_of_week").notNull(),
    sessionDate: date("session_date"),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    capacity: integer("capacity").notNull().default(10),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("course_sessions_course_date_unique").on(table.courseId, table.sessionDate)],
);

export const sessionAttendances = pgTable(
  "session_attendances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => courseSessions.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("hadir"),
    attendedAt: timestamp("attended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("session_attendances_enrollment_session_unique").on(
      table.enrollmentId,
      table.sessionId,
    ),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id").references(() => enrollments.id, {
      onDelete: "cascade",
    }),
    periodMonth: date("period_month").notNull(),
    dueDate: date("due_date").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
    status: varchar("status", { length: 20 }).notNull().default("unpaid"),
    /**
     * Metode yang dipakai peserta: `qris` atau `bank_transfer`.
     *
     * Kolom ini diisi bersama bukti di `proof_url`, jadi nilainya baru berarti
     * setelah bukti dikirim. Default `qris` dipakai untuk tagihan lama yang
     * dibuat sebelum metode pembayaran lain tersedia.
     */
    method: varchar("method", { length: 20 }).notNull().default("qris"),
    proofUrl: text("proof_url"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("payments_user_period_unique").on(table.userId, table.periodMonth),
  ],
);

export const coaches = pgTable(
  "coaches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 255 }),
    certification: varchar("certification", { length: 150 }),
    background: text("background"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("coaches_name_unique").on(table.name),
    index("coaches_is_active_idx").on(table.isActive),
  ],
);

/**
 * Konfigurasi situs yang diubah admin dari halaman Pengaturan.
 *
 * Disimpan sebagai key-value, bukan kolom di tabel lain, supaya menambah
 * pengaturan baru tidak butuh migrasi baru. Nilai yang belum pernah disimpan
 * memakai default dari `src/lib/settings.ts`.
 */
export const settings = pgTable("settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type CourseSession = typeof courseSessions.$inferSelect;
export type NewCourseSession = typeof courseSessions.$inferInsert;
export type SessionAttendance = typeof sessionAttendances.$inferSelect;
export type NewSessionAttendance = typeof sessionAttendances.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Coach = typeof coaches.$inferSelect;
export type NewCoach = typeof coaches.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;