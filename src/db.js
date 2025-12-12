import pkg from "pg";
const { Pool } = pkg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5433/finexis",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});
