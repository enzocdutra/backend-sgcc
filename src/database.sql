-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Tabela de vendas
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  total_value NUMERIC(10,2) NOT NULL,
  entry_value NUMERIC(10,2),
  installment_quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de produtos da venda (uma venda pode ter 1 ou mais produtos)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

-- Tabela de parcelas
CREATE TABLE IF NOT EXISTS installments (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP
);
