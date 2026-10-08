import { DAY_NAMES, type NextScheduleItem } from "@/lib/enrollment-types";

type DashboardNextScheduleProps = {
  nextSessions: NextScheduleItem[];
};

function relativeLabel(dayOffset: number) {
  if (dayOffset === 0) return "Hari ini";
  if (dayOffset === 1) return "Besok";
  return `${dayOffset} hari lagi`;
}

/**
 * Kartu "Sesi berikutnya" di dashboard peserta.
 *
 * Daftar diurutkan dari sesi terdekat, dihitung server dari jadwal mingguan
 * milik peserta. Setiap perubahan dari panel admin langsung terlihat di sini
 * karena keduanya membaca tabel `course_sessions` yang sama.
 */
export default function DashboardNextSchedule({
  nextSessions,
}: DashboardNextScheduleProps) {
  return (
    <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5">
      <h2 className="text-[13px] font-bold text-[#073763]">
        Jadwal berikutnya
      </h2>

      <div className="mt-4 flex flex-col gap-2.5">
        {nextSessions.length === 0 ? (
          <p className="rounded-[9px] border border-dashed border-[#D6E5F3] px-4 py-6 text-center text-[11px] text-[#8FA3B8]">
            Belum ada jadwal berikutnya. Anda bisa mendaftar kursus di halaman
            &quot;Daftar kursus&quot;.
          </p>
        ) : (
          nextSessions.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-[9px] border border-[#D6E5F3] px-3 py-2.5"
            >
              <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[#0A2540] text-white">
                <span className="text-[9px] uppercase leading-none">
                  {DAY_NAMES[item.dayOfWeek]?.slice(0, 3)}
                </span>
                <span className="text-[11px] font-bold leading-tight">
                  {item.startTime.slice(0, 5)}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-[#073763]">
                  {item.courseName} - {item.coachName}
                </span>
                <span className="block text-[10px] text-[#8FA3B8]">
                  {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)} WIB
                </span>
              </span>

              <span className="shrink-0 rounded-full bg-[#E5F1FC] px-2.5 py-1 text-[9px] font-medium text-[#1769AA]">
                {relativeLabel(item.dayOffset)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}