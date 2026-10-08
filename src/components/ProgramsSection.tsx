const packages = [
  {
    badge: "Tanpa batasan peserta",
    title: "Kelas reguler",
    price: "Rp 350rb",
    unit: "/ peserta / bulan",
    description:
      "Belajar bersama dalam kelompok besar, jadwal rutin setiap minggu.",
  },
  {
    badge: "2-5 peserta",
    title: "Semi private",
    price: "Rp 1,5jt - 3jt",
    unit: "/ bulan",
    description:
      "Kelompok kecil, harga menyesuaikan jumlah peserta dalam kelas.",
  },
  {
    badge: "1 peserta",
    title: "Private",
    price: "Rp 1jt",
    unit: "/ peserta / bulan",
    description:
      "Perhatian penuh dari pelatih, jadwal menyesuaikan waktu Anda.",
  },
];

export default function ProgramsSection() {
  return (
    <section id="program" className="w-full bg-white">
      <div className="mx-auto max-w-[1340px] px-5 pb-[60px] pt-[5px] lg:px-[50px] lg:pt-[0px] lg:pb-[56px]">
        {/* Label */}
        <p className="text-center text-[13px] font-bold uppercase tracking-[0.08em] text-[#1769AA]">
          Program Unggulan
        </p>

        {/* Heading */}
        <h2 className="mt-[18px] text-center text-[30px] font-bold leading-snug text-[#073763] lg:text-[32px]">
          Pilihan paket kursus
        </h2>

        {/* Cards */}
        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:gap-6">
          {packages.map((pkg) => (
            <a
              key={pkg.title}
              href="/daftar-kursus"
              className="group flex h-auto flex-col rounded-xl border border-[#D6E5F3] bg-white p-6 transition-colors hover:border-[#368DDF] lg:h-[220px]"
            >
              {/* Badge */}
              <span className="inline-flex w-fit items-center rounded-full bg-[#E5F1FC] px-3.5 py-1 text-[11px] font-semibold text-[#1769AA] lg:text-[12px]">
                {pkg.badge}
              </span>

              {/* Judul paket */}
              <h3 className="mt-4 text-[16px] font-semibold text-[#073763]">
                {pkg.title}
              </h3>

              {/* Harga */}
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[27px] font-bold leading-none text-[#1769AA] lg:text-[30px]">
                  {pkg.price}
                </span>
                <span className="text-[12px] font-medium text-[#526B84]">
                  {pkg.unit}
                </span>
              </div>

              {/* Deskripsi */}
              <p className="mt-3 text-[13px] leading-relaxed text-[#526B84] lg:text-[14px]">
                {pkg.description}
              </p>

              {/* CTA */}
              <span className="mt-auto pt-3 text-[12px] font-semibold text-[#1769AA] opacity-0 transition-opacity group-hover:opacity-100">
                Daftar sekarang →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}