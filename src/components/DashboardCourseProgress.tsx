import type { ProgressSummary } from "@/lib/enrollment-types";

type DashboardCourseProgressProps = {
  progress: ProgressSummary[];
};

export default function DashboardCourseProgress({
  progress,
}: DashboardCourseProgressProps) {
  if (progress.length === 0) {
    return (
      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5">
        <h2 className="text-[13px] font-bold text-[#073763]">Progres kursus</h2>
        <div className="mt-4 rounded-[9px] border border-dashed border-[#D6E5F3] bg-[#FAFCFF] px-4 py-6 text-center">
          <p className="text-[11px] font-medium text-[#073763]">
            Belum ada progres kursus.
          </p>
          <p className="mt-1 text-[11px] text-[#8FA3B8]">
            Daftar kursus terlebih dahulu untuk melihat progres sesi.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {progress.map((item) => (
        <section
          key={item.courseId}
          className="rounded-[10px] border border-[#D6E5F3] bg-white p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[13px] font-bold text-[#073763]">
              Progres kursus - {item.courseName}
            </h2>
            <span className="shrink-0 rounded-full bg-[#E5F1FC] px-2.5 py-1 text-[10px] font-semibold text-[#1769AA]">
              {item.totalSessions} sesi
            </span>
          </div>

          <div
            className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#E5F1FC]"
            role="progressbar"
            aria-valuenow={item.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progres ${item.courseName} ${item.percent}%`}
          >
            <div
              className="h-2 rounded-full bg-[#0D4D85]"
              style={{ width: `${item.percent}%` }}
            />
          </div>

          <p className="mt-3 text-[11px] text-[#526B84]">
            {item.attendedSessions} dari {item.totalSessions} sesi selesai
          </p>
        </section>
      ))}
    </div>
  );
}