/**
 * runAgent — connects to the backend SSE stream and calls back with live events.
 *
 * In dev:  /api/agent/run-stream  (Vite proxies → localhost:5000)
 * In prod: VITE_API_URL/api/agent/run-stream  (your Render backend URL)
 */
export const runAgent = (url, profile, { onMessage, onDone, onError, onNeedsInput }, extraFields = {}) => {
  const base = import.meta.env.VITE_API_URL || "";

  const params = new URLSearchParams();
  params.set("url", url);

  // All profile fields
  const fields = [
    // Identity
    "name", "firstName", "lastName", "email", "phone", "dob", "gender",
    // Address
    "address1", "address2", "city", "state", "pincode", "country", "nationality",
    // Education
    "qualification", "fieldOfStudy", "university", "graduationYear",
    "cgpa", "tenthPercent", "twelfthPercent",
    // Professional / Job
    "organization", "jobTitle", "experience", "industry", "skills",
    "ctc", "expectedCtc", "noticePeriod", "certifications",
    // Social
    "linkedin", "github", "portfolio", "twitter", "leetcode", "instagram",
    // Hackathon / Event
    "teamName", "teamSize", "teamRole", "projectName", "projectDescription",
    "techStack", "githubRepo", "demoLink", "achievements",
    // Documents
    "resumeURL", "collegePhotoURL",
    // Bio & extra
    "bio", "whyUs", "strengths", "hobbies", "message", "formContext",
  ];

  fields.forEach(key => {
    if (profile[key] !== undefined && profile[key] !== "") {
      params.set(key, profile[key]);
    }
  });

  // Inject any mid-run extra fields from the UI
  if (extraFields && Object.keys(extraFields).length > 0) {
    params.set("extraFields", JSON.stringify(extraFields));
  }

  const es = new EventSource(`${base}/api/agent/run-stream?${params.toString()}`);

  es.addEventListener("message", (e) => {
    try { onMessage?.(JSON.parse(e.data)); }
    catch { onMessage?.({ message: e.data }); }
  });

  es.addEventListener("log", (e) => {
    try { onMessage?.(JSON.parse(e.data)); }
    catch { onMessage?.({ message: e.data }); }
  });

  es.addEventListener("needs_input", (e) => {
    try { onNeedsInput?.(JSON.parse(e.data)); }
    catch { onNeedsInput?.({ fields: [] }); }
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
