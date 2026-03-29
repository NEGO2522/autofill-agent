/**
 * runAgent — connects to the backend SSE stream and calls back with live events.
 *
 * In dev:  /api/agent/run-stream  (Vite proxies → localhost:5000)
 * In prod: VITE_API_URL/api/agent/run-stream  (your Render backend URL)
 */
export const runAgent = (url, profile, { onMessage, onDone, onError }) => {
  const base = import.meta.env.VITE_API_URL || "";   // e.g. https://autofill-agent-api.onrender.com

  const params = new URLSearchParams({
    url,
    name:      profile.name,
    firstName: profile.firstName || "",
    lastName:  profile.lastName  || "",
    email:     profile.email,
    phone:     profile.phone   || "",
    company:   profile.company || "",
    message:   profile.message || "",
  });

  const es = new EventSource(`${base}/api/agent/run-stream?${params.toString()}`);

  es.addEventListener("message", (e) => {
    try { onMessage?.(JSON.parse(e.data)); }
    catch { onMessage?.({ message: e.data }); }
  });

  es.addEventListener("log", (e) => {
    try { onMessage?.(JSON.parse(e.data)); }
    catch { onMessage?.({ message: e.data }); }
  });

  es.addEventListener("done", (e) => {
    try { onDone?.(JSON.parse(e.data)); }
    catch { onDone?.({ success: true }); }
    es.close();
  });

  es.addEventListener("error", (e) => {
    try {
      const data = JSON.parse(e.data);
      onError?.(data.message || "Agent error");
    } catch {
      onError?.("Could not connect to agent server. Is it running?");
    }
    es.close();
  });

  return { close: () => es.close() };
};
