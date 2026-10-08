import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AboutHero from "@/components/AboutHero";
import VisionSection from "@/components/VisionSection";
import StatsSection from "@/components/StatsSection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tentang Kami - SwimmingCourse",
  description:
    "Mengenal SwimmingCourse lebih dekat - kursus renang di Hotel Pelangi Tanjungpinang.",
};

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <Navbar active="tentang" />
      <AboutHero />
      <VisionSection />
      <StatsSection />
      <Footer />
    </main>
  );
}