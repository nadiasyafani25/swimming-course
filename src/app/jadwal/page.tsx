import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ScheduleSection from "@/components/ScheduleSection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Jadwal - SwimmingCourse",
  description:
    "Jadwal mingguan kelas renang di kolam Hotel Pelangi, Tanjungpinang.",
};

export default function SchedulePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar active="jadwal" />
      <ScheduleSection />
      <div className="flex-1" />
      <Footer />
    </main>
  );
}