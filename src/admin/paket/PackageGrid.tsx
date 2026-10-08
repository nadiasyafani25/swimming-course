"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import ArchiveConfirmModal from "@/admin/shared/ArchiveConfirmModal";
import PackageFormModal from "@/admin/paket/PackageFormModal";
import type { CoursePackageRow } from "@/admin/types";

type PackageGridProps = {
  packages: CoursePackageRow[];
  coachNames: string[];
};

export default function PackageGrid({ packages, coachNames }: PackageGridProps) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<CoursePackageRow | null>(null);
  const [archiving, setArchiving] = useState<CoursePackageRow | null>(null);

  const closeForm = () => {
    setFormMode(null);
    setEditing(null);
  };

  const toggleActive = async () => {
    if (!archiving) return { ok: false, error: "Paket tidak dipilih." };

    try {
      const res = await fetch(`/api/admin/packages/${archiving.id}`, {
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
          error: data?.error ?? "Gagal mengubah status paket.",
        };
      }

      setArchiving(null);
      router.refresh();
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormMode("create");
          }}
          className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-[#0A3966] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#0A2540]"
        >
          <Plus className="h-4 w-4" />
          Tambah paket
        </button>
      </div>

      <p className="text-[11px] text-[#8FA3B8]">
        {packages.length === 0
          ? "Belum ada paket kursus."
          : `${packages.filter((p) => p.isActive).length} aktif dari ${packages.length} paket.`}
      </p>

      {packages.length === 0 ? (
        <section className="rounded-xl border border-dashed border-[#D6E5F3] bg-white px-6 py-16 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F7FF]">
            <Users className="h-5 w-5 text-[#BBD4EC]" />
          </span>
          <p className="mt-3 text-[13px] font-bold text-[#526B84]">
            Belum ada paket kursus
          </p>
          <p className="mx-auto mt-1.5 max-w-[340px] text-[11px] leading-[1.7] text-[#8FA3B8]">
            Klik tombol &quot;+ Tambah paket&quot; untuk membuat paket baru. Paket
            yang dibuat akan langsung muncul di katalog kursus peserta.
          </p>
        </section>
      ) : (
        <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((item) => (
            <article
              key={item.id}
              className={`flex flex-col rounded-xl border border-[#D6E5F3] bg-white p-4 shadow-[0_1px_3px_rgba(10,37,64,0.06)] ${
                item.isActive ? "" : "bg-[#FCFCFD]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-[#E5F1FC] px-2.5 py-1 text-[10px] font-semibold text-[#1769AA]">
                  {item.capacityLabel}
                </span>
                {!item.isActive && (
                  <span className="rounded-full bg-[#FDEBEB] px-2.5 py-1 text-[9px] font-semibold text-[#A32020]">
                    Nonaktif
                  </span>
                )}
              </div>

              <h2
                className={`mt-2.5 text-[15px] font-bold ${
                  item.isActive ? "text-[#073763]" : "text-[#8FA3B8] line-through"
                }`}
              >
                {item.name}
              </h2>

              <div className="mt-2.5">
                <p className="text-[20px] font-bold leading-none text-[#073763]">
                  {item.priceLabel}
                </p>
                <p className="mt-1 text-[10px] text-[#8FA3B8]">{item.priceUnit}</p>
              </div>

              <dl className="mt-3 space-y-1 text-[10px] text-[#8FA3B8]">
                <div className="flex justify-between gap-2">
                  <dt>Pelatih</dt>
                  <dd className="truncate text-right text-[#526B84]">
                    {item.coachName}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Target sesi</dt>
                  <dd className="text-[#526B84]">{item.durationSessions} sesi</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Jadwal</dt>
                  <dd className="text-[#526B84]">{item.sessionCount} sesi/minggu</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Peserta</dt>
                  <dd className="text-[#526B84]">{item.enrollmentCount}</dd>
                </div>
              </dl>

              <div className="mt-4 flex gap-1.5 border-t border-[#F0F5FA] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(item);
                    setFormMode("edit");
                  }}
                  aria-label={`Ubah paket ${item.name}`}
                  title="Ubah paket"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6E5F3] bg-[#EAF4FD] text-[#1769AA] transition-colors hover:border-[#368DDF] hover:bg-[#E5F1FC]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setArchiving(item)}
                  aria-label={`${item.isActive ? "Nonaktifkan" : "Aktifkan"} paket ${item.name}`}
                  title={item.isActive ? "Nonaktifkan paket" : "Aktifkan kembali"}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                    item.isActive
                      ? "border-[#F0D5D5] bg-[#FDF2F2] text-red-500 hover:border-red-300 hover:bg-red-50"
                      : "border-[#D5EEE2] bg-[#EFFAF4] text-[#1F9C63] hover:border-[#7FCBA5]"
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {formMode && (
        <PackageFormModal
          mode={formMode}
          packageRow={editing}
          coachNames={coachNames}
          onClose={closeForm}
          onSaved={() => {
            closeForm();
            router.refresh();
          }}
        />
      )}

      {archiving && (
        <ArchiveConfirmModal
          subject={archiving.name}
          isActive={archiving.isActive}
          noun="paket"
          body={
            archiving.isActive
              ? archiving.enrollmentCount > 0
                ? `akan hilang dari katalog peserta. ${archiving.enrollmentCount} peserta terdaftar di paket ini dan riwayatnya tetap disimpan.`
                : "akan hilang dari katalog peserta. Riwayat enrollment dan jadwalnya tetap disimpan."
              : "akan tampil lagi di katalog peserta."
          }
          onClose={() => setArchiving(null)}
          onConfirm={toggleActive}
        />
      )}
    </>
  );
}