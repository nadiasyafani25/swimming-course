export default function VisionSection() {
  return (
    <section className="w-full bg-[#F3F8FD]">
      <div className="mx-auto grid max-w-[1340px] items-center gap-10 px-5 py-[55px] lg:grid-cols-2 lg:gap-14 lg:px-[50px] lg:py-[60px]">
        {/* Kiri - foto/fasilitas */}
        <div className="flex h-[140px] w-full items-center justify-center rounded-lg border border-[#D6E5F3] bg-[#2168A8]">
          <span className="text-sm font-medium text-white">
            Foto fasilitas kolam
          </span>
        </div>

        {/* Kanan - visi kami */}
        <div className="flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#368DDF]">
            Visi Kami
          </p>
          <h2 className="mt-3 text-[20px] font-bold leading-snug text-[#073763] lg:text-[22px]">
            Renang sebagai keterampilan hidup
          </h2>
          <p className="mt-4 text-[12px] leading-[1.6] text-[#526B84] lg:text-[13px]">
            Kami percaya kemampuan berenang adalah bekal keselamatan dan
            kesehatan untuk semua usia. Sejak berdiri, SwimmingCourse telah
            melatih peserta anak-anak hingga dewasa dengan metode bertahap dan
            terukur, didampingi pelatih bersertifikat nasional.
          </p>
        </div>
      </div>
    </section>
  );
}