import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhySection from "@/components/WhySection";
import ProgramsSection from "@/components/ProgramsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <Navbar />
      <Hero />
      <WhySection />
      <ProgramsSection />
      <Footer />
    </main>
  );
}
