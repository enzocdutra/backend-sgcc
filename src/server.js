import express from "express";
import cors from "cors";
import saleRoutes from "./routes/sale.routes.js";
import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";

const app = express();

// 🔥 middleware manual — Railway não remove mais seus headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", "https://frontend-sgcc.vercel.app");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  next();
});

// 🔥 CORS oficial
app.use(cors({
  origin: "https://frontend-sgcc.vercel.app",
  credentials: true,
}));

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/clients", clientRoutes);
app.use("/sales", saleRoutes);

// Railway precisa usar a porta do ambiente
app.listen(process.env.PORT || 3001, () => {
  console.log("🔥 Server rodando");
});
