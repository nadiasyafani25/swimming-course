"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { ScheduleRow } from "@/admin/types";
import {
  SCHEDULE_DAYS,
  fromMinutes,
  getCoachShortName,
  getDayLabel,
  toMinutes,
} from "@/admin/jadwal/schedule-format";

type Errors = Partial<
  Record<
    "dayOfWeek" | "startTime" | "endTime" | "courseId" | "coachName" | "capacity",
    string
  >
>;

type SessionFormModalProps = {
  mode: "create" | "edit";
  session: ScheduleRow | null;
  prefill: { dayOfWeek: number; startTime: string };
  packages: { id: string; name: string }[];
  coachNames: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
};

export default function SessionFormModal({
  mode,
  session,
  prefill,
  packages,
  coachNames,
  onClose,
  onSaved,
  onError,
}: SessionFormModalProps) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() => ({
    dayOfWeek: String(session ? session.dayOfWeek : prefill.dayOfWeek),
    startTime: session ? session.startTime : prefill.startTime,
    endTime: session
      ? session.endTime
      : fromMinutes(toMinutes(prefill.startTime) + 60),
    courseId: session ? session.courseId : packages[0]?.id ?? "",
    coachName: session ? session.coachName : coachNames[0] ?? "",
    capacity: session ? String(session.capacity) : "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const setField = (key: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Errors = {};
    if (!form.courseId) next.courseId = "Pilih program / paket.";
    if (!form.coachName) next.coachName = "Pilih pelatih.";
    if (!form.startTime) next.startTime = "Waktu mulai wajib diisi.";
    if (!form.endTime) next.endTime = "Waktu selesai wajib diisi.";
    if (
      form.startTime &&
      form.endTime &&
      toMinutes(form.endTime) <= toMinutes(form.startTime)
    ) {
      next.endTime = "Waktu selesai harus lebih besar dari waktu mulai.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);

    try {
      const res = await fetch(
        isEdit ? `/api/admin/schedules/${session?.id}` : "/api/admin/schedules",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: form.courseId,
            coachName: form.coachName,
            dayOfWeek: Number(form.dayOfWeek),
            startTime: form.startTime,
            endTime: form.endTime,
            capacity: form.capacity,
          }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const field = data?.field as keyof Errors | undefined;
        if (field) setErrors({ [field]: data?.error ?? "Gagal menyimpan sesi." });
        else onError(data?.error ?? "Gagal menyimpan sesi.");
        return;
      }

      const label = `${data?.courseName ?? "Sesi"} - ${getCoachShortName(form.coachName)}`;
      onSaved(
        isEdit
          ? `Sesi ${label} diperbarui. Jadwal peserta ikut sinkron.`
          : `Sesi ${label} ditambahkan. Jadwal peserta ikut sinkron.`,
      );
    } catch {
      onError("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/schedules/${session.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        onError(data?.error ?? "Gagal menghapus sesi.");
        return;
      }

      onSaved("Sesi dihapus dan langsung hilang dari jadwal peserta.");
    } catch {
      onError("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  const selectClass = (error?: string) =>
    `h-[38px] w-full rounded-lg border bg-white px-3 text-[12px] text-[#073763] outline-none transition-colors focus:border-[#2F8FE5] ${
      error ? "border-red-400" : "border-[#D6E5F3]"
    }`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A2540]/50 px-4 py-6"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-form-title"
        className="max-h-full w-full max-w-[460px] overflow-y-auto rounded-xl border border-[#D6E5F3] bg-white p-5 shadow-[0_12px_32px_rgba(10,37,64,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              id="session-form-title"
              className="text-[15px] font-bold text-[#073763]"
            >
              {isEdit ? "Ubah sesi" : "Tambah sesi"}
            </h3>
            <p className="mt-1 text-[11px] leading-[1.6] text-[#526B84]">
              Sesi ini langsung tampil di “Jadwal saya” peserta yang terdaftar
              pada paket yang dipilih.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#526B84] transition-colors hover:bg-[#F0F7FF] disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mt-5 flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Hari
            </span>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setField("dayOfWeek")(e.target.value)}
              className={selectClass(errors.dayOfWeek)}
            >
              {SCHEDULE_DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            {errors.dayOfWeek && (
              <span className="mt-1 block text-[10px] text-red-500">
                {errors.dayOfWeek}
              </span>
            )}
          </label>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Mulai
              </span>
              <input
                type="time"
                step={300}
                value={form.startTime}
                onChange={(e) => setField("startTime")(e.target.value)}
                className={selectClass(errors.startTime)}
              />
              {errors.startTime && (
                <span className="mt-1 block text-[10px] text-red-500">
                  {errors.startTime}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Selesai
              </span>
              <input
                type="time"
                step={300}
                value={form.endTime}
                onChange={(e) => setField("endTime")(e.target.value)}
                className={selectClass(errors.endTime)}
              />
              {errors.endTime && (
                <span className="mt-1 block text-[10px] text-red-500">
                  {errors.endTime}
                </span>
              )}
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Program / Paket
            </span>
            <select
              value={form.courseId}
              onChange={(e) => setField("courseId")(e.target.value)}
              className={selectClass(errors.courseId)}
            >
              <option value="">Pilih paket</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <span className="mt-1 block text-[10px] text-red-500">
                {errors.courseId}
              </span>
            )}
          </label>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Pelatih
              </span>
              <select
                value={form.coachName}
                onChange={(e) => setField("coachName")(e.target.value)}
                className={selectClass(errors.coachName)}
              >
                <option value="">Pilih pelatih</option>
                {coachNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {errors.coachName && (
                <span className="mt-1 block text-[10px] text-red-500">
                  {errors.coachName}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Kapasitas{" "}
                <span className="font-normal text-[#A9BACB]">(opsional)</span>
              </span>
              <input
                type="number"
                min={1}
                max={200}
                value={form.capacity}
                placeholder="10"
                onChange={(e) => setField("capacity")(e.target.value)}
                className={selectClass(errors.capacity)}
              />
              {errors.capacity && (
                <span className="mt-1 block text-[10px] text-red-500">
                  {errors.capacity}
                </span>
              )}
            </label>
          </div>

          {isEdit && confirmingDelete && (
            <div className="flex flex-col gap-2 rounded-lg border border-[#F3C9C4] bg-[#FEF4F3] px-3 py-3">
              <p className="text-[11px] font-medium text-[#B42318]">
                Hapus sesi {session?.courseName} -{" "}
                {session ? getCoachShortName(session.coachName) : ""} pada{" "}
                {session ? getDayLabel(session.dayOfWeek) : ""}? Sesi ini akan
                hilang dari jadwal peserta.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="h-[32px] rounded-lg bg-[#B42318] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#92150C] disabled:opacity-60"
                >
                  {saving ? "Menghapus..." : "Ya, hapus sesi"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={saving}
                  className="h-[32px] rounded-lg border border-[#D6E5F3] bg-white px-3 text-[11px] font-semibold text-[#526B84] transition-colors hover:bg-[#F1F6FB] disabled:opacity-60"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <div className="mt-1 flex gap-2.5">
            {isEdit ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={saving || confirmingDelete}
                className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-lg border border-[#F3C9C4] px-3 text-[12px] font-semibold text-[#B42318] transition-colors hover:bg-[#FEF4F3] disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus sesi
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-[38px] flex-1 rounded-lg border border-[#D6E5F3] text-[12px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-[38px] flex-1 rounded-lg bg-[#0A3966] text-[12px] font-semibold text-white transition-colors hover:bg-[#0A2540] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan perubahan"
                  : "Tambah sesi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}