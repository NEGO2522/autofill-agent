/**
 * runAgent — connects to the backend SSE stream and calls back with live events.
 *
 * In dev:  /api/agent/run-stream  (Vite proxies → localhost:5000)
 * In prod: VITE_API_URL/api/agent/run-stream  (your Render backend URL)
 */
export const runAgent = (url, profile, { onMessage, onDone, onError }) => {
  const base = import.meta.env.VITE_API_URL || "";

  const params = new URLSearchParams();

  // Add every profile field that has a value
  const fields = [
    "url","name","firstName","lastName","email","phone",
    "dob","gender",
    "address1","address2","city","state","pincode","country","nationality",
    "organization","jobTitle","experience","linkedin","github","website","skills",
    "qualification","fieldOfStudy","university","graduationYear",
    "teamName","teamSize","projectName","projectDescription",
    "bio","message","formContext",
  ];

  params.set("url", url);
  fields.forEach(key => {
    if (key !== "url" && profile[key] !== undefined && profile[key] !== "") {
      params.set(key, profile[key]);
    }
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
