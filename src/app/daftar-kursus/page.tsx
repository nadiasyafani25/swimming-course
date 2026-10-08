import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import CourseRegistrationForm from "@/components/CourseRegistrationForm";
import Footer from "@/components/Footer";
import { listCourseOptions } from "@/admin/data";
import { Waves, Calendar, Users, Medal } from "lucide-react";

export const metadata: Metadata = {
  title: "Daftar Kursus - SwimmingCourse",
  description:
    "Daftar kursus renang SwimmingCourse di Hotel Pelangi, Tanjungpinang. Pilih kelas reguler, semi private, atau private.",
};

const highlights = [
  {
    icon: Waves,
    title: "Kolam bersih",
    description: "Air dipantau rutin, aman untuk semua usia.",
  },
  {
    icon: Calendar,
    title: "Jadwal fleksibel",
    description: "Sesi tersedia setiap hari, 07.00 - 21.00.",
  },
  {
    icon: Users,
    title: "Pelatih berpengalaman",
    description: "Metode bertahap sesuai kemampuan peserta.",
  },
  {
    icon: Medal,
    title: "Semua level",
    description: "Pemula hingga mahir, anak sampai dewasa.",
  },
];

export default async function RegistrationPage() {
  const programs = await listCourseOptions();

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar active="program" />
      <div className="w-full bg-[#F3F8FD]">
        <div className="mx-auto grid max-w-[1030px] gap-[18px] px-5 pb-24 pt-10 lg:grid-cols-2 lg:pt-14">
          {/* Kiri - informasi */}
          <div className="flex flex-col">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#368DDF]">
              Pendaftaran Kursus
            </p>
            <h1 className="mt-3 text-[22px] font-bold leading-snug text-[#073763]">
              Daftar kursus renang
            </h1>
            <p className="mt-3 text-[12px] leading-relaxed text-[#526B84]">
              Isi formulir di samping untuk mendaftar. Tim kami akan menghubungi
              Anda untuk konfirmasi jadwal dan pembayaran. Belajar berenang di
              Hotel Pelangi, Tanjungpinang.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E5F1FC]">
                    <item.icon className="h-4 w-4 text-[#1769AA]" />
                  </span>
                  <div>
                    <h3 className="text-[12px] font-bold text-[#073763]">
                      {item.title}
                    </h3>
                    <p className="text-[11px] leading-relaxed text-[#526B84]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kanan - form */}
          <CourseRegistrationForm programs={programs} />
        </div>
      </div>
      <div className="flex-1" />
      <Footer />
    </main>
  );
}
