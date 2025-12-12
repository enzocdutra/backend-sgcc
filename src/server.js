import express from "express";
import cors from "cors";
import saleRoutes from "./routes/sale.routes.js";
import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";

const app = express();

const FRONTEND_URL = "https://frontend-sgcc.vercel.app";

// 🔥 CORS correto e completo
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 🔥 Resposta ao preflight (IMPORTANTE!)
app.options("*", cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

// Rotas
app.use("/auth", authRoutes);
app.use("/clients", clientRoutes);
app.use("/sales", saleRoutes);

// Porta do Railway
app.listen(process.env.PORT || 3001, () => {
  console.log("🔥 Server rodando");
});
