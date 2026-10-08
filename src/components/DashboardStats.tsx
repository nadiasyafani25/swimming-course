import type {
  CourseSummary,
  PaymentSummary,
  ProgressSummary,
} from "@/lib/enrollment-types";

type DashboardStatsProps = {
  enrollments: CourseSummary[];
  sessionsThisWeek: number;
  progress: ProgressSummary[];
  upcomingPayment: PaymentSummary | null;
  hasPaid: boolean;
};

export default function DashboardStats({
  enrollments,
  sessionsThisWeek,
  progress,
  upcomingPayment,
  hasPaid,
}: DashboardStatsProps) {
  const attended = progress.reduce((sum, p) => sum + p.attendedSessions, 0);
  const total = progress.reduce((sum, p) => sum + p.totalSessions, 0);
  const percent =
    total > 0 ? Math.round((attended / total) * 100) : 0;

  const stats = [
    {
      label: "Kursus aktif",
      value: String(enrollments.length),
      note:
        enrollments.length > 0
          ? enrollments.map((e) => e.name).join(", ")
          : "Belum ada pendaftaran",
    },
    {
      label: "Sesi minggu ini",
      value: String(sessionsThisWeek),
      note:
        sessionsThisWeek > 0
          ? "Sesi terjadwal"
          : enrollments.length > 0
            ? "Belum ada sesi terjadwal"
            : "Belum ada pendaftaran",
    },
    {
      label: "Progres kursus",
      value: `${percent}%`,
      note: `${attended} dari ${total} sesi`,
    },
    {
      label: "Status pembayaran",
      value: upcomingPayment
        ? "Menunggu"
        : hasPaid
          ? "Lunas"
          : enrollments.length > 0
            ? "Belum ada tagihan"
            : "Belum ada pendaftaran",
      note: upcomingPayment
        ? `Jatuh tempo ${upcomingPayment.dueDate}`
        : hasPaid
          ? "Semua tagihan sudah dibayar"
          : enrollments.length > 0
            ? "Hubungi admin untuk info tagihan"
            : "Daftar kursus dulu",
      highlight: !upcomingPayment && hasPaid,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[10px] border border-[#D6E5F3] bg-white p-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8FA3B8]">
            {stat.label}
          </p>
          <p
            className={`mt-2 text-[22px] font-bold leading-tight ${
              stat.highlight ? "text-green-600" : "text-[#073763]"
            }`}
          >
            {stat.value}
          </p>
          <p className="mt-1 text-[11px] text-[#526B84]">{stat.note}</p>
        </div>
      ))}
    </div>
  );
}