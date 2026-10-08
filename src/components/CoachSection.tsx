const achievements = [
  { title: "Kota", subtitle: "Atlet tingkat kota" },
  { title: "Provinsi", subtitle: "Atlet tingkat provinsi" },
  { title: "Nasional", subtitle: "Atlet tingkat nasional" },
];

export default function CoachSection() {
  return (
    <section className="w-full bg-[#F3F8FD]">
      <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-16">
        {/* Label */}
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[#368DDF]">
          Pelatih Kami
        </p>

        {/* Heading */}
        <h1 className="mt-3 text-center text-[26px] font-bold leading-[1.3] text-[#073763] lg:text-[28px]">
          Dibimbing langsung oleh pelatih
          <br />
          profesional
        </h1>

        {/* Profil */}
        <div className="mx-auto mt-12 grid max-w-[860px] items-start gap-10 sm:mt-14 lg:grid-cols-[335px_1fr] lg:gap-12">
          {/* Foto pelatih */}
          <div className="flex h-[248px] w-full items-center justify-center rounded-lg border border-[#D6E5F3] bg-[#B8D5F2] lg:w-[335px]">
            <span className="text-sm font-medium text-[#073763]/70">
              Foto pelatih
            </span>
          </div>

          {/* Informasi pelatih */}
          <div className="flex flex-col">
            <span className="inline-flex w-fit items-center rounded-full bg-[#E5F1FC] px-3 py-1 text-[9px] font-semibold text-[#1769AA]">
              Pelatih berlisensi
            </span>

            <h2 className="mt-3 text-[20px] font-bold text-[#073763]">
              Nadia Syafani Rahmah
            </h2>

            <p className="mt-3 max-w-[380px] text-[12px] leading-[1.7] text-[#526B84] lg:text-[13px] text-justify">
              Nadia adalah pelatih renang profesional bersertifikat/ berlisensiresmi. Sebelum menjadi pelatih, Nadia berkarier sebagai atlet
              renang, mewakili tingkat kota, provinsi, hingga nasional. Pengalamannya sebagai atlet kompetitif menjadikannya pelatih yang
              memahami teknik dasar maupun lanjutan secara mendalam, cocok untuk peserta dari segala usia dan tingkat kemampuan.
            </p>

            {/* Prestasi */}
            <div className="mt-5 flex flex-wrap gap-3">
              {achievements.map((item) => (
                <div
                  key={item.title}
                  className="flex h-[72px] w-[100px] flex-col items-center justify-center gap-1 rounded-lg border border-[#D6E5F3] bg-white text-center"
                >
                  <span className="text-[14px] font-bold text-[#073763]">
                    {item.title}
                  </span>
                  <span className="text-[9px] leading-[1.3] text-[#526B84]">
                    {item.subtitle}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}