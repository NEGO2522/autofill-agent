/**
 * runAgent — connects to the backend SSE stream and calls back with live events.
 *
 * In dev:  /api/agent/run-stream  (Vite proxies → localhost:5000)
 * In prod: VITE_API_URL/api/agent/run-stream  (your Render backend URL)
 */
export const runAgent = (url, profile, { onMessage, onDone, onError, onNeedsInput, onSkippedFields, onOtpRequired, onStreamingUrl, onSession }, extraFields = {}) => {
  const base = import.meta.env.VITE_API_URL || "";

  const params = new URLSearchParams();
  params.set("url", url);

  const fields = [
    "name", "firstName", "lastName", "email", "phone", "dob", "gender",
    "address1", "address2", "city", "state", "pincode", "country", "nationality",
    "qualification", "fieldOfStudy", "university", "graduationYear",
    "cgpa", "tenthPercent", "twelfthPercent",
    "organization", "jobTitle", "experience", "industry", "skills",
    "ctc", "expectedCtc", "noticePeriod", "certifications",
    "linkedin", "github", "portfolio", "twitter", "leetcode", "instagram",
    "teamName", "teamSize", "teamRole", "projectName", "projectDescription",
    "techStack", "githubRepo", "demoLink", "achievements",
    "resumeURL", "collegePhotoURL",
    "bio", "whyUs", "strengths", "hobbies", "message", "formContext",
  ];

  fields.forEach(key => {
    if (profile[key] !== undefined && profile[key] !== "") {
      params.set(key, profile[key]);
    }
  });

  // Pass OTP directly as a top-level param so the controller can read it
  if (extraFields?.otp) {
    params.set("otp", extraFields.otp);
  }

  const otherExtras = Object.fromEntries(Object.entries(extraFields || {}).filter(([k]) => k !== "otp"));
  if (Object.keys(otherExtras).length > 0) {
    params.set("extraFields", JSON.stringify(otherExtras));
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

  // Agent found fields it couldn't fill — show them to the user
  es.addEventListener("needs_input", (e) => {
    try { onNeedsInput?.(JSON.parse(e.data)); }
    catch { onNeedsInput?.({ fields: [] }); }
  });

  // Full report of every field the agent skipped (required + optional)
  es.addEventListener("skipped_fields", (e) => {
    try { onSkippedFields?.(JSON.parse(e.data)); }
    catch { onSkippedFields?.({ fields: [] }); }
  });

  // Session ID — needed to submit OTP
  es.addEventListener("session", (e) => {
    try { onSession?.(JSON.parse(e.data)); }
    catch { /* ignore */ }
  });

  // Live browser streaming URL
  es.addEventListener("streaming_url", (e) => {
    try { onStreamingUrl?.(JSON.parse(e.data)); }
    catch { /* ignore */ }
  });

  // OTP / verification code required
  es.addEventListener("otp_required", (e) => {
    try { onOtpRequired?.(JSON.parse(e.data)); }
    catch { onOtpRequired?.({ message: "OTP required", hint: "Please enter the OTP sent to your phone/email." }); }
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
