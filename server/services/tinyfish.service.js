import axios from "axios";

/**
 * Streams TinyFish SSE events directly to the Express response.
 * The client receives real-time progress from the agent.
 *
 * @param {string} url
 * @param {object} profile  { name, email, phone }
 * @param {import("express").Response} res  – must already have SSE headers set
 */
export const streamAgent = async (url, profile, res) => {
  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const response = await axios.post(
      "https://agent.tinyfish.ai/v1/automation/run-sse",
      {
        url,
        goal: `
          Open the page at ${url}.
          Find and fill out every visible input field in the contact/inquiry form using the details below.
          Match fields by their label text (case-insensitive). Fill ALL fields you can find.

          - First Name / Name: ${profile.firstName || profile.name}
          - Last Name: ${profile.lastName || ""}
          - Full Name (if single name field): ${profile.name}
          - Work Email / Email: ${profile.email}
          - Phone / Phone Number / Mobile: ${profile.phone || ""}
          - Company / Organisation / Company Name: ${profile.company || ""}
          - Message / Description / How can we help: ${profile.message || "I am interested in learning more about your services."}

          After filling ALL visible fields:
          1. Check the privacy/terms checkbox if present.
          2. Click the Submit / Send / Send Message button.
          3. Wait for a success confirmation message.
        `.trim(),
      },
      {
        headers: {
          "X-API-Key": process.env.TINYFISH_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "stream",      // stream the response instead of buffering
        timeout: 180_000,            // 3 min max
      }
    );

    let buffer = "";

    response.data.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();          // keep incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const raw = trimmed.replace(/^data:\s*/, "");
        if (raw === "[DONE]") continue;

        try {
          const evt = JSON.parse(raw);
          // Forward every event to the frontend
          send("message", evt);

          // Detect final/done event and close cleanly
          const isDone =
            evt.type === "result" ||
            evt.type === "done" ||
            evt.type === "complete" ||
            evt.type === "finished" ||
            evt.status === "completed" ||
            evt.status === "success" ||
            evt.status === "done" ||
            evt.status === "finished" ||
            evt.finished === true ||
            evt.done === true ||
            (typeof evt.message === "string" && /(success|submitted|done|complet)/i.test(evt.message));

          if (isDone) {
            send("done", { success: true, message: "Form submitted successfully!" });
            res.end();
            return;
          }
        } catch {
          // non-JSON line — forward as plain log
          if (raw) send("log", { message: raw });
        }
      }
    });

    response.data.on("end", () => {
      send("done", { success: true, message: "Agent finished." });
      res.end();
    });

    response.data.on("error", (err) => {
      console.error("TinyFish stream error:", err.message);
      send("error", { message: "Stream error: " + err.message });
      res.end();
    });

  } catch (error) {
    const msg =
      error.response?.data
        ? typeof error.response.data === "string"
          ? error.response.data.slice(0, 400)
          : JSON.stringify(error.response.data).slice(0, 400)
        : error.message;

    console.error("TinyFish Error:", msg);
    send("error", { message: msg });
    res.end();
  }
};
