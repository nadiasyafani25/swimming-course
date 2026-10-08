import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !(m[1] in process.env)) {
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const email = (process.argv[2] ?? "demo@swimmingcourse.id").trim().toLowerCase();
const role = (process.argv[3] ?? "admin").trim().toLowerCase();

if (role !== "admin" && role !== "peserta") {
  console.error('Role harus "admin" atau "peserta".');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const existing = await sql`
  select id, email, role from users where lower(email) = ${email} limit 1
`;

if (existing.length === 0) {
  console.error(`User dengan email ${email} tidak ditemukan di database.`);
  console.error("Daftarkan akunnya dulu lewat POST /api/auth/register.");
  process.exit(1);
}

const user = existing[0];

if (user.role === role) {
  console.log(`Sudah berrole ${role}: ${user.email}`);
  process.exit(0);
}

await sql`update users set role = ${role} where id = ${user.id}`;

const after = await sql`select email, role from users where id = ${user.id}`;

console.log(`${after[0].email}: ${user.role} -> ${after[0].role}`);