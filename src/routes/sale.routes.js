import { Router } from "express";
import {
  createSale,
  listSales,
  getSaleById,
  listSalesByClient,
  listInstallmentsByClient,
  markInstallmentPaid,
  updateSale,
  deleteSale,
  dashboardStats
} from "../controllers/sale.controller.js";

const router = Router();

router.post("/", createSale);
router.get("/", listSales);

// ⚠️ rotas específicas primeiro
router.get("/client/:clientId", listSalesByClient);
router.get("/installments/client/:clientId", listInstallmentsByClient);
router.get("/dashboard/stats", dashboardStats);

router.patch("/installment/:id/pay", markInstallmentPaid);

// CRUD completo
router.put("/:id", updateSale);
router.delete("/:id", deleteSale);

// genérica por último
router.get("/:id", getSaleById);

export default router;
