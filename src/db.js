import pkg from 'pg';
const { Pool } = pkg;

export const db = new Pool({
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "admin123",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || "finexis",
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
});

export async function createTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        cpf TEXT,
        email TEXT
      );

      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id),
        total_value NUMERIC,
        entry_value NUMERIC,
        installment_quantity INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS installments (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id),
        installment_number INTEGER,
        value NUMERIC,
        due_date DATE,
        paid BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id),
        name TEXT,
        price NUMERIC
      );
    `);

    console.log("📦 Tabelas criadas com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao criar tabelas:", err);
  }
}
