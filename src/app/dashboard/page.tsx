import type { Metadata } from "next";
import DashboardShell from "@/components/DashboardShell";
import { requireParticipant } from "@/lib/session";
import {
  getActiveEnrollments,
  getNextSessions,
  getPayments,
  getProgress,
  countSessionsThisWeek,
} from "@/lib/enrollment-data";

export const metadata: Metadata = {
  title: "Dashboard - SwimmingCourse",
  description:
    "Ringkasan kursus, jadwal, dan pembayaran peserta SwimmingCourse.",
};

export default async function DashboardPage() {
  const user = await requireParticipant();

  const enrollments = await getActiveEnrollments(user.id);
  const courseIds = enrollments.map((e) => e.courseId);

  const [progress, nextSessions, paymentHistory] = await Promise.all([
    getProgress(user.id),
    getNextSessions(courseIds),
    getPayments(user.id),
  ]);

  const sessionsThisWeek = await countSessionsThisWeek(courseIds);

  const upcomingPayment =
    paymentHistory.find((p) => p.status !== "paid") ?? null;
  const hasPaid = paymentHistory.some((p) => p.status === "paid");

  return (
    <DashboardShell
      userName={`${user.firstName} ${user.lastName}`}
      enrollments={enrollments}
      progress={progress}
      nextSessions={nextSessions}
      sessionsThisWeek={sessionsThisWeek}
      upcomingPayment={upcomingPayment}
      hasPaid={hasPaid}
    />
  );
}