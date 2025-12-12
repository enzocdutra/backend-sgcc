import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Carrega variáveis de ambiente
dotenv.config();

// Importações de rotas (VERIFIQUE se os arquivos existem!)
import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";
import saleRoutes from "./routes/sale.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// 🔥 CORS CONFIGURADO CORRETAMENTE
const corsOptions = {
  origin: [
    "https://frontend-sgcc.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Para requisições OPTIONS (preflight)
app.options("*", cors(corsOptions));

// Middleware para parsing JSON
app.use(express.json());

// Rota de teste básica (IMPORTANTE!)
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend SGCC API",
    status: "online",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// Rota de health check para Railway
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// 🔥 VERIFIQUE SE SUAS ROTAS EXISTEM antes de usar
try {
  // Teste se os arquivos de rotas existem
  app.use("/auth", authRoutes);
  app.use("/clients", clientRoutes);
  app.use("/sales", saleRoutes);
  console.log("✅ Rotas carregadas com sucesso");
} catch (error) {
  console.error("❌ Erro ao carregar rotas:", error);
  // Rotas de fallback se as principais falharem
  app.use("/auth", (req, res) => res.status(501).json({ error: "Auth routes not available" }));
  app.use("/clients", (req, res) => res.status(501).json({ error: "Client routes not available" }));
  app.use("/sales", (req, res) => res.status(501).json({ error: "Sales routes not available" }));
}

// Rota de fallback para 404
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path,
    method: req.method 
  });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message
  });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌐 CORS enabled for: https://frontend-sgcc.vercel.app`);
});