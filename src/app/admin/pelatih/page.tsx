import type { Metadata } from "next";
import CoachList from "@/admin/pelatih/CoachList";
import { listCoaches } from "@/admin/data";

export const metadata: Metadata = {
  title: "Data Pelatih - Panel Admin",
  description: "Kelola data pelatih SwimmingCourse.",
};

export default async function AdminCoachesPage() {
  const coaches = await listCoaches();

  return (
    <>
      <div>
        <h2 className="text-[16px] font-bold text-[#073763]">Data pelatih</h2>
        <p className="mt-1 text-[12px] text-[#526B84]">
          Pelatih yang mengajar di SwimmingCourse, dipakai juga sebagai penugasan
          di paket kursus dan jadwal.
        </p>
      </div>

      <CoachList coaches={coaches} />
    </>
  );
}