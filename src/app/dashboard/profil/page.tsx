import type { Metadata } from "next";
import DashboardShell from "@/components/DashboardShell";
import DashboardProfileForm from "@/components/DashboardProfileForm";
import { requireParticipant } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profil - SwimmingCourse",
  description: "Kelola informasi akun dan kata sandi peserta SwimmingCourse.",
};

export default async function DashboardProfilePage() {
  const user = await requireParticipant();

  return (
    <DashboardShell title="Profil" userName={`${user.firstName} ${user.lastName}`}>
      <DashboardProfileForm
        firstName={user.firstName}
        lastName={user.lastName}
        email={user.email}
        phone={user.phone}
      />
    </DashboardShell>
  );
}
