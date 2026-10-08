-- `settings` sengaja tidak dicreate di sini. Tabel itu sudah ada di database
-- (dibuat lewat `drizzle-kit push` pada 0010 dan tidak pernah masuk journal),
-- jadi drizzle-kit generate menambahkannya sebagai CREATE TABLE yang akan
-- gagal waktu dijalankan.
ALTER TABLE "payments" ADD COLUMN "method" varchar(20) DEFAULT 'qris' NOT NULL;