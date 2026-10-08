const stats = [
  { value: "120+", label: "Peserta aktif" },
  { value: "6", label: "Pelatih bersertifikat" },
  { value: "8", label: "Tahun beroperasi" },
  { value: "4.9/5", label: "Rating peserta" },
];

export default function StatsSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto grid max-w-[1340px] grid-cols-2 gap-[10px] px-5 py-[45px] sm:grid-cols-4 lg:grid-cols-4 lg:px-[50px] lg:py-[55px]">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex h-[75px] flex-col items-center justify-center rounded-lg border border-[#D6E5F3] bg-white p-3 text-center lg:h-[60px]"
          >
            <span className="text-[18px] font-bold leading-tight text-[#073763] lg:text-[20px]">
              {stat.value}
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-[#526B84] lg:text-[11px]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}