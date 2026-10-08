import AdminStatCard from "@/admin/dashboard/AdminStatCard";
import RecentRegistrationsTable from "@/admin/dashboard/RecentRegistrationsTable";
import {
  countActiveCoaches,
  countNewParticipantsThisMonth,
  countRecentRegistrations,
  countUncertifiedCoaches,
  countUsers,
  countNotStartedToday,
  getRevenuePreviousMonth,
  getRevenueThisMonth,
  getTodaySessions,
  listRecentRegistrations,
  RECENT_REGISTRATIONS_LIMIT,
} from "@/admin/data";
import { formatRupiah } from "@/admin/time";
import type { AdminStatCardData } from "@/admin/types";

function buildGrowthHint(current: number, previous: number): string {
  if (previous === 0) {
    return current === 0 ? "Belum ada pendapatan" : "Bulan lalu tidak ada data";
  }

  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return "Sama seperti bulan lalu";

  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent}% dari bulan lalu`;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawPeriod = Array.isArray(params.periode)
    ? params.periode[0]
    : params.periode;
  const todayOnly = rawPeriod === "hari-ini";

  const [
    totalPeserta,
    pesertaBaru,
    pelatihAktif,
    pelatihBelumBersertifikat,
    todaySessions,
    revenueThisMonth,
    revenuePreviousMonth,
    rows,
    todayCount,
  ] = await Promise.all([
    countUsers("peserta"),
    countNewParticipantsThisMonth(),
    countActiveCoaches(),
    countUncertifiedCoaches(),
    getTodaySessions(),
    getRevenueThisMonth(),
    getRevenuePreviousMonth(),
    listRecentRegistrations({ todayOnly }),
    countRecentRegistrations(todayOnly),
  ]);

  const belumMulai = countNotStartedToday(todaySessions);

  const stats: AdminStatCardData[] = [
    {
      label: "Total peserta",
      value: String(totalPeserta),
      hint: `+${pesertaBaru} bulan ini`,
      tone: "navy",
    },
    {
      label: "Pelatih aktif",
      value: String(pelatihAktif),
      hint:
        pelatihBelumBersertifikat === 0
          ? "Semua bersertifikat"
          : `${pelatihBelumBersertifikat} belum bersertifikat`,
      tone: "blue",
    },
    {
      label: "Kelas hari ini",
      value: String(todaySessions.length),
      hint: `${belumMulai} sesi belum dimulai`,
      tone: "green",
    },
    {
      label: "Pendapatan bulan ini",
      value: formatRupiah(revenueThisMonth),
      hint: buildGrowthHint(revenueThisMonth, revenuePreviousMonth),
      tone: "amber",
    },
  ];

  return (
    <>
      <div>
        <h2 className="text-[16px] font-bold text-[#073763]">Ringkasan</h2>
        <p className="mt-1 text-[12px] text-[#526B84]">
          Pantau peserta, pelatih, kelas, dan pendapatan SwimmingCourse.
        </p>
      </div>

      <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <RecentRegistrationsTable
        rows={rows}
        todayOnly={todayOnly}
        todayCount={todayCount}
        limit={RECENT_REGISTRATIONS_LIMIT}
      />
    </>
  );
}