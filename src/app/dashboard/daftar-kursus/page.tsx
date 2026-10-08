import type { Metadata } from "next";
import DashboardShell from "@/components/DashboardShell";
import DashboardCourseCatalog from "@/components/DashboardCourseCatalog";
import { listCatalogCourses } from "@/admin/data";
import { requireParticipant } from "@/lib/session";

export const metadata: Metadata = {
  title: "Daftar Kursus - SwimmingCourse",
  description: "Pilih kelas renang yang tersedia untuk Anda.",
};

export default async function DashboardCourseCatalogPage() {
  const user = await requireParticipant();
  const courses = await listCatalogCourses();

  return (
    <DashboardShell
      title="Daftar kursus"
      userName={`${user.firstName} ${user.lastName}`}
    >
      <DashboardCourseCatalog
        userName={`${user.firstName} ${user.lastName}`}
        userEmail={user.email}
        userPhone={user.phone}
        courses={courses}
      />
    </DashboardShell>
  );
}