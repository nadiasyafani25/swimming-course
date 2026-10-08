# SwimmingCourse

Website kursus renang untuk anak, remaja, dan dewasa. Kolam bersih, jadwal
fleksibel, dan metode belajar bertahap sesuai kemampuan masing-masing peserta.

Dibangun dengan Next.js (App Router) + Neon Postgres, tanpa framework auth
eksternal: kata sandi di-hash dengan `scrypt` dan sesi disimpan sendiri di
database.

## Fitur

**Situs publik**

- Landing page (`/`) dengan hero, statistik, program, jadwal, galeri, dan kontak
- Katalog program (`/program`) dan daftar kursus (`/daftar-kursus`)
- Formulir pendaftaran program (`/daftar`) dan form kontak (`/kontak`)
- Profil pelatih (`/pelatih`), jadwal mingguan (`/jadwal`), galeri (`/galeri`)

**Dashboard peserta** (`/dashboard`)

- Ringkasan: jumlah kelas, sesi minggu ini, progres, tagihan berikutnya
- Progres-absensi per kelas
- Jadwal sesi berikutnya
- Tagihan bulanan + unggah bukti bayar (QRIS atau transfer bank)
- Katalog kelas + pendaftaran kelas langsung
- Unduh sertifikat yang sudah diterbitkan
- Ubah profil dan kata sandi

**Panel admin** (`/admin`)

- Dashboard: ringkasan pendaftaran, peserta, pembayaran, pelatih
- Pendaftaran: tampilan pendaftaran terbaru dari form publik
- Peserta: tambah, ubah, arsipkan (nonaktifkan tanpa menghapus riwayat)
- Pembayaran: verifikasi bukti bayar (setujui / tolak)
- Paket: CRUD paket kursus (kelas reguler, semi private, private)
- Jadwal: CRUD sesi mingguan per kelas
- Pelatih: CRUD data pelatih
- Sertifikat: terbitkan sertifikat untuk peserta
- Laporan: grafik pendapatan
- Pengaturan: nama usaha, alamat, nomor telepon, konfigurasi QRIS dan bank

## Stack

| Layer | Teknologi |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Database | Neon Postgres + Drizzle ORM |
| Auth | `node:crypto` scrypt + cookie sesi sendiri |
| Grafik | Chart.js (`react-chartjs-2` style, via `chart.js`) |
| Sertifikat | jsPDF + html-to-image |
| QRIS | react-qr-code |
| Ikon | lucide-react |

Tidak ada dependency auth pihak ketiga. Tabel `users` dan `sessions` dikelola
sendiri, cookie sesi bernama `sc_session` dengan masa berlaku 7 hari.

## Prasyarat

- **Node.js 22** (dibangun dan diuji di v22.20.0)
- Akun [Neon](https://neon.tech) dengan database Postgres
- Akun admin: Registration di `/daftar` selalu menghasilkan role `peserta`.
  Setelah daftar, jadikan admin lewat script `admin:promote` (lihat di bawah).

## Setup

```bash
git clone https://github.com/nadiasyafani25/swimming-course.git
cd swimming-course
npm install
```

Buat file environment:

```bash
cp .env.example .env.local
```

Isi `DATABASE_URL` dan `DATABASE_URL_UNPOOLED` dengan nilai dari
**Neon Dashboard → Connection Strings**:

| Variabel | Sumber | Dipakai oleh |
| --- | --- | --- |
| `DATABASE_URL` | Connection string **pooled** | aplikasi saat runtime (`src/db/index.ts`) |
| `DATABASE_URL_UNPOOLED` | Connection string **direct** | drizzle-kit dan script seed |
| `COACH_NAME` | bebas | nama pelatih yang di-seed ke database |
| `NEON_BRANCH` | opsional | hanya untuk Neon CLI |

`DATABASE_URL_UNPOOLED` boleh dikosongkan — `drizzle.config.ts` akan jatuh ke
`DATABASE_URL`.

Buat tabel di database, lalu isi data awal:

```bash
npm run db:push     # sinkronkan schema ke database
npm run db:seed     # isi paket kelas (kelas reguler, semi private, private)
node seed-coaches.mjs   # isi data pelatih
```

Jadikan akun Anda admin:

```bash
npm run admin:promote -- "email@anda.com" admin
```

Jalankan server pengembangan:

```bash
npm run dev
```

Buka <http://localhost:3000>. Portnya dikunci di `3000`; kalau portnya sudah
dipakai, proses berhenti dengan pesan `EADDRINUSE` alih-alih pindah port diam-diam.

## Scripts

| Script | Fungsi |
| --- | --- |
| `npm run dev` | server pengembangan di port 3000 |
| `npm run build` | build produksi |
| `npm start` | jalankan build produksi di port 3000 |
| `npm run lint` | ESLint |
| `npm run db:push` | sinkronkan schema Drizzle ke database |
| `npm run db:generate` | buat file migrasi baru dari perubahan schema |
| `npm run db:seed` | isi data paket kelas |
| `npm run admin:promote -- <email> <role>` | ubah role user (`admin` / `peserta`) |

Tidak ada script untuk `seed-coaches.mjs` — jalankan manual dengan `node
seed-coaches.mjs`.

## Struktur folder

```
src/
├── app/                  # halaman & route handler (App Router)
│   ├── admin/            # panel admin
│   ├── dashboard/        # dashboard peserta
│   └── api/              # route handler
├── admin/                # komponen & query khusus panel admin
├── components/           # komponen yang dipakai bersama
├── db/
│   ├── schema.ts         # definisi tabel Drizzle
│   └── index.ts          # koneksi Neon
└── lib/                  # session, password, validasi, helper waktu
drizzle/                  # hasil migrasi SQL yang di-commit
prototype/                # mockup HTML (tidak ikut repo)
```

## Catatan keamanan

- `.env.local` tidak pernah ter-commit — pola `.env*` ada di `.gitignore`
- Kata sandi disimpan sebagai `scrypt$<N>$<salt>$<hash>`, diverifikasi dengan
  `timingSafeEqual`
- Kolom `password_hash` tidak pernah dikirim ke client
- Sesi diarsipkan dengan menghapus baris, bukan mengubah role, supaya
  enrollment, pembayaran, absensi, dan sertifikat peserta tetap utuh

## Deploy

Siap untuk Vercel. Tambahkan environment variable berikut di project settings:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED` (kalau `npm run db:push` dijalankan dari luar)
