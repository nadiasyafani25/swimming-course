import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox, Search } from "lucide-react";
import DeleteMessageButton from "@/admin/pesan/DeleteMessageButton";
import MessageReadToggle from "@/admin/pesan/MessageReadToggle";
import { listContactMessages, parseFilter, parsePage } from "@/admin/data";
import { formatDateTime } from "@/admin/time";
import type { ContactMessageFilter } from "@/admin/types";

export const metadata = {
  title: "Pesan Kontak - Panel Admin",
};

const FILTERS: { label: string; value: ContactMessageFilter }[] = [
  { label: "Semua", value: "all" },
  { label: "Belum dibaca", value: "unread" },
  { label: "Sudah dibaca", value: "read" },
];

function buildPageHref(
  page: number,
  filter: ContactMessageFilter,
  query: string,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filter !== "all") params.set("filter", filter);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/admin/pesan?${qs}` : "/admin/pesan";
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const readParam = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filter = parseFilter(readParam("filter"));
  const query = (readParam("q") ?? "").trim();
  const requestedPage = parsePage(readParam("page"));

  const result = await listContactMessages({ page: requestedPage, filter, query });

  const pageLink = (target: number) => buildPageHref(target, filter, query);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-[#073763]">Pesan kontak</h2>
          <p className="mt-1 text-[12px] text-[#526B84]">
            {result.total} pesan
            {query && (
              <>
                {" "}memuat &ldquo;{query}&rdquo;
              </>
            )}
            {filter === "unread" && " · belum dibaca saja"}
            {filter === "read" && " · sudah dibaca saja"}
          </p>
        </div>

        <form method="get" action="/admin/pesan" className="flex items-end gap-2">
          {filter !== "all" && (
            <input type="hidden" name="filter" value={filter} />
          )}
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold text-[#526B84]">
              Cari
            </span>
            <span className="flex items-center">
              <Search className="pointer-events-none absolute h-3.5 w-3.5 text-[#8FA3B8]" />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Nama, email, isi pesan"
                className="h-[34px] w-[220px] rounded-md border border-[#D6E5F3] bg-white pl-8 pr-3 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#2F8FE5]"
              />
            </span>
          </label>
          <button
            type="submit"
            className="h-[34px] rounded-md bg-[#0D4D85] px-4 text-[11px] font-semibold text-white transition-colors hover:bg-[#0a3f6d]"
          >
            Terapkan
          </button>
        </form>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((item) => {
          const isActive = result.filter === item.value;
          return (
            <Link
              key={item.value}
              href={buildPageHref(1, item.value, query)}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                isActive
                  ? "bg-[#0D4D85] text-white"
                  : "border border-[#D6E5F3] bg-white text-[#526B84] hover:border-[#368DDF] hover:text-[#073763]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[#D6E5F3] bg-white shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        {result.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
            <Inbox className="h-7 w-7 text-[#C3D2E0]" />
            <p className="text-[12px] font-semibold text-[#526B84]">
              {query ? "Tidak ada pesan yang cocok" : "Belum ada pesan"}
            </p>
            <p className="text-[11px] text-[#8FA3B8]">
              {query
                ? "Coba kata kunci lain atau hapus filter."
                : "Pesan dari form kontak akan muncul di sini."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E8F0F8]">
            {result.rows.map((row) => (
              <li
                key={row.id}
                className={`flex items-start gap-4 px-4 py-4 ${
                  row.isRead ? "bg-white" : "bg-[#F7FBFF]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    row.isRead ? "bg-transparent" : "bg-[#368DDF]"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="text-[12px] font-bold text-[#073763]">
                      {row.name}
                    </p>
                    <a
                      href={`mailto:${row.email}`}
                      className="text-[11px] text-[#1769AA] hover:underline"
                    >
                      {row.email}
                    </a>
                    <span className="text-[10px] text-[#8FA3B8]">
                      {formatDateTime(row.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[11px] leading-[1.7] text-[#526B84]">
                    {row.message}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <MessageReadToggle id={row.id} isRead={row.isRead} />
                  <DeleteMessageButton id={row.id} name={row.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {result.totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#526B84]">
            Halaman {result.page} dari {result.totalPages}
          </p>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link
                href={pageLink(result.page - 1)}
                className="flex h-[30px] items-center gap-1 rounded-md border border-[#D6E5F3] bg-white px-3 text-[11px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Sebelumnya
              </Link>
            ) : (
              <span className="flex h-[30px] items-center gap-1 rounded-md border border-[#E8F0F8] bg-[#F8FBFE] px-3 text-[11px] font-semibold text-[#C3D2E0]">
                <ChevronLeft className="h-3.5 w-3.5" />
                Sebelumnya
              </span>
            )}

            {result.page < result.totalPages ? (
              <Link
                href={pageLink(result.page + 1)}
                className="flex h-[30px] items-center gap-1 rounded-md border border-[#D6E5F3] bg-white px-3 text-[11px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763]"
              >
                Berikutnya
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="flex h-[30px] items-center gap-1 rounded-md border border-[#E8F0F8] bg-[#F8FBFE] px-3 text-[11px] font-semibold text-[#C3D2E0]">
                Berikutnya
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </nav>
      )}
    </>
  );
}