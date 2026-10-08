import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ProgramSection from "@/components/ProgramSection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Program - SwimmingCourse",
  description:
    "Pilih paket kursus renang yang sesuai: Kelas reguler, Semi private, atau Private.",
};

export default function ProgramPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar active="program" />
      <ProgramSection />
      <div className="flex-1" />
      <Footer />
    </main>
  );
}