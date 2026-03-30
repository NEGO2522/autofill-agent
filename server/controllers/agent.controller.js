import { streamAgent } from "../services/tinyfish.service.js";

/**
 * SSE endpoint — streams TinyFish agent progress to the browser in real time.
 * Accepts a universal profile that works for any form type.
 * GET /api/agent/run-stream?url=...&email=...&firstName=...&...
 */
export const runAgentStream = async (req, res) => {
  const {
    url,
    // Basic identity
    name, firstName, lastName, email, phone,
    dob, gender,
    // Address
    address1, address2, city, state, pincode, country, nationality,
    // Professional
    organization, jobTitle, experience,
    linkedin, github, website, skills,
    // Education
    qualification, fieldOfStudy, university, graduationYear,
    // Event / Hackathon
    teamName, teamSize, projectName, projectDescription,
    // General
    bio, message, formContext,
  } = req.query;

  if (!url || !email) {
    res.status(400).json({ success: false, message: "Missing required fields: url and email." });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const keepAlive = setInterval(() => res.write(": ping\n\n"), 15_000);
  req.on("close", () => clearInterval(keepAlive));

  await streamAgent(url, {
    name:              name || `${firstName || ""} ${lastName || ""}`.trim(),
    firstName:         firstName || "",
    lastName:          lastName  || "",
    email,
    phone:             phone      || "",
    dob:               dob        || "",
    gender:            gender     || "",
    address1:          address1   || "",
    address2:          address2   || "",
    city:              city       || "",
    state:             state      || "",
    pincode:           pincode    || "",
    country:           country    || "India",
    nationality:       nationality|| "Indian",
    organization:      organization   || "",
    jobTitle:          jobTitle       || "",
    experience:        experience     || "",
    linkedin:          linkedin       || "",
    github:            github         || "",
    website:           website        || "",
    skills:            skills         || "",
    qualification:     qualification  || "",
    fieldOfStudy:      fieldOfStudy   || "",
    university:        university     || "",
    graduationYear:    graduationYear || "",
    teamName:          teamName       || "",
    teamSize:          teamSize       || "",
    projectName:       projectName    || "",
    projectDescription:projectDescription || "",
    bio:               bio     || "",
    message:           message || "",
    formContext:       formContext || "",
  }, res);

  clearInterval(keepAlive);
};
