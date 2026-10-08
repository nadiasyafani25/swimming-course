const features = [
  {
    number: "01",
    title: "Program bertingkat",
    description:
      "Dari pengenalan air hingga teknik lanjutan, disusun sesuai usia dan kemampuan.",
  },
  {
    number: "02",
    title: "Pelatih bersertifikat",
    description:
      "Dibimbing pelatih berpengalaman dengan rasio peserta yang terjaga di setiap sesi.",
  },
  {
    number: "03",
    title: "Jadwal fleksibel",
    description:
      "Pilih sesi pagi, sore, atau akhir pekan sesuai kesibukan Anda.",
  },
];

export default function WhySection() {
  return (
    <section id="tentang" className="w-full bg-[#F3F8FD]">
      <div className="mx-auto max-w-[1340px] px-5 py-[65px] lg:px-[50px] lg:py-[64px]">
        {/* Label */}
        <p className="text-center text-[13px] font-bold uppercase tracking-[0.08em] text-[#1769AA]">
          Kenapa SwimmingCourse
        </p>

        {/* Judul */}
        <h2 className="mt-[18px] text-center text-[30px] font-bold leading-snug text-[#073763] lg:text-[34px]">
          Belajar renang jadi lebih terstruktur
        </h2>

        {/* Deskripsi */}
        <p className="mx-auto mt-4 max-w-[680px] text-center text-[15px] leading-relaxed text-[#526B84] lg:text-[16px]">
          Setiap peserta mendapat jadwal, pelatih, dan laporan perkembangan yang
          jelas melalui sistem kami.
        </p>

        {/* Cards */}
        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:gap-6">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="flex h-auto flex-col rounded-xl border border-[#D6E5F3] bg-white p-6 lg:h-[180px]"
            >
              {/* Nomor */}
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E5F1FC]">
                <span className="text-[18px] font-bold text-[#1769AA]">
                  {feature.number}
                </span>
              </div>

              {/* Judul card */}
              <h3 className="mt-4 text-[16px] font-semibold text-[#073763]">
                {feature.title}
              </h3>

              {/* Deskripsi card */}
              <p className="mt-2 text-[13px] leading-relaxed text-[#526B84] lg:text-[14px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
