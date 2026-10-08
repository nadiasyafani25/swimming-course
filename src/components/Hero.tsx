import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section id="beranda" className="w-full bg-background">
      <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:px-[60px] lg:py-20">
        {/* Kolom kiri */}
        <div className="flex flex-col">
          {/* Badge lokasi */}
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" fill="currentColor" strokeWidth={0} />
            <span className="text-sm font-medium text-text-secondary sm:text-base">
              Hotel Pelangi, Tanjungpinang
            </span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 max-w-[560px] text-4xl font-bold leading-[1.15] text-white sm:text-5xl lg:text-[52px]">
            Belajar berenang dengan
            <br className="hidden sm:block" /> percaya diri, bersama
            <br className="hidden sm:block" /> pelatih bersertifikat
          </h1>

          {/* Deskripsi */}
          <p className="mb-8 max-w-[480px] text-base leading-relaxed text-text-secondary sm:text-lg">
            Program renang untuk anak, remaja, dan dewasa. Kolam bersih, jadwal
            fleksibel, dan metode belajar bertahap sesuai kemampuan masing-masing
            peserta.
          </p>

          {/* Tombol */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/daftar"
              className="flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary/90 sm:h-[52px]"
            >
              Daftar kursus
            </Link>
            <Link
              href="/program"
              className="flex h-12 items-center gap-2 rounded-lg border border-white px-8 text-base font-medium text-white transition-colors hover:bg-white/10 sm:h-[52px]"
            >
              Lihat program
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Kolom kanan - foto/video card */}
        <div className="flex justify-end">
          <div className="flex h-[360px] w-full items-center justify-center rounded-[20px] border border-white/15 bg-card-bg sm:h-[400px] lg:h-[460px] lg:w-[520px]">
            <span className="px-6 text-center text-lg font-medium text-white/90 sm:text-xl">
              Foto / video kolam renang Hotel Pelangi
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
