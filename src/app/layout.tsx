import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import { getSiteSettings } from "@/lib/settings-db";
import { pickSiteInfo } from "@/lib/settings";
import "./globals.css";

/**
 * Halaman publik selalu dirender saat request.
 *
* Root layout memanggil `getSiteSettings()`, jadi tanpa baris ini Next akan
 * mencoba men-prerender 12 halaman publik saat `next build`, dan build itu
 * wajib connect ke Neon. Dengan Neon mati, belum termigrasi, atau tidak
 * terjangkau dari region build, deploy ikut gagal — padahal tidak ada salahnya
 * dengan kodenya. `force-dynamic` memindahkan query ke runtime, jadi build
 * cukup bebas dari database dan perubahan pengaturan langsung tampil tanpa
 * perlu revalidate manual.
 */
export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: `${settings.businessName} - Belajar Berenang`,
    description:
      "Program renang untuk anak, remaja, dan dewasa. Kolam bersih, jadwal fleksibel, dan metode belajar bertahap sesuai kemampuan masing-masing peserta.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  // Hanya identitas tempat kursus yang masuk ke context. Objek SiteSettings
  // penuh akan ikut ter-serialize ke HTML setiap halaman, termasuk halaman
  // publik, sehingga nomor rekening dan string QRIS bisa dibaca dari source.
  const site = pickSiteInfo(settings);

  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteSettingsProvider value={site}>{children}</SiteSettingsProvider>
      </body>
    </html>
  );
}
