import { streamAgent } from "../services/tinyfish.service.js";

/**
 * SSE endpoint — streams TinyFish agent progress to the browser in real time.
 * GET  /api/agent/run-stream?url=...&name=...&email=...&phone=...
 */
export const runAgentStream = async (req, res) => {
  const { url, name, firstName, lastName, email, phone, company, message } = req.query;

  if (!url || !(firstName || name) || !email) {
    res.status(400).json({ success: false, message: "Missing url, name, or email." });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");   // disable nginx buffering if present
  res.flushHeaders();

  // Keep-alive ping every 15 s so the connection doesn't time out
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 15_000);

  req.on("close", () => clearInterval(keepAlive));

  await streamAgent(url, {
    name:      name || `${firstName || ""} ${lastName || ""}`.trim(),
    firstName: firstName || "",
    lastName:  lastName  || "",
    email,
    phone:   phone   || "",
    company: company || "",
    message: message || "",
  }, res);
  clearInterval(keepAlive);
};
