import { Router } from "express";
import {
  createSale,
  listSales,
  getSaleById,
  listSalesByClient,
  listInstallmentsByClient,
  markInstallmentPaid,
  dashboardStats
} from "../controllers/sale.controller.js";

const router = Router();
router.post("/", createSale);
router.get("/", listSales);

// rotas específicas SEMPRE antes das genéricas
router.get("/client/:clientId", listSalesByClient);
router.get("/installments/client/:clientId", listInstallmentsByClient);

router.patch("/installment/:id/pay", markInstallmentPaid);
router.get("/dashboard/stats", dashboardStats);

// rota genérica por último
router.get("/:id", getSaleById);


export default router;
