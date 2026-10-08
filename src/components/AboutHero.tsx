export default function AboutHero() {
  return (
    <section className="w-full bg-background">
      <div className="mx-auto flex max-w-[1340px] flex-col items-start px-5 py-[60px] lg:px-[50px]">
        {/* Label */}
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8FC7F5]">
          Tentang Kami
        </p>

        {/* Heading */}
        <h1 className="mt-3 text-[28px] font-bold leading-snug text-white lg:text-[32px]">
          Mengenal SwimmingCourse lebih dekat
        </h1>

        {/* Deskripsi */}
        <p className="mt-4 max-w-[560px] text-[13px] leading-[1.6] text-[#8FC7F5] lg:text-[14px]">
          Berdiri di Hotel Pelangi Tanjungpinang, kami membantu ratusan peserta
          belajar berenang dengan aman dan menyenangkan.
        </p>
      </div>
    </section>
  );
}