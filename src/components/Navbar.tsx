"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Waves } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const navLinks = [
  { label: "Beranda", href: "/", key: "beranda" },
  { label: "Tentang", href: "/tentang", key: "tentang" },
  { label: "Program", href: "/program", key: "program" },
  { label: "Jadwal", href: "/jadwal", key: "jadwal" },
  { label: "Pelatih", href: "/pelatih", key: "pelatih" },
  { label: "Galeri", href: "/galeri", key: "galeri" },
  { label: "Kontak", href: "/kontak", key: "kontak" },
];

type NavbarProps = {
  active?: string;
};

export default function Navbar({ active = "beranda" }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { businessName } = useSiteSettings();

  return (
    <nav className="w-full bg-background">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-[60px]">
        {/* Logo kiri */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Waves className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-white lg:text-xl">
            {businessName}
          </span>
        </Link>

        {/* Navigation tengah - desktop */}
        <ul className="hidden items-center gap-8 xl:flex">
          {navLinks.map((link) => (
            <li key={link.key} className="relative flex items-center">
              <Link
                href={link.href}
                className={`py-2 text-[15px] font-medium transition-colors hover:text-white ${
                  active === link.key ? "text-white" : "text-text-secondary/90"
                }`}
              >
                {link.label}
              </Link>
              {active === link.key && (
                <span className="absolute -bottom-[22px] left-0 right-0 h-[3px] rounded-full bg-primary" />
              )}
            </li>
          ))}
        </ul>

        {/* Buttons kanan - desktop */}
        <div className="hidden items-center gap-4 xl:flex">
          <Link
            href="/login"
            className="flex h-11 items-center rounded-lg border border-white/30 px-6 text-[15px] font-medium text-white transition-colors hover:border-white hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/daftar"
            className="flex h-11 items-center rounded-lg bg-primary px-6 text-[15px] font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Daftar
          </Link>
        </div>

        {/* Hamburger - mobile */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white xl:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-white/10 bg-[#062c4e] xl:hidden">
          <ul className="flex flex-col px-6 py-4">
            {navLinks.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block border-b border-white/5 py-3 text-[15px] font-medium ${
                    active === link.key ? "text-white" : "text-text-secondary/90"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <div className="mt-4 flex flex-col gap-3 pb-2">
              <Link
                href="/login"
                className="flex h-11 items-center justify-center rounded-lg border border-white/30 px-6 text-[15px] font-medium text-white"
              >
                Login
              </Link>
              <Link
                href="/daftar"
                className="flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-[15px] font-semibold text-white"
              >
                Daftar
              </Link>
            </div>
          </ul>
        </div>
      )}
    </nav>
  );
}