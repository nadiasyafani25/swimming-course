"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ScheduleRow } from "@/admin/types";
import {
  SCHEDULE_DAYS,
  fromMinutes,
  getCoachShortName,
  getDayLabel,
  getProgramTone,
  toDotTime,
  toMinutes,
} from "@/admin/jadwal/schedule-format";
import SessionFormModal from "@/admin/jadwal/SessionFormModal";

const HIDDEN_TIMES_KEY = "swimming-course.jadwal.hidden-times";

type ScheduleMatrixProps = {
  sessions: ScheduleRow[];
  packages: { id: string; name: string }[];
  coachNames: string[];
  /** 0 = Minggu ... 6 = Sabtu, mengikuti `course_sessions.day_of_week`. */
  todayDow: number;
};

type ModalState = {
  mode: "create" | "edit";
  session: ScheduleRow | null;
  prefill: { dayOfWeek: number; startTime: string };
};

type Notice = { tone: "sukses" | "gagal"; text: string } | null;

type CellTarget = { dayOfWeek: number; startTime: string };

type TimeDraft = { startTime: string; endTime: string };

function readHiddenTimes(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HIDDEN_TIMES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

const ROW_MENU_WIDTH = 244;
const ROW_MENU_HEIGHT = 240;

/**
 * Posisi menu baris jam dalam koordinat viewport.
 *
 * Menu dirender lewat portal ke `document.body`, jadi posisinya harus dihitung
 * sendiri dari tombol pemicunya. Kalau tidak cukup ruang di bawah, menu dibuka
 * ke atas supaya tidak keluar layar.
 */
function getRowMenuPosition(trigger: HTMLElement): {
  top: number;
  left: number;
} {
  const rect = trigger.getBoundingClientRect();

  const left = Math.max(
    8,
    Math.min(rect.left, window.innerWidth - ROW_MENU_WIDTH - 8),
  );
  const top =
    rect.bottom + ROW_MENU_HEIGHT + 12 > window.innerHeight
      ? Math.max(8, rect.top - ROW_MENU_HEIGHT - 6)
      : rect.bottom + 6;

  return { top, left };
}

export default function ScheduleMatrix({
  sessions,
  packages,
  coachNames,
  todayDow,
}: ScheduleMatrixProps) {
  const router = useRouter();
  const [rows, setRows] = useState(sessions);
  const [lastSynced, setLastSynced] = useState(sessions);

  // `rows` dipakai untuk render supaya geser jam terasa instan. Setiap selesai
  // `router.refresh()` mengirim prop baru, dan prop itulah yang jadi acuan
  // state lokal.
  if (lastSynced !== sessions) {
    setLastSynced(sessions);
    setRows(sessions);
  }

  const [packageFilter, setPackageFilter] = useState("all");
  const [coachFilter, setCoachFilter] = useState("all");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<CellTarget | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TimeDraft>({ startTime: "", endTime: "" });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const draftRef = useRef<HTMLDivElement | null>(null);

  // Baris jam yang disembunyikan hanya preference tampilan admin, jadi
  // disimpan di browser, bukan di database: sesi di jam itu tetap utuh dan
  // tetap tampil di jadwal peserta.
  const [hiddenTimes, setHiddenTimes] = useState<string[]>([]);
  const [isHiddenLoaded, setIsHiddenLoaded] = useState(false);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [rowMenuPosition, setRowMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [confirmRow, setConfirmRow] = useState<string | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);

  if (!isHiddenLoaded && typeof window !== "undefined") {
    setIsHiddenLoaded(true);
    setHiddenTimes(readHiddenTimes());
  }

  useEffect(() => {
    if (!isHiddenLoaded) return;
    window.localStorage.setItem(HIDDEN_TIMES_KEY, JSON.stringify(hiddenTimes));
  }, [hiddenTimes, isHiddenLoaded]);

  const visible = useMemo(
    () =>
      rows.filter((session) => {
        const matchPackage =
          packageFilter === "all" || session.courseId === packageFilter;
        const matchCoach =
          coachFilter === "all" || session.coachName === coachFilter;
        const matchTime = !hiddenTimes.includes(session.startTime);
        return matchPackage && matchCoach && matchTime;
      }),
    [rows, packageFilter, coachFilter, hiddenTimes],
  );

  const timeRows = useMemo(
    () =>
      [...new Set(visible.map((session) => session.startTime))].sort(
        (a, b) => toMinutes(a) - toMinutes(b),
      ),
    [visible],
  );

  /**
   * Sesi pada satu baris jam, di luar filter paket/pelatih.
   *
   * Baris jam dihapus berdasarkan seluruh isinya: kalau hanya sesi yang terlihat
   * yang dihapus, baris yang sama akan muncul lagi begitu filter dibuka.
   */
  const sessionsOnRow = (startTime: string) =>
    rows.filter((session) => session.startTime === startTime);

  const hiddenRowTimes = useMemo(
    () =>
      [...new Set(rows.map((session) => session.startTime))]
        .filter((time) => hiddenTimes.includes(time))
        .sort((a, b) => toMinutes(a) - toMinutes(b)),
    [rows, hiddenTimes],
  );

  const isFiltered =
    packageFilter !== "all" || coachFilter !== "all" || hiddenTimes.length > 0;

  const hideRow = (startTime: string) => {
    setHiddenTimes((prev) =>
      prev.includes(startTime) ? prev : [...prev, startTime],
    );
    setRowMenu(null);
    setRowMenuPosition(null);
    setNotice({
      tone: "sukses",
      text: `Baris jam ${toDotTime(startTime)} disembunyikan. Sesi di jam itu tetap tampil untuk peserta.`,
    });
  };

  const showRow = (startTime: string) => {
    setHiddenTimes((prev) => prev.filter((time) => time !== startTime));
    setNotice({
      tone: "sukses",
      text: `Baris jam ${toDotTime(startTime)} ditampilkan kembali.`,
    });
  };

  /**
   * Hapus seluruh sesi pada satu baris jam.
   *
   * Sesi di-nonaktifkan lewat `DELETE /api/admin/schedules/:id` supaya riwayat
   * kehadiran peserta tetap utuh, dan baris jamnya hilang dari matriks karena
   * baris diturunkan dari sesi yang masih aktif.
   */
  const deleteRow = async (startTime: string) => {
    const targets = sessionsOnRow(startTime);
    if (targets.length === 0) return;

    setBusyRow(startTime);
    setNotice(null);

    try {
      const responses = await Promise.all(
        targets.map((session) =>
          fetch(`/api/admin/schedules/${session.id}`, { method: "DELETE" }),
        ),
      );

      const failed = responses.filter((res) => !res.ok);

      if (failed.length > 0) {
        const first = await failed[0].json().catch(() => null);
        afterError(first?.error ?? "Gagal menghapus baris jam ini.");
        return;
      }

      setHiddenTimes((prev) => prev.filter((time) => time !== startTime));
      setRowMenu(null);
      setRowMenuPosition(null);
      setConfirmRow(null);
      setNotice({
        tone: "sukses",
        text: `Baris jam ${toDotTime(startTime)} dihapus (${targets.length} sesi). Jadwal peserta ikut diperbarui.`,
      });
      router.refresh();
    } catch {
      afterError("Gagal menghubungi server.");
    } finally {
      setBusyRow(null);
      setConfirmRow(null);
    }
  };

  const afterChange = (text: string) => {
    setModal(null);
    setEditingId(null);
    setNotice({ tone: "sukses", text });
    router.refresh();
  };

  const afterError = (text: string) => {
    setNotice({ tone: "gagal", text });
  };

  /**
   * Simpan hasil geser jam / edit waktu inline.
   *
   * State lokal diperbarui duluan supaya pill langsung pindah, lalu PATCH ke
   * server. Kalau server menolak (mis. bentrok jadwal pelatih) state dikembalikan
   * ke posisi semula supaya matriks tidak pernah menampilkan jadwal yang tidak
   * benar-benar tersimpan.
   */
  const patchSession = async (
    session: ScheduleRow,
    patch: { dayOfWeek: number; startTime: string; endTime: string },
  ) => {
    const unchanged =
      session.dayOfWeek === patch.dayOfWeek &&
      session.startTime === patch.startTime &&
      session.endTime === patch.endTime;
    if (unchanged) return true;

    const previous = rows;
    setPendingId(session.id);
    setRows((current) =>
      current.map((item) =>
        item.id === session.id ? { ...item, ...patch } : item,
      ),
    );
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/schedules/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: session.courseId,
          coachName: session.coachName,
          dayOfWeek: patch.dayOfWeek,
          startTime: patch.startTime,
          endTime: patch.endTime,
          capacity: session.capacity,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setRows(previous);
        afterError(data?.error ?? "Gagal menyimpan waktu sesi.");
        return false;
      }

      setNotice({
        tone: "sukses",
        text: `Waktu ${session.courseName} - ${getCoachShortName(session.coachName)} dipindah ke ${getDayLabel(patch.dayOfWeek)} ${toDotTime(patch.startTime)}. Jadwal peserta ikut sinkron.`,
      });
      router.refresh();
      return true;
    } catch {
      setRows(previous);
      afterError("Gagal menghubungi server.");
      return false;
    } finally {
      setPendingId(null);
    }
  };

  const handleDrop = async (target: CellTarget) => {
    const session = rows.find((item) => item.id === draggingId);
    setDraggingId(null);
    setDropTarget(null);
    if (!session) return;

    const duration = toMinutes(session.endTime) - toMinutes(session.startTime);
    await patchSession(session, {
      dayOfWeek: target.dayOfWeek,
      startTime: target.startTime,
      endTime: fromMinutes(toMinutes(target.startTime) + Math.max(duration, 15)),
    });
  };

  const openInlineEditor = (session: ScheduleRow) => {
    setEditingId(session.id);
    setDraft({ startTime: session.startTime, endTime: session.endTime });
  };

  const saveInlineEditor = async (session: ScheduleRow) => {
    if (toMinutes(draft.endTime) <= toMinutes(draft.startTime)) {
      afterError("Waktu selesai harus lebih besar dari waktu mulai.");
      return;
    }

    const ok = await patchSession(session, {
      dayOfWeek: session.dayOfWeek,
      startTime: draft.startTime,
      endTime: draft.endTime,
    });

    if (ok) setEditingId(null);
  };

  // Fokus langsung ke kolom jam begitu editor inline dibuka.
  useEffect(() => {
    if (editingId) draftRef.current?.querySelector("input")?.focus();
  }, [editingId]);

  // Menu baris jam ikut tertutup kalau admin klik di luar, menekan Escape,
  // atau menggulir matriks (posisinya dipatok ke viewport, bukan ke sel).
  useEffect(() => {
    if (!rowMenu) return;

    const closeMenu = () => {
      setRowMenu(null);
      setRowMenuPosition(null);
      setConfirmRow(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeMenu);
    };
  }, [rowMenu]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="sr-only" htmlFor="filter-paket">
            Filter paket
          </label>
          <select
            id="filter-paket"
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="h-[34px] rounded-lg border border-[#D6E5F3] bg-white px-2.5 text-[12px] text-[#073763] outline-none transition-colors focus:border-[#368DDF]"
          >
            <option value="all">Semua paket</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filter-pelatih">
            Filter pelatih
          </label>
          <select
            id="filter-pelatih"
            value={coachFilter}
            onChange={(e) => setCoachFilter(e.target.value)}
            className="h-[34px] rounded-lg border border-[#D6E5F3] bg-white px-2.5 text-[12px] text-[#073763] outline-none transition-colors focus:border-[#368DDF]"
          >
            <option value="all">Semua pelatih</option>
            {coachNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <span className="text-[11px] text-[#8FA3B8]">
            {visible.length} sesi{isFiltered ? " (difilter)" : ""}
          </span>

          {hiddenRowTimes.length > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D6E5F3] bg-white px-2.5 py-1 text-[11px] text-[#526B84]">
              <EyeOff className="h-3 w-3" />
              {hiddenRowTimes.length} baris jam disembunyikan:
              {hiddenRowTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => showRow(time)}
                  className="rounded-full bg-[#E5F1FC] px-2 py-0.5 font-semibold text-[#1769AA] transition hover:bg-[#D6E5F3]"
                >
                  {toDotTime(time)} tampilkan
                </button>
              ))}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            setModal({
              mode: "create",
              session: null,
              prefill: { dayOfWeek: 1, startTime: "16:00" },
            })
          }
          className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-lg bg-[#0A2540] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#123a5e] focus:outline-none focus:ring-2 focus:ring-[#368DDF] focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Tambah sesi
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-lg border px-3.5 py-2.5 text-[11px] font-medium ${
            notice.tone === "sukses"
              ? "border-[#BFE3D2] bg-[#F1FBF6] text-[#0B7A4B]"
              : "border-[#F3C9C4] bg-[#FEF4F3] text-[#B42318]"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="overflow-hidden rounded-[10px] border border-[#D6E5F3] bg-white shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <div className="border-b border-[#D6E5F3] px-5 py-4">
          <h2 className="text-[14px] font-bold text-[#073763]">
            Jadwal mingguan
          </h2>
          <p className="mt-1 text-[11px] leading-[1.7] text-[#8FA3B8]">
            Geser pill ke sel lain untuk memindahkan hari dan jam mulai (durasi
            tetap). Klik ikon jam pada pill untuk mengubah jam mulai dan selesai
            di tempat, atau klik pillnya untuk mengubah paket dan pelatih. Baris
            jam dibuat otomatis dari jam sesi yang terdaftar — pakai ikon{" "}
            <MoreHorizontal className="inline h-3 w-3 align-[-2px]" /> pada kolom
            waktu untuk menyembunyikan atau menghapus satu baris jam.
          </p>
        </div>

        <div
          className="max-h-[62vh] overflow-auto"
          onScroll={() => {
            if (rowMenu) {
              setRowMenu(null);
              setRowMenuPosition(null);
              setConfirmRow(null);
            }
          }}
        >
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 w-[92px] border-b border-r border-[#D6E5F3] bg-[#E5F1FC] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                  Waktu
                </th>
                {SCHEDULE_DAYS.map((day) => (
                  <th
                    key={day.value}
                    scope="col"
                    className={`sticky top-0 z-10 min-w-[132px] border-b border-r border-[#D6E5F3] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide ${
                      day.value === todayDow
                        ? "bg-[#0A2540] text-white"
                        : "bg-[#E5F1FC] text-[#073763]"
                    }`}
                  >
                    {day.label}
                    {day.value === todayDow && (
                      <span className="ml-1 font-normal normal-case opacity-80">
                        (hari ini)
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-[12px] text-[#8FA3B8]"
                  >
                    {isFiltered
                      ? "Tidak ada sesi pada filter ini."
                      : "Belum ada sesi. Klik “Tambah sesi” untuk membuat jadwal pertama."}
                  </td>
                </tr>
              ) : (
                timeRows.map((startTime) => {
                  const rowSessions = visible.filter(
                    (session) => session.startTime === startTime,
                  );

                  return (
                    <tr key={startTime}>
                      <th
                        scope="row"
                        className="sticky left-0 z-10 border-b border-r border-[#D6E5F3] bg-white px-3 py-3 text-left align-top"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span>
                            <span className="block text-[13px] font-bold text-[#073763]">
                              {toDotTime(startTime)}
                            </span>
                            <span className="block text-[9px] text-[#8FA3B8]">
                              s/d {toDotTime(rowSessions[0].endTime)}
                            </span>
                          </span>

                          <button
                            type="button"
                            aria-label={`Kelola baris jam ${toDotTime(startTime)}`}
                            title="Sembunyikan atau hapus baris jam ini"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (rowMenu === startTime) {
                                setRowMenu(null);
                                setConfirmRow(null);
                                return;
                              }
                              setRowMenu(startTime);
                              setConfirmRow(null);
                              setRowMenuPosition(
                                getRowMenuPosition(e.currentTarget),
                              );
                            }}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#8FA3B8] transition-colors hover:bg-[#E5F1FC] hover:text-[#0A2540]"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>

                      {SCHEDULE_DAYS.map((day) => {
                        const cellSessions = rowSessions.filter(
                          (session) => session.dayOfWeek === day.value,
                        );
                        const isDropTarget =
                          dropTarget?.dayOfWeek === day.value &&
                          dropTarget?.startTime === startTime;

                        return (
                          <td
                            key={day.value}
                            onDragOver={(e) => {
                              if (!draggingId) return;
                              e.preventDefault();
                              setDropTarget({
                                dayOfWeek: day.value,
                                startTime,
                              });
                            }}
                            onDragLeave={() =>
                              setDropTarget((current) =>
                                current?.dayOfWeek === day.value &&
                                current?.startTime === startTime
                                  ? null
                                  : current,
                              )
                            }
                            onDrop={(e) => {
                              e.preventDefault();
                              void handleDrop({
                                dayOfWeek: day.value,
                                startTime,
                              });
                            }}
                            className={`group/cell border-b border-r border-[#D6E5F3] px-2 py-2 align-top transition-colors ${
                              isDropTarget
                                ? "bg-[#E5F1FC] outline outline-2 -outline-offset-2 outline-[#368DDF]"
                                : day.value === todayDow
                                  ? "bg-[#F5FAFE]"
                                  : "bg-white"
                            }`}
                          >
                            <div className="flex flex-col gap-1.5">
                              {cellSessions.map((session) => (
                                <div key={session.id}>
                                  {editingId === session.id ? (
                                    <div
                                      ref={draftRef}
                                      className="rounded-[10px] border border-[#368DDF] bg-white p-2 shadow-[0_2px_8px_rgba(10,37,64,0.16)]"
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                          e.stopPropagation();
                                          setEditingId(null);
                                          return;
                                        }
                                        if (e.key === "Enter") {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          void saveInlineEditor(session);
                                        }
                                      }}
                                      role="group"
                                    >
                                      <span className="mb-1.5 block truncate text-[10px] font-semibold text-[#073763]">
                                        {session.courseName} -{" "}
                                        {getCoachShortName(session.coachName)}
                                      </span>

                                      <label className="block">
                                        <span className="sr-only">Mulai</span>
                                        <input
                                          type="time"
                                          step={300}
                                          value={draft.startTime}
                                          onChange={(e) =>
                                            setDraft((prev) => ({
                                              ...prev,
                                              startTime: e.target.value,
                                            }))
                                          }
                                          className="mb-1 h-[28px] w-full rounded-md border border-[#D6E5F3] px-1.5 text-[11px] text-[#073763] outline-none focus:border-[#368DDF]"
                                        />
                                      </label>

                                      <label className="block">
                                        <span className="sr-only">Selesai</span>
                                        <input
                                          type="time"
                                          step={300}
                                          value={draft.endTime}
                                          onChange={(e) =>
                                            setDraft((prev) => ({
                                              ...prev,
                                              endTime: e.target.value,
                                            }))
                                          }
                                          className="h-[28px] w-full rounded-md border border-[#D6E5F3] px-1.5 text-[11px] text-[#073763] outline-none focus:border-[#368DDF]"
                                        />
                                      </label>

                                      <div className="mt-1.5 flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void saveInlineEditor(session)
                                          }
                                          disabled={pendingId === session.id}
                                          className="inline-flex h-[26px] flex-1 items-center justify-center gap-1 rounded-md bg-[#0A2540] text-[10px] font-semibold text-white transition-colors hover:bg-[#123a5e] disabled:opacity-60"
                                        >
                                          <Check className="h-3 w-3" />
                                          Simpan
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingId(null)}
                                          disabled={pendingId === session.id}
                                          aria-label="Batal ubah waktu"
                                          className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-md border border-[#D6E5F3] text-[#526B84] transition-colors hover:bg-[#F1F6FB] disabled:opacity-60"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      draggable
                                      onDragStart={(e) => {
                                        setDraggingId(session.id);
                                        e.dataTransfer.effectAllowed = "move";
                                        e.dataTransfer.setData(
                                          "text/plain",
                                          session.id,
                                        );
                                      }}
                                      onDragEnd={() => {
                                        setDraggingId(null);
                                        setDropTarget(null);
                                      }}
                                      onClick={() =>
                                        setModal({
                                          mode: "edit",
                                          session,
                                          prefill: {
                                            dayOfWeek: session.dayOfWeek,
                                            startTime: session.startTime,
                                          },
                                        })
                                      }
                                      title={`${session.courseName} - ${session.coachName}. Geser untuk memindahkan, klik untuk mengubah.`}
                                      className={`group/sesi w-full cursor-grab rounded-[10px] px-2.5 py-2 text-left text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#368DDF] focus:ring-offset-1 active:cursor-grabbing ${getProgramTone(session.courseName)} ${
                                        draggingId === session.id
                                          ? "opacity-40"
                                          : ""
                                      } ${
                                        pendingId === session.id
                                          ? "animate-pulse"
                                          : ""
                                      }`}
                                    >
                                      <span className="flex items-start justify-between gap-1">
                                        <span className="truncate text-[11px] font-semibold leading-tight">
                                          {session.courseName} -{" "}
                                          {getCoachShortName(session.coachName)}
                                        </span>

                                        <span className="flex shrink-0 items-center gap-1">
                                          <button
                                            type="button"
                                            aria-label={`Ubah waktu sesi ${session.courseName}`}
                                            title="Ubah jam mulai dan selesai"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openInlineEditor(session);
                                            }}
                                            className="flex h-4 w-4 items-center justify-center rounded text-white/80 opacity-0 transition hover:bg-white/20 hover:text-white focus:opacity-100 group-hover/sesi:opacity-100"
                                          >
                                            <Clock className="h-3 w-3" />
                                          </button>
                                          <Pencil className="h-3 w-3 opacity-0 transition group-hover/sesi:opacity-90" />
                                        </span>
                                      </span>

                                      <span className="mt-1 block text-[10px] text-white/75">
                                        {toDotTime(session.startTime)} -{" "}
                                        {toDotTime(session.endTime)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() =>
                                  setModal({
                                    mode: "create",
                                    session: null,
                                    prefill: { dayOfWeek: day.value, startTime },
                                  })
                                }
                                className="w-full rounded-[10px] border border-dashed border-[#BBD4EC] px-2 py-1 text-[10px] font-semibold text-[#1769AA] opacity-0 transition hover:border-[#368DDF] hover:bg-[#E5F1FC] focus:opacity-100 group-hover/cell:opacity-100"
                                style={{ opacity: dropTarget ? 1 : undefined }}
                              >
                                + Tambah
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rowMenu &&
        rowMenuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="menu"
            aria-label={`Kelola baris jam ${toDotTime(rowMenu)}`}
            onClick={(e) => e.stopPropagation()}
            style={{ top: rowMenuPosition.top, left: rowMenuPosition.left }}
            className="fixed z-[90] w-[244px] max-h-[70vh] overflow-y-auto rounded-lg border border-[#D6E5F3] bg-white p-2.5 text-left shadow-[0_12px_28px_rgba(10,37,64,0.24)]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8FA3B8]">
              Baris jam {toDotTime(rowMenu)} -{" "}
              {toDotTime(sessionsOnRow(rowMenu)[0]?.endTime ?? rowMenu)}
            </p>

            <ul className="mt-1.5 flex flex-col gap-1">
              {sessionsOnRow(rowMenu).map((session) => (
                <li
                  key={session.id}
                  className="truncate text-[10px] text-[#526B84]"
                >
                  {getDayLabel(session.dayOfWeek)} - {session.courseName} -{" "}
                  {getCoachShortName(session.coachName)}
                </li>
              ))}
            </ul>

            <div className="mt-2.5 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => hideRow(rowMenu)}
                className="inline-flex h-[30px] items-center justify-center gap-1.5 rounded-md border border-[#D6E5F3] text-[10px] font-semibold text-[#526B84] transition-colors hover:bg-[#F1F6FB] hover:text-[#073763]"
              >
                <EyeOff className="h-3 w-3" />
                Sembunyikan baris
              </button>

              {confirmRow === rowMenu ? (
                <button
                  type="button"
                  onClick={() => void deleteRow(rowMenu)}
                  disabled={busyRow === rowMenu}
                  className="inline-flex h-[30px] items-center justify-center gap-1.5 rounded-md bg-[#B42318] text-[10px] font-semibold text-white transition-colors hover:bg-[#92150C] disabled:opacity-60"
                >
                  <Trash2 className="h-3 w-3" />
                  {busyRow === rowMenu
                    ? "Menghapus..."
                    : `Yakin hapus ${sessionsOnRow(rowMenu).length} sesi?`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRow(rowMenu)}
                  className="inline-flex h-[30px] items-center justify-center gap-1.5 rounded-md border border-[#F3C9C4] text-[10px] font-semibold text-[#B42318] transition-colors hover:bg-[#FEF4F3]"
                >
                  <Trash2 className="h-3 w-3" />
                  Hapus baris jam ini
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setRowMenu(null);
                  setRowMenuPosition(null);
                  setConfirmRow(null);
                }}
                className="h-[24px] rounded-md text-[10px] font-semibold text-[#8FA3B8] transition-colors hover:text-[#073763]"
              >
                Tutup
              </button>
            </div>
          </div>,
          document.body,
        )}

      {modal && (
        <SessionFormModal
          mode={modal.mode}
          session={modal.session}
          prefill={modal.prefill}
          packages={packages}
          coachNames={coachNames}
          onClose={() => setModal(null)}
          onSaved={afterChange}
          onError={afterError}
        />
      )}
    </>
  );
}