import express from "express";
import cors from "cors";
import saleRoutes from "./routes/sale.routes.js";
import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";

const app = express();

// Configuração EXTENDIDA do CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://frontend-sgcc.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173"
    ];
    
    // Permitir requisições sem origin (como mobile apps ou curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  exposedHeaders: ['Authorization', 'Content-Length'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar CORS a todas as rotas
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Para preflight requests

app.use(express.json());

// Rotas
app.use("/auth", authRoutes);
app.use("/clients", clientRoutes);
app.use("/sales", saleRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server rodando: http://0.0.0.0:${PORT}`);
  console.log(`🌐 Frontend permitido: https://frontend-sgcc.vercel.app`);
});