"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2, UserRoundX } from "lucide-react";
import ArchiveParticipantModal from "@/admin/peserta/ArchiveParticipantModal";
import ParticipantFormModal from "@/admin/peserta/ParticipantFormModal";
import type { ParticipantRow, ParticipantStatus } from "@/admin/types";

const STATUS_STYLES: Record<
  ParticipantStatus,
  { label: string; className: string }
> = {
  aktif: { label: "Aktif", className: "bg-[#DFF7EC] text-[#1F9C63]" },
  menunggu: { label: "Menunggu", className: "bg-[#FFF2E1] text-[#B56A00]" },
  nonaktif: { label: "Nonaktif", className: "bg-[#FDEBEB] text-[#A32020]" },
};

type ParticipantListProps = {
  participants: ParticipantRow[];
};

export default function ParticipantList({ participants }: ParticipantListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ParticipantRow | null>(null);
  const [archiving, setArchiving] = useState<ParticipantRow | null>(null);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return participants;

    return participants.filter((row) => {
      const name = `${row.firstName} ${row.lastName}`.toLowerCase();
      return name.includes(keyword) || row.email.toLowerCase().includes(keyword);
    });
  }, [participants, query]);

  const afterChange = () => {
    setFormMode(null);
    setEditing(null);
    router.refresh();
  };

  const isEmptyAll = participants.length === 0;
  const isEmptySearch = !isEmptyAll && filtered.length === 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-[300px]">
          <span className="sr-only">Cari peserta</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9BACB]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama peserta..."
            className="h-[38px] w-full rounded-lg border border-[#D6E5F3] bg-white pl-9 pr-3 text-[12px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5]"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormMode("create");
          }}
          className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-[#0A3966] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#0A2540]"
        >
          <Plus className="h-4 w-4" />
          Tambah peserta
        </button>
      </div>

      <p className="text-[11px] text-[#8FA3B8]">
        {isEmptyAll
          ? "Belum ada peserta terdaftar."
          : query
            ? `${filtered.length} dari ${participants.length} peserta cocok.`
            : `${participants.length} peserta terdaftar.`}
      </p>

      <section className="overflow-hidden rounded-xl border border-[#D6E5F3] bg-white shadow-[0_1px_3px_rgba(10,37,64,0.06)]">
        {isEmptyAll || isEmptySearch ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F7FF]">
              <UserRoundX className="h-5 w-5 text-[#BBD4EC]" />
            </span>
            <p className="text-[12px] font-semibold text-[#526B84]">
              {isEmptyAll ? "Belum ada data peserta" : "Peserta tidak ditemukan"}
            </p>
            <p className="max-w-[300px] text-[11px] leading-[1.7] text-[#8FA3B8]">
              {isEmptyAll
                ? "Peserta yang mendaftar sendiri lewat form situs akan muncul di sini, atau tambahkan manual."
                : `Tidak ada peserta yang cocok dengan "${query}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  {["Nama", "Email", "Paket", "Status", "Aksi"].map((head) => (
                    <th
                      key={head}
                      scope="col"
                      className="border-b border-[#E8F0F8] bg-[#F8FBFE] px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.06em] text-[#073763]"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const status = STATUS_STYLES[row.status];

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-[#FAFCFF] ${
                        row.isActive ? "" : "bg-[#FCFCFD]"
                      }`}
                    >
                      <td className="border-b border-[#F0F5FA] px-5 py-3">
                        <p
                          className={`text-[12px] font-semibold ${
                            row.isActive
                              ? "text-[#073763]"
                              : "text-[#8FA3B8] line-through"
                          }`}
                        >
                          {row.firstName} {row.lastName}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#A9BACB]">
                          {row.phone || "-"}
                        </p>
                      </td>
                      <td className="border-b border-[#F0F5FA] px-5 py-3 text-[11px] text-[#526B84]">
                        {row.email}
                      </td>
                      <td className="border-b border-[#F0F5FA] px-5 py-3 text-[11px] text-[#526B84]">
                        {row.packageName ?? (
                          <span className="text-[#A9BACB]">Belum mendaftar</span>
                        )}
                      </td>
                      <td className="border-b border-[#F0F5FA] px-5 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="border-b border-[#F0F5FA] px-5 py-3">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(row);
                              setFormMode("edit");
                            }}
                            aria-label={`Ubah data ${row.firstName} ${row.lastName}`}
                            title="Ubah data"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6E5F3] bg-[#EAF4FD] text-[#1769AA] transition-colors hover:border-[#368DDF] hover:bg-[#E5F1FC]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiving(row)}
                            aria-label={`${row.isActive ? "Nonaktifkan" : "Aktifkan"} ${row.firstName} ${row.lastName}`}
                            title={
                              row.isActive ? "Nonaktifkan peserta" : "Aktifkan kembali"
                            }
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                              row.isActive
                                ? "border-[#F0D5D5] bg-[#FDF2F2] text-red-500 hover:border-red-300 hover:bg-red-50"
                                : "border-[#D5EEE2] bg-[#EFFAF4] text-[#1F9C63] hover:border-[#7FCBA5]"
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formMode && (
        <ParticipantFormModal
          mode={formMode}
          participant={editing}
          onClose={() => {
            setFormMode(null);
            setEditing(null);
          }}
          onSaved={afterChange}
        />
      )}

      {archiving && (
        <ArchiveParticipantModal
          participant={archiving}
          onClose={() => setArchiving(null)}
          onDone={() => setArchiving(null)}
        />
      )}
    </>
  );
}