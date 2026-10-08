"use client";

import { useMemo, useState } from "react";
import type { ParticipantScheduleRow, ScheduleRow } from "@/admin/types";
import {
  getCoachShortName,
  getDayIndex,
  getDayLabel,
  getProgramTone,
  toMinutes,
} from "@/admin/jadwal/schedule-format";

type ParticipantSchedulePreviewProps = {
  participants: ParticipantScheduleRow[];
  sessions: ScheduleRow[];
  /** 0 = Minggu ... 6 = Sabtu, mengikuti `course_sessions.day_of_week`. */
  todayDow: number;
  /** Menit sejak tengah malam di zona waktu Indonesia, dihitung di server. */
  nowMinutes: number;
};

type UpcomingSession = {
  session: ScheduleRow;
  dayOffset: number;
};

export default function ParticipantSchedulePreview({
  participants,
  sessions,
  todayDow,
  nowMinutes,
}: ParticipantSchedulePreviewProps) {
  const [selectedId, setSelectedId] = useState(participants[0]?.id ?? "");

  const participant =
    participants.find((item) => item.id === selectedId) ?? participants[0] ?? null;

  const schedule = useMemo(
    () =>
      sessions
        .filter(
          (session) =>
            participant?.packageIds.includes(session.courseId) ?? false,
        )
        .sort(
          (a, b) =>
            getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek) ||
            toMinutes(a.startTime) - toMinutes(b.startTime),
        ),
    [sessions, participant],
  );

  /**
   * Sesi berikutnya dihitung dari `todayDow` + `nowMinutes` yang dikirim server,
   * bukan dari jam lokal browser, supaya hasilnya sama dengan yang dilihat
   * peserta di dashboardnya.
   */
  const upcoming = useMemo<UpcomingSession[]>(() => {
    const items = schedule.map((session) => {
      const start = toMinutes(session.startTime);
      let dayOffset = (getDayIndex(session.dayOfWeek) - getDayIndex(todayDow) + 7) % 7;
      if (dayOffset === 0 && start <= nowMinutes) dayOffset = 7;

      return { session, dayOffset, start };
    });

    return items
      .sort((a, b) => a.dayOffset - b.dayOffset || a.start - b.start)
      .slice(0, 3);
  }, [schedule, todayDow, nowMinutes]);

  const relativeLabel = (dayOffset: number) => {
    if (dayOffset === 0) return "Hari ini";
    if (dayOffset === 1) return "Besok";
    return `${dayOffset} hari lagi`;
  };

  return (
    <div className="grid gap-[18px] xl:grid-cols-2">
      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[13px] font-bold text-[#073763]">
              Pratinjau peserta - Jadwal saya
            </h2>
            <p className="mt-1 text-[11px] text-[#8FA3B8]">
              Hanya sesi dari paket yang peserta ini terdaftar yang tampil.
            </p>
          </div>

          <label className="sr-only" htmlFor="pilih-peserta">
            Pilih peserta
          </label>
          <select
            id="pilih-peserta"
            value={participant?.id ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={participants.length === 0}
            className="h-[34px] rounded-lg border border-[#D6E5F3] bg-white px-2.5 text-[12px] text-[#073763] outline-none transition-colors focus:border-[#368DDF] disabled:opacity-60"
          >
            {participants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8FA3B8]">
            Terdaftar:
          </span>
          {participant && participant.packageNames.length > 0 ? (
            participant.packageNames.map((name) => (
              <span
                key={name}
                className={`rounded-[5px] px-2 py-1 text-[10px] font-medium text-white ${getProgramTone(name)}`}
              >
                {name}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[#8FA3B8]">
              Belum terdaftar paket aktif
            </span>
          )}
        </div>

        <div className="mt-4 overflow-x-auto rounded-[9px] border border-[#D6E5F3]">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                {["Hari", "Waktu", "Program", "Pelatih", "Status"].map((column) => (
                  <th
                    key={column}
                    className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-[11px] text-[#8FA3B8]"
                  >
                    Belum ada jadwal untuk peserta ini.
                  </td>
                </tr>
              ) : (
                schedule.map((session) => (
                  <tr key={session.id}>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] font-medium text-[#073763]">
                      {getDayLabel(session.dayOfWeek)}
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] text-[#526B84]">
                      {session.startTime} - {session.endTime}
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px]">
                      <span className="inline-block rounded-[5px] px-2 py-1 text-[9px] font-medium bg-[#E5F1FC] text-[#1769AA]">
                        {session.courseName}
                      </span>
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] text-[#526B84]">
                      {session.coachName}
                    </td>
                    <td className="border-b border-[#D6E5F3] px-3 py-[11px]">
                      <span className="inline-block rounded-full bg-[#E5F1FC] px-2.5 py-1 text-[9px] font-medium text-[#1769AA]">
                        Terjadwal
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <h2 className="text-[13px] font-bold text-[#073763]">
          Pratinjau dashboard - Sesi berikutnya
        </h2>
        <p className="mt-1 text-[11px] text-[#8FA3B8]">
          Diperbarui otomatis setiap kali admin menyimpan perubahan di atas.
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          {upcoming.length === 0 ? (
            <p className="rounded-[9px] border border-dashed border-[#D6E5F3] px-4 py-6 text-center text-[11px] text-[#8FA3B8]">
              Belum ada sesi berikutnya.
            </p>
          ) : (
            upcoming.map(({ session, dayOffset }) => (
              <div
                key={session.id}
                className="flex items-center gap-3 rounded-[9px] border border-[#D6E5F3] px-3 py-2.5"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-white ${getProgramTone(session.courseName)}`}
                >
                  <span className="text-[9px] uppercase leading-none">
                    {getDayLabel(session.dayOfWeek).slice(0, 3)}
                  </span>
                  <span className="text-[11px] font-bold leading-tight">
                    {session.startTime}
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-[#073763]">
                    {session.courseName} - {getCoachShortName(session.coachName)}
                  </span>
                  <span className="block text-[10px] text-[#8FA3B8]">
                    {session.startTime} - {session.endTime} WIB
                  </span>
                </span>

                <span className="shrink-0 rounded-full bg-[#E5F1FC] px-2.5 py-1 text-[9px] font-medium text-[#1769AA]">
                  {relativeLabel(dayOffset)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}