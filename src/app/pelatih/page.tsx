import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import CoachSection from "@/components/CoachSection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pelatih - SwimmingCourse",
  description:
    "Dibimbing langsung oleh pelatih renang profesional bersertifikat.",
};

export default function CoachPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar active="pelatih" />
      <CoachSection />
      <div className="flex-1" />
      <Footer />
    </main>
  );
}