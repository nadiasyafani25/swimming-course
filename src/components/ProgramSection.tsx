const packages = [
  {
    badge: "Tanpa batasan peserta",
    title: "Kelas reguler",
    price: "Rp 350rb",
    unit: "/peserta/bulan",
    description:
      "Belajar bersama dalam kelompok besar, jadwal rutin setiap minggu.",
  },
  {
    badge: "2-5 peserta",
    title: "Semi private",
    price: "Rp 1,5jt - 3jt",
    unit: "/bulan",
    description:
      "Kelompok kecil, harga menyesuaikan jumlah peserta dalam kelas.",
  },
  {
    badge: "1 peserta",
    title: "Private",
    price: "Rp 1jt",
    unit: "/peserta/bulan",
    description:
      "Perhatian penuh dari pelatih, jadwal menyesuaikan waktu Anda.",
  },
];

export default function ProgramSection() {
  return (
    <section className="w-full bg-[#F3F8FD]">
      <div className="mx-auto max-w-[1340px] px-5 pb-20 pt-16 lg:px-[50px]">
        {/* Label */}
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#368DDF]">
          Semua Program
        </p>

        {/* Heading */}
        <h1 className="mt-3 text-center text-[22px] font-bold leading-snug text-[#073763] lg:text-[24px]">
          Pilih paket kursus yang sesuai
        </h1>

        {/* Cards */}
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.title}
              className="flex h-auto min-h-[130px] flex-col rounded-lg border border-[#D6E5F3] bg-white p-3.5 lg:h-[127px]"
            >
              {/* Badge */}
              <span className="inline-flex w-fit items-center rounded-full bg-[#E5F1FC] px-2.5 py-1 text-[8px] font-semibold text-[#1769AA]">
                {pkg.badge}
              </span>

              {/* Judul */}
              <h2 className="mt-2 text-[12px] font-bold text-[#073763]">
                {pkg.title}
              </h2>

              {/* Harga */}
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-[17px] font-bold leading-none text-[#1769AA]">
                  {pkg.price}
                </span>
                <span className="text-[8px] text-[#526B84]">{pkg.unit}</span>
              </div>

              {/* Deskripsi */}
              <p className="mt-1.5 text-[9px] leading-[1.5] text-[#526B84]">
                {pkg.description}
              </p>

              {/* Button */}
              <a
                href="/daftar-kursus"
                className="mt-auto flex h-[22px] w-full items-center justify-center rounded border border-[#D6E5F3] bg-[#E5F1FC] text-[9px] font-semibold text-[#1769AA] transition-colors hover:bg-[#d8eaf9]"
              >
                Daftar sekarang
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}