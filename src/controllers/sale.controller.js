import db from "../db.js";

// -------------------------------------------------------------
// Criar venda + produtos + parcelas
// -------------------------------------------------------------
export const createSale = async (req, res) => {
  try {
    const {
      client_id,
      products,
      total_value,
      entry_value = 0,
      installment_quantity,
      first_due_date
    } = req.body;

    if (!client_id || !products?.length || !total_value || !installment_quantity) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const saleResult = await db.query(
      `INSERT INTO sales (client_id, total_value, entry_value, installment_quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [client_id, total_value, entry_value, installment_quantity]
    );

    const saleId = saleResult.rows[0].id;

    for (const product of products) {
      await db.query(
        `INSERT INTO products (sale_id, name, price)
         VALUES ($1, $2, $3)`,
        [saleId, product.name, product.price]
      );
    }

    const remaining = total_value - entry_value;
    const installmentValue = Number((remaining / installment_quantity).toFixed(2));

    let baseDate = first_due_date ? new Date(first_due_date) : new Date();

    for (let i = 1; i <= installment_quantity; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      await db.query(
        `INSERT INTO installments (sale_id, installment_number, value, due_date)
         VALUES ($1, $2, $3, $4)`,
        [saleId, i, installmentValue, dueDate]
      );
    }

    res.status(201).json({ message: "Venda criada com sucesso", sale_id: saleId });

  } catch (err) {
    console.error("Erro ao criar venda:", err);
    res.status(500).json({ error: "Erro ao criar venda" });
  }
};

// -------------------------------------------------------------
// Listar todas as vendas
// -------------------------------------------------------------
export const listSales = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, c.name AS client_name
      FROM sales s
      JOIN clients c ON c.id = s.client_id
      ORDER BY s.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar vendas" });
  }
};

// -------------------------------------------------------------
// Pegar venda completa pelo ID
// -------------------------------------------------------------
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await db.query(`
      SELECT s.*, c.name AS client_name, c.cpf, c.phone
      FROM sales s
      JOIN clients c ON c.id = s.client_id
      WHERE s.id = $1
    `, [id]);

    if (sale.rows.length === 0) {
      return res.status(404).json({ error: "Venda não encontrada" });
    }

    const products = await db.query(
      `SELECT * FROM products WHERE sale_id = $1`,
      [id]
    );

    const installments = await db.query(
      `SELECT * FROM installments WHERE sale_id = $1 ORDER BY installment_number ASC`,
      [id]
    );

    res.json({
      sale: sale.rows[0],
      products: products.rows,
      installments: installments.rows
    });

  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar venda" });
  }
};

// -------------------------------------------------------------
// 🍀 NOVO → Listar vendas por cliente
// -------------------------------------------------------------
export const listSalesByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    const result = await db.query(`
      SELECT s.*, 
             (SELECT SUM(price) FROM products WHERE sale_id = s.id) AS total_products,
             (SELECT COUNT(*) FROM installments WHERE sale_id = s.id) AS total_installments
      FROM sales s
      WHERE s.client_id = $1
      ORDER BY s.created_at DESC
    `, [clientId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar vendas do cliente" });
  }
};

// -------------------------------------------------------------
// 🍀 NOVO → Listar parcelas por cliente
// -------------------------------------------------------------
export const listInstallmentsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    const result = await db.query(`
      SELECT i.*, s.client_id,
        i.due_date < CURRENT_DATE AND i.paid = false AS overdue
      FROM installments i
      JOIN sales s ON s.id = i.sale_id
      WHERE s.client_id = $1
      ORDER BY i.due_date ASC
    `, [clientId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar parcelas do cliente" });
  }
};

// -------------------------------------------------------------
// Marcar parcela como paga
// -------------------------------------------------------------
export const markInstallmentPaid = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE installments
       SET paid = true, paid_at = NOW()
       WHERE id = $1`,
      [id]
    );

    res.json({ message: "Parcela marcada como paga" });

  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar parcela" });
  }
};

// -------------------------------------------------------------
// Dashboard
// -------------------------------------------------------------
export const dashboardStats = async (req, res) => {
  try {
    const stats = {};

    const overdue = await db.query(`
      SELECT COUNT(*) FROM installments
      WHERE paid = false AND due_date < CURRENT_DATE
    `);
    stats.overdue_installments = overdue.rows[0].count;

    const monthlySales = await db.query(`
      SELECT COUNT(*) FROM sales
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    stats.monthly_sales = monthlySales.rows[0].count;

    const totalReceived = await db.query(`
      SELECT COALESCE(SUM(value), 0) AS total
      FROM installments
      WHERE paid = true
      AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    stats.monthly_received = totalReceived.rows[0].total;

    res.json(stats);

  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar painel" });
  }
};
