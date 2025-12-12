import express from "express";
import cors from "cors";
import saleRoutes from "./routes/sale.routes.js";
import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";
import { createTables } from "./db.js";   // <- IMPORTAÇÃO CORRETA

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/clients", clientRoutes);
app.use("/sales", saleRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🔥 Server rodando na porta ${PORT}`);

  // Criar tabelas ao iniciar
  await createTables();
});
