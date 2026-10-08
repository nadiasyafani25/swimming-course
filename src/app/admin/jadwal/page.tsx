import type { Metadata } from "next";
import ScheduleMatrix from "@/admin/jadwal/ScheduleMatrix";
import ParticipantSchedulePreview from "@/admin/jadwal/ParticipantSchedulePreview";
import {
  listActiveCoachNames,
  listActivePackageOptions,
  listParticipantScheduleRows,
  listScheduleRows,
} from "@/admin/data";
import { dayOfWeek, minutesOfDay } from "@/admin/time";

export const metadata: Metadata = {
  title: "Kelola Jadwal - Panel Admin",
  description: "Kelola jadwal mingguan kelas SwimmingCourse.",
};

export default async function AdminSchedulePage() {
  const [sessions, packages, coachNames, participants] = await Promise.all([
    listScheduleRows(),
    listActivePackageOptions(),
    listActiveCoachNames(),
    listParticipantScheduleRows(),
  ]);

  const todayDow = dayOfWeek();
  const nowMinutes = minutesOfDay();

  return (
    <>
      <div>
        <h2 className="text-[16px] font-bold text-[#073763]">Kelola jadwal</h2>
        <p className="mt-1 text-[12px] text-[#526B84]">
          Satu sumber tunggal untuk jadwal mingguan. Setiap sesi yang ditambah,
          diubah, atau dihapus di sini langsung tampil di “Jadwal saya” dan
          “Sesi berikutnya” peserta yang terdaftar pada paket tersebut.
        </p>
      </div>

      <ScheduleMatrix
        sessions={sessions}
        packages={packages}
        coachNames={coachNames}
        todayDow={todayDow}
      />

      <ParticipantSchedulePreview
        participants={participants}
        sessions={sessions}
        todayDow={todayDow}
        nowMinutes={nowMinutes}
      />
    </>
  );
}