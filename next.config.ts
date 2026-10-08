import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /**
     * Cache filesystem Turbopack untuk `next dev` disimpan di `.next/dev/cache`
     * dan dipakai ulang saat server di-restart. Di proyek ini cache itu sering
     * tertulis/setengah tertulis (`Finished writing to filesystem cache in
     * 11.3s`), dan kalau server dimatikan sebelum selesai, restart berikutnya
     * memuat route tree rusak: `/` masih 200 tapi semua halaman lain dan semua
     * `/api/*` membalas 404.
     *
     * Mematikannya membuat `next dev` selalu memulai dari route tree yang
     * bersih. Startup jadi sedikit lebih lambat, tapi tidak ada lagi 404
     * setelah restart. Cache build (`forBuild`) tetap dipakai.
     */
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
