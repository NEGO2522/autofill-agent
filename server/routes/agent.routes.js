import express from "express";
import { runAgentStream } from "../controllers/agent.controller.js";
import { otpWaiters } from "../services/tinyfish.service.js";

const router = express.Router();

// SSE streaming endpoint  (GET so EventSource can connect natively)
router.get("/run-stream", runAgentStream);

/**
 * GET /api/agent/get-otp?sessionId=xxx
 * Polled by the TinyFish agent while it waits on the OTP screen.
 * First call registers the waiter and notifies the frontend via SSE "otp_required".
 * Subsequent calls while waiting get {waiting:true}.
 * Once user submits OTP via POST /submit-otp, response returns {otp:"<code>"}.
 */
router.get("/get-otp", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  // Check if already resolved (shouldn't happen but guard)
  if (otpWaiters.has(sessionId) && otpWaiters.get(sessionId).resolved) {
    return res.json({ otp: otpWaiters.get(sessionId).resolved });
  }

  // Register the waiter — this is the FIRST time agent calls this endpoint
  // Emit otp_required to the frontend SSE stream via the session's send fn
  const sessionSend = otpWaiters.get(`__send_${sessionId}`);
  if (sessionSend) {
    sessionSend({ event: "otp_required", data: { hint: "The form is asking for an OTP. Enter the code sent to your phone/email.", sessionId } });
  }

  // Wait up to 2 minutes for user to submit OTP
  try {
    const { waitForOtp } = await import("../services/tinyfish.service.js");
    const otp = await waitForOtp(sessionId, 120_000);
    return res.json({ otp });
  } catch {
    return res.json({ waiting: true, error: "timeout" });
  }
});

/**
 * POST /api/agent/submit-otp
 * Called by the frontend when the user types their OTP.
 * Body: { sessionId, otp }
 */
router.post("/submit-otp", (req, res) => {
  const { sessionId, otp } = req.body;
  if (!sessionId || !otp) return res.status(400).json({ error: "sessionId and otp required" });

  const waiter = otpWaiters.get(sessionId);
  if (!waiter) return res.status(404).json({ error: "No active session waiting for OTP" });

  waiter.resolve(otp);
  res.json({ ok: true });
});

export default router;
