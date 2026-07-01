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
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
    const offset = (page - 1) * limit
    const search = String(req.query.search || "").trim()
    const params = []
    const where = []

    if (search) {
      params.push(`%${search}%`)
      where.push(`(
        c.name ILIKE $${params.length} OR
        c.cpf ILIKE $${params.length} OR
        c.phone ILIKE $${params.length} OR
        c.id::text = $${params.length}
      )`)
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

    const clientsQuery = `
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.cpf,
        c.created_at,

        COUNT(i.id) FILTER (WHERE i.paid = false) AS parcelas_pendentes,
        COUNT(i.id) FILTER (WHERE i.paid = false AND i.due_date < NOW()) AS parcelas_atrasadas

      FROM clients c
      LEFT JOIN sales s ON s.client_id = c.id
      LEFT JOIN installments i ON i.sale_id = s.id
      ${whereSql}

      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const totalQuery = `
      SELECT COUNT(*)
      FROM clients c
      ${whereSql}
    `

    const [clientsResult, totalResult] = await Promise.all([
      db.query(clientsQuery, [...params, limit, offset]),
      db.query(totalQuery, params)
    ])

    const total = Number(totalResult.rows[0].count)
    const clients = clientsResult.rows.map(c => ({
      ...c,
      parcelas_pendentes: Number(c.parcelas_pendentes),
      parcelas_atrasadas: Number(c.parcelas_atrasadas),
      em_dia: Number(c.parcelas_atrasadas) === 0
    }))

    res.json({
      data: clients,
      total,
      totalItems: total,
      page,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1
      }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
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

export async function getClientsForSelect(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT id, name
      FROM clients
      ORDER BY name ASC
    `)

    res.json(rows)
  } catch (err) {
    console.error("Erro ao buscar clientes para select:", err)
    res.status(500).json({ error: "Erro ao buscar clientes" })
  }
}
