import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !(m[1] in process.env)) {
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sql = neon(process.env.DATABASE_URL);
const run = async (q) => {
  const r = await q;
  return Array.isArray(r) ? r : r.rows;
};

// Hanya pelatih yang sungguhan ada. Tambahkan nama lain di sini kalau nanti
// sudah ada rekan yang nyata, bukan placeholder.
//
// Nama diambil dari `COACH_NAME` di .env.local supaya nama aslinya tidak
// ikut ter-push ke repo. Kalau variabel itu kosong, dipakai nama generik.
//
// Jangan isi dengan nama karangan: card "Pelatih aktif" di dashboard admin
// menghitung baris tabel ini, jadi data palsu langsung terlihat di angka itu.
const coaches = [
  {
    name: process.env.COACH_NAME || "Nama Pelatih",
    phone: null,
    email: null,
    certification: "Berlisensi resmi",
    background: "Atlet tingkat kota, provinsi, hingga nasional",
  },
];

let created = 0;

for (const coach of coaches) {
  const existing = await run(sql`
    select id from coaches where name = ${coach.name} limit 1
  `);

  if (existing.length > 0) {
    await run(sql`
      update coaches
      set phone = ${coach.phone},
          email = ${coach.email},
          certification = ${coach.certification},
          background = ${coach.background}
      where id = ${existing[0].id}
    `);
    console.log(`diperbarui: ${coach.name}`);
    continue;
  }

  await run(sql`
    insert into coaches (name, phone, email, certification, background, is_active)
    values (
      ${coach.name},
      ${coach.phone},
      ${coach.email},
      ${coach.certification},
      ${coach.background},
      true
    )
  `);
  created++;
  console.log(`baru: ${coach.name}`);
}

const report = await run(sql`
  select name, phone, certification, background, is_active from coaches order by name
`);

console.log(`\npelatih baru: ${created}`);
console.table(report);