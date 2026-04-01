import crypto from "crypto";
import { streamAgent, otpWaiters, waitForOtp } from "../services/tinyfish.service.js";

/**
 * SSE endpoint — streams TinyFish agent progress to the browser in real time.
 * GET /api/agent/run-stream?url=...&email=...&firstName=...&...
 *
 * Accepts the full profile from the new Form (personal, team, job, social, documents).
 * Also accepts extraFields — a JSON-encoded object of mid-run user-typed values.
 */
export const runAgentStream = async (req, res) => {
  const q = req.query;

  const url = q.url;
  if (!url || !q.email) {
    res.status(400).json({ success: false, message: "Missing required fields: url and email." });
    return;
  }

  // ── SSE headers ──
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const keepAlive = setInterval(() => res.write(": ping\n\n"), 15_000);
  req.on("close", () => clearInterval(keepAlive));

  // Parse any extra mid-run fields the user typed in the UI
  let extraFields = {};
  if (q.extraFields) {
    try { extraFields = JSON.parse(q.extraFields); } catch { /* ignore malformed */ }
  }

  const profile = {
    // Identity
    name:               q.name          || `${q.firstName || ""} ${q.lastName || ""}`.trim(),
    firstName:          q.firstName     || "",
    lastName:           q.lastName      || "",
    email:              q.email         || "",
    phone:              q.phone         || "",
    dob:                q.dob           || "",
    gender:             q.gender        || "",

    // Address
    address1:           q.address1      || "",
    address2:           q.address2      || "",
    city:               q.city          || "",
    state:              q.state         || "",
    pincode:            q.pincode       || "",
    country:            q.country       || "India",
    nationality:        q.nationality   || "Indian",

    // Education
    qualification:      q.qualification   || "",
    fieldOfStudy:       q.fieldOfStudy    || "",
    university:         q.university      || "",
    graduationYear:     q.graduationYear  || "",
    cgpa:               q.cgpa            || "",
    tenthPercent:       q.tenthPercent    || "",
    twelfthPercent:     q.twelfthPercent  || "",

    // Professional / Job
    organization:       q.organization    || "",
    jobTitle:           q.jobTitle        || "",
    experience:         q.experience      || "",
    industry:           q.industry        || "",
    skills:             q.skills          || "",
    ctc:                q.ctc             || "",
    expectedCtc:        q.expectedCtc     || "",
    noticePeriod:       q.noticePeriod    || "",
    certifications:     q.certifications  || "",

    // Social & Links
    linkedin:           q.linkedin        || "",
    github:             q.github          || "",
    portfolio:          q.portfolio       || "",
    twitter:            q.twitter         || "",
    leetcode:           q.leetcode        || "",
    instagram:          q.instagram       || "",

    // Hackathon / Event
    teamName:           q.teamName        || "",
    teamSize:           q.teamSize        || "",
    teamRole:           q.teamRole        || "",
    projectName:        q.projectName     || "",
    projectDescription: q.projectDescription || "",
    techStack:          q.techStack       || q.skills || "",
    githubRepo:         q.githubRepo      || q.github || "",
    demoLink:           q.demoLink        || "",
    achievements:       q.achievements    || "",

    // Documents (URLs stored in Firebase Storage)
    resumeURL:          q.resumeURL       || "",
    collegePhotoURL:    q.collegePhotoURL || "",

    // Bio & Cover letter
    bio:                q.bio             || "",
    whyUs:              q.whyUs           || "",
    strengths:          q.strengths       || "",
    hobbies:            q.hobbies         || "",
    message:            q.message         || "",
    formContext:        q.formContext      || "",
  };

  const otpValue = q.otp || "";
  const sessionId = crypto.randomUUID();

  // Tell the frontend the sessionId so it can submit OTP to the right session
  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  send("session", { sessionId });

  // Store the send function so routes can push otp_required to this SSE stream
  otpWaiters.set(`__send_${sessionId}`, ({ event, data }) => send(event, data));
  req.on("close", () => otpWaiters.delete(`__send_${sessionId}`));

  await streamAgent(url, profile, extraFields, res, otpValue, sessionId);

  otpWaiters.delete(`__send_${sessionId}`);

  clearInterval(keepAlive);
};
