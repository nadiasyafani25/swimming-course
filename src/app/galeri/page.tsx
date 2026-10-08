import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import GallerySection from "@/components/GallerySection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Galeri - SwimmingCourse",
  description:
    "Momen kegiatan di kolam renang SwimmingCourse Hotel Pelangi, Tanjungpinang.",
};

export default function GalleryPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar active="galeri" />
      <GallerySection />
      <div className="flex-1" />
      <Footer />
    </main>
  );
}