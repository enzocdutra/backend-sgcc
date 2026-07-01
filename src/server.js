import express from "express";
import cors from "cors";
import saleRoutes from "./routes/sale.routes.js";
import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";

const app = express();

// CORREÇÃO: Adicione 'PATCH' na lista de métodos permitidos
const corsOptions = {
  origin: 'http://localhost:3000', // Seu frontend
  credentials: true, // Permite envio de credenciais
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // ← ADICIONE PATCH AQUI
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Adicione um handler específico para OPTIONS se necessário
app.options('*', cors(corsOptions)); // Isso garante que todas as rotas respondam ao preflight

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/clients", clientRoutes);
app.use("/sales", saleRoutes);

app.listen(3001, () => {
  console.log("🔥 Server running on port 3001");
});