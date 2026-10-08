import type { Metadata } from "next";
import AdminShell from "@/admin/layout/AdminShell";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Panel Admin - SwimmingCourse",
  description: "Kelola pendaftaran, peserta, dan data operasional SwimmingCourse.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <AdminShell userName={`${user.firstName} ${user.lastName}`}>
      {children}
    </AdminShell>
  );
}