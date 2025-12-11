import pkg from 'pg';
const { Pool } = pkg;

const db = new Pool({
  user: "admin",
  password: "admin123",
  host: "localhost",   // Node está fora do Docker
  port: 5433,          // Porta exposta no docker-compose
  database: "finexis"
});

export default db;
