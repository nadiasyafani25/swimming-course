import type { Metadata } from "next";
import DashboardShell from "@/components/DashboardShell";
import { requireParticipant } from "@/lib/session";
import { getActiveEnrollments, getWeeklySchedule } from "@/lib/enrollment-data";
import { DAY_NAMES } from "@/lib/enrollment-types";

export const metadata: Metadata = {
  title: "Jadwal saya - SwimmingCourse",
  description: "Jadwal kelas renang Anda.",
};

export default async function DashboardSchedulePage() {
  const user = await requireParticipant();

  const enrollments = await getActiveEnrollments(user.id);
  const schedule = await getWeeklySchedule(enrollments.map((e) => e.courseId));

  return (
    <DashboardShell
      userName={`${user.firstName} ${user.lastName}`}
      title="Jadwal saya"
    >
      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <div className="overflow-x-auto rounded-[9px] border border-[#D6E5F3]">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                  Hari
                </th>
                <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                  Waktu
                </th>
                <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                  Program
                </th>
                <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                  Pelatih
                </th>
                <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {schedule.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-5 text-center text-[11px] text-[#8FA3B8]"
                  >
                    Belum ada jadwal. Anda bisa mendaftar kursus di halaman
                    &quot;Daftar kursus&quot;.
                  </td>
                </tr>
              ) : (
                schedule.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] font-medium text-[#073763]">
                      {DAY_NAMES[item.dayOfWeek] ?? "-"}
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] text-[#526B84]">
                      {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px]">
                      <span
                        className={`inline-block rounded-[5px] px-2 py-1 text-[9px] font-medium ${
                          item.courseName === "Private"
                            ? "bg-[#0D4D85] text-white"
                            : "bg-[#E5F1FC] text-[#1769AA]"
                        }`}
                      >
                        {item.courseName}
                      </span>
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] text-[#526B84]">
                      {item.coachName}
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px]">
                      <span className="inline-block rounded-full px-2.5 py-1 text-[9px] font-medium bg-[#E5F1FC] text-[#1769AA]">
                        Terjadwal
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}