import type { Metadata } from "next";
import ParticipantList from "@/admin/peserta/ParticipantList";
import { listParticipants } from "@/admin/data";

export const metadata: Metadata = {
  title: "Data Peserta - Panel Admin",
  description: "Kelola data peserta SwimmingCourse.",
};

export default async function AdminParticipantsPage() {
  const participants = await listParticipants();

  return (
    <>
      <div>
        <h2 className="text-[16px] font-bold text-[#073763]">Data peserta</h2>
        <p className="mt-1 text-[12px] text-[#526B84]">
          Peserta yang mendaftar lewat form situs, ditambah peserta yang kamu
          tambahkan sendiri.
        </p>
      </div>

      <ParticipantList participants={participants} />
    </>
  );
}