import pkg from "pg";
const { Pool } = pkg;

// Se estiver no Railway, ele fornece DATABASE_URL
const connectionString = process.env.DATABASE_URL;

const db = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: "admin",
        password: "admin123",
        host: "localhost",
        port: 5433,
        database: "finexis",
      }
);

// Criar tabelas ao iniciar
export async function createTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id),
        total_value NUMERIC,
        entry_value NUMERIC,
        installment_quantity INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id),
        name VARCHAR(200),
        price NUMERIC
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS installments (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id),
        installment_number INTEGER,
        value NUMERIC,
        due_date DATE,
        paid BOOLEAN DEFAULT false
      );
    `);

    console.log("✅ Tabelas criadas com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao criar tabelas:", err);
  }
}

export default db;
