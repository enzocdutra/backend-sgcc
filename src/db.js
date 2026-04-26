import pkg from "pg";
const { Pool } = pkg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:QasCpSsQgrYEfsRmetCraJZHOpQOoQvV@turntable.proxy.rlwy.net:38752/railway",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});
