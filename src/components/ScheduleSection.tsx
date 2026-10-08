const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const schedule: Record<string, Record<string, string>> = {
  "07.00": {
    Senin: "Anak - dasar",
    Rabu: "Anak - dasar",
    Jumat: "Anak - dasar",
    Sabtu: "Grup keluarga",
  },
  "16.00": {
    Senin: "4 gaya",
    Selasa: "Privat",
    Rabu: "4 gaya",
    Kamis: "Privat",
    Jumat: "4 gaya",
    Sabtu: "Kompetisi",
    Minggu: "Aqua fitness",
  },
  "19.00": {
    Senin: "Dewasa",
    Rabu: "Dewasa",
    Jumat: "Dewasa",
  },
};

const times = ["07.00", "16.00", "19.00"];

export default function ScheduleSection() {
  return (
    <section className="w-full bg-[#F3F8FD]">
      <div className="mx-auto max-w-[1340px] px-5 pb-24 pt-16 lg:px-[50px]">
        {/* Label */}
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#368DDF]">
          Jadwal Kelas
        </p>

        {/* Heading */}
        <h1 className="mt-3 text-center text-[24px] font-bold leading-snug text-[#073763] lg:text-[28px]">
          Jadwal mingguan kolam Hotel Pelangi
        </h1>

        {/* Tabel */}
        <div className="mt-10 overflow-x-auto rounded-[10px] border border-[#D6E5F3] bg-white max-w-[1100px] mx-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-center text-[9px] font-bold uppercase tracking-wide text-[#073763] lg:text-[10px]">
                  Waktu
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="border-b border-l border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-center text-[9px] font-bold uppercase tracking-wide text-[#073763] lg:text-[10px]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((time) => (
                <tr key={time}>
                  <td className="w-[60px] border-b border-[#D6E5F3] px-3 py-[9px] text-center text-[10px] font-medium text-[#526B84] lg:text-[11px]">
                    {time}
                  </td>
                  {days.map((day) => {
                    const className = schedule[time]?.[day];
                    return (
                      <td
                        key={day}
                        className={`border-b border-l border-[#D6E5F3] px-1 text-center ${
                          time === "19.00" ? "border-b-0" : ""
                        }`}
                      >
                        {className && (
                          <span className="inline-block rounded-[5px] bg-[#0D4D85] px-2 py-1 text-center text-[9px] font-medium text-white lg:text-[9px]">
                            {className}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}