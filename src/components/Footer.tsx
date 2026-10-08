import { getWhatsAppUrl } from "@/lib/settings";
import { getSiteSettings } from "@/lib/settings-db";

const navLinks = [
  { label: "Tentang", href: "/tentang" },
  { label: "Program", href: "/program" },
  { label: "Jadwal", href: "/jadwal" },
];

const accountLinks = [
  { label: "Login", href: "/login" },
  { label: "Daftar", href: "/daftar" },
  { label: "Bantuan", href: "#" },
];

export default async function Footer() {
  const settings = await getSiteSettings();
  const whatsAppUrl = getWhatsAppUrl(settings.phone);

  return (
    <footer className="w-full bg-background">
      <div className="mx-auto max-w-[1340px] px-5 pt-[52px] lg:px-[50px] lg:pt-[55px]">
        {/* 4 kolom utama */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.4fr] lg:gap-12">
          {/* Kolom 1 - Brand */}
          <div>
            <h3 className="text-[20px] font-bold text-white">
              {settings.businessName}
            </h3>
            <p className="mt-4 max-w-[300px] text-[13px] leading-[1.7] text-[#8FC7F5]">
              Kursus renang profesional berlokasi di {settings.address}.
            </p>
          </div>

          {/* Kolom 2 - Navigasi */}
          <div>
            <h3 className="text-[14px] font-bold text-white">Navigasi</h3>
            <ul className="mt-4 flex flex-col gap-[10px]">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13px] text-[#8FC7F5] transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3 - Akun */}
          <div>
            <h3 className="text-[14px] font-bold text-white">Akun</h3>
            <ul className="mt-4 flex flex-col gap-[10px]">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13px] text-[#8FC7F5] transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

{/* Kolom 4 - Kontak */}
          <div>
            <h3 className="text-[14px] font-bold text-white">Kontak</h3>
            <p className="mt-4 max-w-[300px] text-[13px] leading-[1.7] text-[#8FC7F5]">
              {settings.address}
              <br />
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-white"
              >
                {settings.phone}
              </a>
            </p>
          </div>
        </div>

        {/* Garis pemisah */}
        <div className="mt-[32px] h-px w-full bg-white/15" />

        {/* Bottom footer */}
        <div className="flex flex-col items-center justify-between gap-3 pb-[28px] pt-[22px] sm:flex-row sm:items-center">
          <span className="text-[12px] text-[#8FC7F5] lg:text-[13px]">
            Â© {new Date().getFullYear()} {settings.businessName}
          </span>
          <span className="text-[12px] text-[#8FC7F5] lg:text-[13px]">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              WhatsApp
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}