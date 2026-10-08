import Link from "next/link";
import { CalendarPlus, UserRoundPlus } from "lucide-react";
import { formatDate } from "../time";
import type { RecentRegistrationRow } from "../types";

const STATUS_STYLES: Record<
  RecentRegistrationRow["status"],
  { label: string; className: string }
> = {
  lunas: {
    label: "Lunas",
    className: "bg-[#DFF7EC] text-[#1F9C63]",
  },
  menunggu: {
    label: "Menunggu",
    className: "bg-[#FFF2E1] text-[#B56A00]",
  },
};

type RecentRegistrationsTableProps = {
  rows: RecentRegistrationRow[];
  todayOnly: boolean;
  todayCount: number;
  limit: number;
};

export default function RecentRegistrationsTable({
  rows,
  todayOnly,
  todayCount,
  limit,
}: RecentRegistrationsTableProps) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[#D6E5F3] bg-white shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
      <header className="flex items-center justify-between gap-3 border-b border-[#E8F0F8] px-5 py-4">
        <div>
          <h2 className="text-[13px] font-bold text-[#073763]">
            Pendaftaran terbaru
          </h2>
          <p className="mt-0.5 text-[11px] text-[#8FA3B8]">
            {todayOnly
              ? `${todayCount} pendaftaran hari ini`
              : `${limit} pendaftaran terakhir dari form situs`}
          </p>
        </div>

        <Link
          href={todayOnly ? "/admin" : "/admin?periode=hari-ini"}
          aria-pressed={todayOnly}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold transition-colors ${
            todayOnly
              ? "bg-[#0D4D85] text-white"
              : "border border-[#D6E5F3] bg-white text-[#526B84] hover:border-[#368DDF] hover:text-[#073763]"
          }`}
        >
          <CalendarPlus className="h-3 w-3" />
          Hari ini
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F7FF]">
            <UserRoundPlus className="h-5 w-5 text-[#BBD4EC]" />
          </span>
          <p className="text-[12px] font-semibold text-[#526B84]">
            Belum ada pendaftaran
          </p>
          <p className="max-w-[280px] text-[11px] leading-[1.7] text-[#8FA3B8]">
            Pendaftaran yang dikirim lewat form di halaman publik akan muncul di
            sini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                {["Nama", "Paket", "Tanggal daftar", "Status"].map((head) => (
                  <th
                    key={head}
                    scope="col"
                    className="border-b border-[#E8F0F8] bg-[#F8FBFE] px-5 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.08em] text-[#073763]"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = STATUS_STYLES[row.status];

                return (
                  <tr key={row.id} className="transition-colors hover:bg-[#FAFCFF]">
                    <td className="border-b border-[#F0F5FA] px-5 py-3 text-[12px] font-semibold text-[#073763]">
                      {row.name}
                    </td>
                    <td className="border-b border-[#F0F5FA] px-5 py-3 text-[11px] text-[#526B84]">
                      {row.program}
                    </td>
                    <td className="border-b border-[#F0F5FA] px-5 py-3 text-[11px] text-[#526B84]">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="border-b border-[#F0F5FA] px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[9px] font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}