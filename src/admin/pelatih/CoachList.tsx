"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2, UserRoundX } from "lucide-react";
import ArchiveConfirmModal from "@/admin/shared/ArchiveConfirmModal";
import CoachFormModal from "@/admin/pelatih/CoachFormModal";
import type { CoachRow } from "@/admin/types";

const LICENSE_STYLES = {
  licensed: {
    label: "Bersertifikat",
    className: "bg-[#DFF7EC] text-[#1F9C63]",
  },
  unlicensed: {
    label: "Belum ada lisensi",
    className: "bg-[#F1F5F9] text-[#7B8FA4]",
  },
} as const;

const STATUS_STYLES = {
  aktif: { label: "Aktif", className: "bg-[#DFF7EC] text-[#1F9C63]" },
  nonaktif: { label: "Nonaktif", className: "bg-[#FDEBEB] text-[#A32020]" },
} as const;

type CoachListProps = {
  coaches: CoachRow[];
};

export default function CoachList({ coaches }: CoachListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<CoachRow | null>(null);
  const [archiving, setArchiving] = useState<CoachRow | null>(null);

  const keyword = query.trim().toLowerCase();

  const filtered = keyword
    ? coaches.filter((row) => {
        const haystack = [
          row.name,
          row.certification ?? "",
          row.background ?? "",
          row.phone,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(keyword);
      })
    : coaches;

  const closeForm = () => {
    setFormMode(null);
    setEditing(null);
  };

  const afterChange = () => {
    closeForm();
    router.refresh();
  };

  const toggleActive = async () => {
    if (!archiving) return { ok: false, error: "Peserta tidak dipilih." };

    try {
      const res = await fetch(`/api/admin/coaches/${archiving.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !archiving.isActive }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        return {
          ok: false,
          error: data?.error ?? "Gagal mengubah status pelatih.",
        };
      }

      setArchiving(null);
      router.refresh();
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  };

  const isEmptyAll = coaches.length === 0;
  const isEmptySearch = !isEmptyAll && filtered.length === 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-[300px]">
          <span className="sr-only">Cari pelatih</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9BACB]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama pelatih..."
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
          Tambah pelatih
        </button>
      </div>

      <p className="text-[11px] text-[#8FA3B8]">
        {isEmptyAll
          ? "Belum ada pelatih terdaftar."
          : keyword
            ? `${filtered.length} dari ${coaches.length} pelatih cocok.`
            : `${coaches.length} pelatih terdaftar.`}
      </p>

      <section className="overflow-hidden rounded-xl border border-[#D6E5F3] bg-white shadow-[0_1px_3px_rgba(10,37,64,0.06)]">
        {isEmptyAll || isEmptySearch ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F7FF]">
              <UserRoundX className="h-5 w-5 text-[#BBD4EC]" />
            </span>
            <p className="text-[12px] font-semibold text-[#526B84]">
              {isEmptyAll ? "Belum ada data pelatih" : "Pelatih tidak ditemukan"}
            </p>
            <p className="max-w-[300px] text-[11px] leading-[1.7] text-[#8FA3B8]">
              {isEmptyAll
                ? "Tambahkan pelatih pertama supaya bisa dipakai pada paket kursus dan jadwal."
                : `Tidak ada pelatih yang cocok dengan "${query}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse">
              <thead>
                <tr>
                  {[
                    "Nama",
                    "Status lisensi",
                    "Latar belakang",
                    "No. telepon",
                    "Status",
                    "Aksi",
                  ].map((head) => (
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
                  const license = row.certification
                    ? LICENSE_STYLES.licensed
                    : LICENSE_STYLES.unlicensed;
                  const status = row.isActive
                    ? STATUS_STYLES.aktif
                    : STATUS_STYLES.nonaktif;

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
                          {row.name}
                        </p>
                        {row.courseCount > 0 && (
                          <p className="mt-0.5 text-[10px] text-[#A9BACB]">
                            {row.courseCount} paket kursus
                          </p>
                        )}
                      </td>
                      <td className="border-b border-[#F0F5FA] px-5 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${license.className}`}
                          title={row.certification ?? undefined}
                        >
                          {license.label}
                        </span>
                      </td>
                      <td className="border-b border-[#F0F5FA] px-5 py-3 text-[11px] leading-[1.6] text-[#526B84]">
                        {row.background ?? (
                          <span className="text-[#A9BACB]">-</span>
                        )}
                      </td>
                      <td className="border-b border-[#F0F5FA] px-5 py-3 text-[11px] text-[#526B84]">
                        {row.phone || (
                          <span className="text-[#A9BACB]">-</span>
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
                            aria-label={`Ubah data ${row.name}`}
                            title="Ubah data"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6E5F3] bg-[#EAF4FD] text-[#1769AA] transition-colors hover:border-[#368DDF] hover:bg-[#E5F1FC]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiving(row)}
                            aria-label={`${row.isActive ? "Nonaktifkan" : "Aktifkan"} ${row.name}`}
                            title={
                              row.isActive
                                ? "Nonaktifkan pelatih"
                                : "Aktifkan kembali"
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
        <CoachFormModal
          mode={formMode}
          coach={editing}
          onClose={closeForm}
          onSaved={afterChange}
        />
      )}

      {archiving && (
        <ArchiveConfirmModal
          subject={archiving.name}
          isActive={archiving.isActive}
          noun="pelatih"
          body={
            archiving.isActive
              ? archiving.courseCount > 0
                ? `tidak akan dipakai lagi. ${archiving.courseCount} paket kursus masih menunjuk ke nama ini dan tetap tampil di halaman publik.`
                : "tidak akan dipakai lagi. Datanya tetap disimpan dan bisa diaktifkan kembali."
              : "akan dipakai lagi seperti semula."
          }
          onClose={() => setArchiving(null)}
          onConfirm={toggleActive}
        />
      )}
    </>
  );
}