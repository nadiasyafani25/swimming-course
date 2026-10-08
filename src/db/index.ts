import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { parseEnv } from "@neon/env";
import config from "../../neon";
import * as schema from "./schema";

const { postgres } = parseEnv(config, ["DATABASE_URL"]);

const sql = neon(postgres.databaseUrl);

export const db = drizzle(sql, { schema });