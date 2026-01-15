import { db } from "../db.js";

/* =============================================================
   CRIAR VENDA (CARNÊ)
============================================================= */
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
    const baseDate = first_due_date ? new Date(first_due_date) : new Date();

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
    console.error(err);
    res.status(500).json({ error: "Erro ao criar venda" });
  }
};

/* =============================================================
   LISTAR TODAS AS VENDAS
============================================================= */
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


/* =============================================================
   BUSCAR VENDA COMPLETA POR ID
============================================================= */
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
      `SELECT *,
        due_date < CURRENT_DATE AND paid = false AS overdue
       FROM installments
       WHERE sale_id = $1
       ORDER BY installment_number`,
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

/* =============================================================
   LISTAR VENDAS POR CLIENTE
============================================================= */
export const listSalesByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    const result = await db.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM installments WHERE sale_id = s.id) AS total_installments
      FROM sales s
      WHERE s.client_id = $1
      ORDER BY s.created_at DESC
    `, [clientId]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar vendas do cliente" });
  }
};

/* =============================================================
   LISTAR PARCELAS POR CLIENTE
============================================================= */
export const listInstallmentsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    const result = await db.query(`
      SELECT i.*, 
        i.due_date < CURRENT_DATE AND i.paid = false AS overdue
      FROM installments i
      JOIN sales s ON s.id = i.sale_id
      WHERE s.client_id = $1
      ORDER BY i.due_date
    `, [clientId]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar parcelas do cliente" });
  }
};

/* =============================================================
   MARCAR PARCELA COMO PAGA
============================================================= */
export const markInstallmentPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE installments
       SET paid = true, paid_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Parcela não encontrada" });
    }

    res.json({ message: "Parcela marcada como paga" });
  } catch (err) {
    console.error("🔥 ERRO AO MARCAR PARCELA COMO PAGA");
    console.error(err);              // ← ISSO É O MAIS IMPORTANTE
    console.error(err.stack);        // ← Railway mostra isso nos logs

    res.status(500).json({
      error: "Erro ao atualizar parcela",
      detail: err.message
    });
  }
};
;

/* =============================================================
   EDITAR CARNÊ
============================================================= */
export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      products,
      total_value,
      entry_value = 0,
      installment_quantity,
      first_due_date
    } = req.body;

    const paid = await db.query(
      `SELECT 1 FROM installments WHERE sale_id = $1 AND paid = true LIMIT 1`,
      [id]
    );

    if (paid.rows.length > 0) {
      return res.status(400).json({
        error: "Não é possível editar carnê com parcelas pagas"
      });
    }

    await db.query(
      `UPDATE sales
       SET total_value = $1,
           entry_value = $2,
           installment_quantity = $3
       WHERE id = $4`,
      [total_value, entry_value, installment_quantity, id]
    );

    await db.query(`DELETE FROM products WHERE sale_id = $1`, [id]);
    await db.query(`DELETE FROM installments WHERE sale_id = $1`, [id]);

    for (const product of products) {
      await db.query(
        `INSERT INTO products (sale_id, name, price)
         VALUES ($1, $2, $3)`,
        [id, product.name, product.price]
      );
    }

    const remaining = total_value - entry_value;
    const installmentValue = Number((remaining / installment_quantity).toFixed(2));
    const baseDate = first_due_date ? new Date(first_due_date) : new Date();

    for (let i = 1; i <= installment_quantity; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      await db.query(
        `INSERT INTO installments (sale_id, installment_number, value, due_date)
         VALUES ($1, $2, $3, $4)`,
        [id, i, installmentValue, dueDate]
      );
    }

    res.json({ message: "Carnê atualizado com sucesso" });

  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar carnê" });
  }
};

/* =============================================================
   EXCLUIR CARNÊ
============================================================= */
export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const paid = await db.query(
      `SELECT 1 FROM installments WHERE sale_id = $1 AND paid = true LIMIT 1`,
      [id]
    );

    if (paid.rows.length > 0) {
      return res.status(400).json({
        error: "Não é possível excluir carnê com parcelas pagas"
      });
    }

    await db.query(`DELETE FROM installments WHERE sale_id = $1`, [id]);
    await db.query(`DELETE FROM products WHERE sale_id = $1`, [id]);
    await db.query(`DELETE FROM sales WHERE id = $1`, [id]);

    res.json({ message: "Carnê excluído com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir carnê" });
  }
};

/* =============================================================
   DASHBOARD
============================================================= */
export const dashboardStats = async (req, res) => {
  try {
    const overdue = await db.query(`
      SELECT COUNT(*) FROM installments
      WHERE paid = false AND due_date < CURRENT_DATE
    `);

    const monthlySales = await db.query(`
      SELECT COUNT(*) FROM sales
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    const received = await db.query(`
      SELECT COALESCE(SUM(value),0) AS total
      FROM installments
      WHERE paid = true
      AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    res.json({
      overdue_installments: overdue.rows[0].count,
      monthly_sales: monthlySales.rows[0].count,
      monthly_received: received.rows[0].total
    });

  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar dashboard" });
  }
};
