import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import agentRoutes from "./routes/agent.routes.js";

dotenv.config();

const app = express();

// Allow local dev + any Vercel deployment of this project
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,          // set this in Render dashboard
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, Postman) or matching origins
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Accept"],
  credentials: true,
}));

app.options("*", cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));
app.use("/api/agent", agentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
