import express from "express";
import { runAgentStream } from "../controllers/agent.controller.js";

const router = express.Router();

// SSE streaming endpoint  (GET so EventSource can connect natively)
router.get("/run-stream", runAgentStream);

export default router;
