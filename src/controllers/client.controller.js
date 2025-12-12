import { db } from "../db.js";


export async function createClient(req, res) {
  try {
    const { name, phone, cpf } = req.body;

    const result = await db.query(
      "INSERT INTO clients (name, phone, cpf, created_at) VALUES ($1,$2,$3,NOW()) RETURNING id",
      [name, phone, cpf]
    );

    res.json({ message: "Client created", clientId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getClients(req, res) {
  try {
    const result = await db.query(
      "SELECT * FROM clients ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 🚀 NOVO — buscar cliente pelo ID
export async function getClientById(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(
      "SELECT * FROM clients WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
