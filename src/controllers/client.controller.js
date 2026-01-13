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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Buscar clientes com paginação
    const result = await db.query(
      `SELECT * FROM clients 
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Contar total de clientes
    const countResult = await db.query(
      "SELECT COUNT(*) as total_count FROM clients"
    );

    const totalItems = parseInt(countResult.rows[0].total_count);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
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
