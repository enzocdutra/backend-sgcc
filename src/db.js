import { config } from "dotenv";
import pkg from "pg";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const { Pool } = pkg;

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

export const db = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
});
