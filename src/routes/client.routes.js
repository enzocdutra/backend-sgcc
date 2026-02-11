import { Router } from "express";
import { createClient, getClients,getClientById, getClientsForSelect } from "../controllers/client.controller.js";
import auth from "../middlewares/auth.js";

const router = Router();

router.post("/", auth, createClient);
router.get("/", auth, getClients);
router.get("/select", getClientsForSelect)
router.get("/:id", getClientById);
export default router;
