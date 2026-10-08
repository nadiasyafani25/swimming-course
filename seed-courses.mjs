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

/**
 * Nama pelatih yang di-seed ke `courses.coach_name`.
 *
 * diambil dari `COACH_NAME` di .env.local supaya nama aslinya tidak perlu
 * ikut ter-push ke repo. Tanpa variabel itu, seed memakai nama placeholder
 * supaya `npm run db:seed` tetap jalan di mesin mana pun.
 */
const COACH = process.env.COACH_NAME || "Nama Pelatih";

const courses = [
  {
    name: "Kelas reguler",
    slug: "kelas-reguler",
    price: "350000.00",
    sessions: 8,
    capacity: 20,
    capacityLabel: "Tanpa batasan peserta",
    priceLabel: null,
    priceUnit: "/ peserta / bulan",
    ageGroups: "anak-anak,dewasa",
    schedule: [
      [1, "16:00", "17:00"],
      [3, "16:00", "17:00"],
      [5, "16:00", "17:00"],
    ],
  },
  {
    name: "Semi private",
    slug: "semi-private",
    price: "2000000.00",
    sessions: 8,
    capacity: 5,
    capacityLabel: "2-5 peserta",
    // Rentang harga tidak bisa diturunkan dari price_monthly, jadi ditulis
    // eksplisit. Nilai tagihan tetap memakai price_monthly di atas.
    priceLabel: "Rp 1,5jt - 3jt",
    priceUnit: "/ bulan",
    ageGroups: "anak-anak,dewasa",
    schedule: [
      [2, "17:00", "18:00"],
      [4, "17:00", "18:00"],
    ],
  },
  {
    name: "Private",
    slug: "private",
    price: "1000000.00",
    sessions: 8,
    capacity: 1,
    capacityLabel: "1 peserta",
    priceLabel: null,
    priceUnit: "/ peserta / bulan",
    ageGroups: "anak-anak,dewasa",
    schedule: [
      [2, "19:00", "20:00"],
      [4, "19:00", "20:00"],
    ],
  },
];

let created = 0;
let sessionCount = 0;

for (const c of courses) {
  const existing = await run(
    sql`select id from courses where slug = ${c.slug} limit 1`,
  );

  let courseId;
  if (existing.length > 0) {
    courseId = existing[0].id;
    console.log("sudah ada:", c.name);
  } else {
    const inserted = await run(
      sql`insert into courses (name, slug, description, price_monthly, duration_sessions, coach_name)
          values (${c.name}, ${c.slug}, ${"Program " + c.name + " SwimmingCourse"}, ${c.price}, ${c.sessions}, ${COACH})
          returning id`,
    );
    courseId = inserted[0].id;
    created++;
    console.log("dibuat:", c.name);
  }

  // Selalu disinkronkan: kolom label ditambahkan setelah 3 course pertama
  // dibuat, jadi insert saja tidak akan mengisinya.
  await run(
    sql`update courses
        set name = ${c.name},
            capacity_label = ${c.capacityLabel},
            price_label = ${c.priceLabel},
            price_unit = ${c.priceUnit},
            age_groups = ${c.ageGroups}
        where id = ${courseId}`,
  );

  const existingSessions = await run(
    sql`select count(*)::int as n from course_sessions where course_id = ${courseId}`,
  );
  if (existingSessions[0].n === 0) {
    for (const [day, start, end] of c.schedule) {
      await run(
        sql`insert into course_sessions (course_id, coach_name, day_of_week, start_time, end_time, capacity)
            values (${courseId}, ${COACH}, ${day}, ${start}, ${end}, ${c.capacity})`,
      );
      sessionCount++;
    }
  }
}

console.log(`\ncourses baru: ${created}, sessions baru: ${sessionCount}`);

const list = await run(
  sql`select c.name, c.price_monthly, c.capacity_label, c.price_label, c.price_unit, c.age_groups,
      (select count(*)::int from course_sessions s where s.course_id = c.id) as sesi
    from courses c order by c.name`,
);
for (const r of list) {
  console.log(
    `- ${r.name} | ${r.capacity_label} | ${r.price_label ?? "(auto)"} ${r.price_unit} | tagihan Rp ${Number(r.price_monthly).toLocaleString("id-ID")} | ${r.sesi} sesi/minggu | usia: ${r.age_groups}`,
  );
}