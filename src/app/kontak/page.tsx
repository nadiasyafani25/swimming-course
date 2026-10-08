import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kontak - SwimmingCourse",
  description:
    "Hubungi SwimmingCourse untuk informasi kursus renang di Hotel Pelangi, Tanjungpinang.",
};

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar active="kontak" />
      <ContactSection />
      <div className="flex-1" />
      <Footer />
    </main>
  );
}