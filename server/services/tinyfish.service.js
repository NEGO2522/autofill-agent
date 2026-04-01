import axios from "axios";

/* ══════════════════════════════════════════════════════
   PLATFORM DETECTION
══════════════════════════════════════════════════════ */
function detectPlatform(url) {
  const u = url.toLowerCase();

  if (u.includes("unstop.com")) return {
    name: "Unstop",
    hints: `
PLATFORM: Unstop (formerly Dare2Compete)

CRITICAL — AUTHENTICATION FIRST:
- Before doing anything else, check if the user is already logged in to Unstop.
- If NOT logged in: look for a "Login" or "Sign In" button/link on the page or in the header.
  - Click it and log in using the email from the profile.
  - If login fails (wrong password / no account), STOP and report: "Login required — please log in to Unstop manually first, then re-run the agent."
  - Do NOT proceed with registration if not logged in — Unstop will NOT send a confirmation email without a valid account session.
- If already logged in: proceed directly to the registration steps below.

REGISTRATION STEPS:
1. Navigate to the competition URL and wait for full page load.
2. Click "Register", "Participate", or "Apply" button if present.
3. Unstop uses multi-step registration forms — complete EVERY step before clicking Next/Continue.
4. Step-by-step field filling:
   - Personal details: name, email, phone, college/university (type and select from autocomplete dropdown).
   - College name: type slowly and wait for suggestions — select the matching one from dropdown.
   - Team registration (if applicable): fill "Team Name" from profile; add teammates by email if required.
   - "About Yourself" / "Why do you want to participate?" / "Tell us about yourself": use the bio field from profile.
   - Skills: click each skill tag that matches the profile skills list.
   - Social links: fill LinkedIn URL and GitHub URL from profile.
   - Resume upload: if a file upload button appears, click it and upload the resume file.
   - Education: fill degree, branch, graduation year, CGPA from profile.
5. Accept ALL checkboxes: terms & conditions, consent, communication preferences, privacy policy.
6. After each step, wait for the page transition before continuing to the next step.
7. On the FINAL step, click the Submit / Register / Confirm button.

CONFIRMATION DETECTION (CRITICAL):
- True success on Unstop looks like ONE of these:
  a) The page URL changes to something like: unstop.com/competitions/.../registered OR unstop.com/dashboard
  b) A green banner/toast appears saying "Successfully registered" or "Registration successful"
  c) A modal popup confirms registration with a "You're registered!" message
  d) The "Register" button changes to "Registered" or becomes disabled/grayed out
- Only report success if you see ONE of the above. Do NOT report success just because you clicked the final button.
- If you see a CAPTCHA, OTP verification, or payment page: STOP and report it immediately.
- If you see an error like "already registered" — report that the user may already be registered.
- After confirmed success, check if the page says "A confirmation email has been sent" — report this to the user.
`
  };

  if (u.includes("devfolio.co")) return {
    name: "Devfolio",
    hints: `
PLATFORM: Devfolio
- Log-in / sign-up may already be handled. Skip auth if already logged in.
- Devfolio hackathon applications have sections: About You, Your Project, Team, Links.
- "Tell us about yourself": use the bio from profile.
- "What are you building?": use projectName + projectDescription from profile.
- Tech stack field: use the techStack or skills from profile.
- GitHub link: use the github field from profile.
- Portfolio: use the portfolio field.
- Team size / looking for teammates: fill teamSize from profile.
- Resume upload: upload the resume file if a file upload is present.
- "Why do you want to attend?": generate a short enthusiastic answer about learning and building.
- T-shirt size dropdown: pick M as default if not specified.
- Accept all checkboxes including Code of Conduct and MLH terms.
`
  };

  if (u.includes("devpost.com")) return {
    name: "Devpost",
    hints: `
PLATFORM: Devpost
- Devpost registration asks for: name, email, skills, experience level, what you want to learn.
- "What are your skills?": use skills list from profile.
- "Experience level": pick based on experience years — 0-1=Beginner, 1-3=Intermediate, 3+=Advanced.
- "What are you hoping to learn?": generate a short answer about learning new tech and solving problems.
- Team tab: fill team name from profile.
- Project submission (if applicable): fill project name, description, tech stack, demo link, GitHub repo.
- "Built with" tags: extract tech names from techStack/skills and add each one.
- Video demo URL: use demoLink from profile if available.
- Accept Code of Conduct checkbox.
- MLH (Major League Hacking) consent checkboxes: accept all.
`
  };

  if (u.includes("docs.google.com/forms") || u.includes("forms.gle")) return {
    name: "Google Forms",
    hints: `
PLATFORM: Google Forms
- Google Forms render all fields on one page (or paginated sections).
- Short answer fields: fill with the most relevant profile value based on the question label.
- Paragraph fields: use bio, projectDescription, or a generated answer.
- Multiple choice / radio: select the best matching option.
- Checkboxes: select all that apply from the profile.
- Dropdown: pick the best match.
- File upload questions: upload resume or college ID from profile if asked.
- Date fields: use the correct format shown by the input.
- Linear scale: pick 4 or 5 out of 5 for positive questions (interest, experience, etc.).
- After all fields are filled, click the "Submit" button.
- Do NOT refresh the page — Google Forms loses progress on refresh.
`
  };

  if (u.includes("linkedin.com/jobs") || u.includes("linkedin.com/apply")) return {
    name: "LinkedIn Easy Apply",
    hints: `
PLATFORM: LinkedIn Easy Apply
- LinkedIn Easy Apply is a multi-step modal dialog.
- Contact info step: verify name, email, phone — fill if empty.
- Resume step: upload resume if file upload is shown, or use the existing saved resume.
- Questions step: answer screening questions using profile data.
  - Years of experience questions: use the experience number from profile.
  - "Are you legally authorized to work in X?": answer Yes.
  - "Do you require sponsorship?": answer No (unless profile specifies otherwise).
  - Salary/pay expectation: use expectedCtc from profile if available, else leave blank.
- Review step: scroll through and confirm all answers.
- Submit application.
`
  };

  if (u.includes("greenhouse.io") || u.includes("lever.co") || u.includes("workday") || u.includes("taleo") || u.includes("icims") || u.includes("smartrecruiters") || u.includes("ashbyhq") || u.includes("jobs.")) return {
    name: "Career / ATS Portal",
    hints: `
PLATFORM: Company Career Page / ATS System
- Personal info: fill name, email, phone from profile.
- Resume upload: upload the resume file. This is critical for job applications.
- Cover letter: use the bio/cover letter from profile.
- LinkedIn profile URL: use the linkedin field from profile.
- Work authorization / visa status: answer "Yes, authorized to work" / "No sponsorship needed" by default.
- Salary expectation: use expectedCtc from profile or leave blank.
- "How did you hear about us?": select "LinkedIn" or "Job Board" from dropdown.
- Equal opportunity / diversity fields: answer "Prefer not to say" for optional demographic questions.
- Education: fill from qualification, university, graduationYear fields.
- Work experience: fill from organization, jobTitle, experience fields.
`
  };

  if (u.includes("internshala.com")) return {
    name: "Internshala",
    hints: `
PLATFORM: Internshala
- "Why should we hire you?" / cover letter: use bio from profile.
- Skills: select or type each skill from the profile skills list.
- Availability / start date: answer "Immediately" or current month.
- College name: type and select from autocomplete suggestions.
- Graduation year: use graduationYear from profile.
- Resume: upload if a file upload is present.
`
  };

  if (u.includes("hackerearth.com")) return {
    name: "HackerEarth",
    hints: `
PLATFORM: HackerEarth
- Team name and size: use teamName and teamSize from profile.
- Project idea: use projectName + projectDescription.
- Technology tags: select from skills/techStack in profile.
- GitHub link: use github from profile.
- Problem statement selection: pick any available problem statement.
- Accept terms and conditions.
`
  };

  if (u.includes("hackerrank.com")) return {
    name: "HackerRank",
    hints: `
PLATFORM: HackerRank
- Fill name, email from profile.
- LinkedIn / GitHub links from profile.
- Skills/technologies: select from profile skills.
`
  };

  return {
    name: "Generic Web Form",
    hints: `
PLATFORM: Unknown / Generic Web Form
- Intelligently map profile fields to whatever form fields are visible.
- Use the bio for any open-ended "about yourself" or "describe yourself" text areas.
- For team hackathon fields use the team section of the profile.
- For job fields use the professional section.
`
  };
}

/* ══════════════════════════════════════════════════════
   GOAL BUILDER
══════════════════════════════════════════════════════ */
function buildGoal(url, profile, extraFields = {}, otpValue = "") {
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.name || "";
  const platform = detectPlatform(url);
  const merged = { ...profile, ...extraFields };

  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  const otpSection = otpValue ? `
## OTP / VERIFICATION CODE
The user has provided the following OTP/verification code: ${otpValue}
If the page is showing an OTP input field, type this code into the OTP/verification field and click Verify/Confirm/Submit.
` : sessionId ? `
## OTP HANDLING RULE — VERY IMPORTANT
If at any point you see an OTP input field, a "Enter verification code" screen, or any screen asking for a code sent via SMS or email:
1. DO NOT guess or make up a code.
2. Make a GET request to: ${backendUrl}/api/agent/get-otp?sessionId=${sessionId}
   - If the response is {"otp": "<code>"} — type that code into the OTP field and click Verify.
   - If the response is {"waiting": true} — wait 5 seconds and try again (poll up to 24 times = 2 minutes).
3. The user will type their OTP into the app while you wait.
` : `
## OTP HANDLING RULE
If you encounter an OTP/verification screen, stop and report it. Do not guess codes.
`;

  return `
You are an expert form-filling AI agent specialised in completing web registrations, job applications, hackathon sign-ups, and all kinds of online forms quickly and accurately.

## TARGET
URL: ${url}
Platform detected: ${platform.name}

## COMPLETE USER PROFILE
Use this data to fill every matching field on the page:

### Identity
- Full Name: ${fullName}
- First Name: ${merged.firstName || ""}
- Last Name: ${merged.lastName || ""}
- Email: ${merged.email || ""}
- Contact / Phone: ${merged.phone || ""}
- Date of Birth: ${merged.dob || ""}
- Gender: ${merged.gender || ""}

### Address
- Address Line 1: ${merged.address1 || ""}
- City: ${merged.city || ""}
- State / Province: ${merged.state || ""}
- PIN / ZIP: ${merged.pincode || ""}
- Country: ${merged.country || "India"}
- Nationality: ${merged.nationality || "Indian"}

### Education
- Highest Qualification: ${merged.qualification || ""}
- Branch / Field of Study: ${merged.fieldOfStudy || ""}
- University / College: ${merged.university || ""}
- Graduation Year: ${merged.graduationYear || ""}
- CGPA / Percentage: ${merged.cgpa || ""}
- 10th Percentage: ${merged.tenthPercent || ""}
- 12th Percentage: ${merged.twelfthPercent || ""}

### Professional / Job
- Current Company / Organisation: ${merged.organization || ""}
- Job Title / Designation: ${merged.jobTitle || ""}
- Total Experience (years): ${merged.experience || ""}
- Industry: ${merged.industry || ""}
- Skills (comma-separated): ${merged.skills || ""}
- Current CTC: ${merged.ctc || ""}
- Expected CTC: ${merged.expectedCtc || ""}
- Notice Period: ${merged.noticePeriod || ""}
- Certifications: ${merged.certifications || ""}

### Social & Links
- LinkedIn URL: ${merged.linkedin || ""}
- GitHub URL: ${merged.github || ""}
- Portfolio / Website: ${merged.portfolio || ""}
- Twitter / X: ${merged.twitter || ""}
- LeetCode / CF: ${merged.leetcode || ""}
- Instagram: ${merged.instagram || ""}

### Hackathon / Event
- Team Name: ${merged.teamName || ""}
- Team Size: ${merged.teamSize || ""}
- Your Role in Team: ${merged.teamRole || ""}
- Project / Idea Name: ${merged.projectName || ""}
- Project Description: ${merged.projectDescription || ""}
- Tech Stack: ${merged.techStack || merged.skills || ""}
- Project GitHub Repo: ${merged.githubRepo || merged.github || ""}
- Demo / Live URL: ${merged.demoLink || ""}
- Past Achievements / Awards: ${merged.achievements || ""}

### Documents
- Resume / CV URL: ${merged.resumeURL || ""}
- College Photo ID URL: ${merged.collegePhotoURL || ""}

### Bio & Cover Letter
- Bio / About Me / SOP: ${merged.bio || ""}
- Why join us / Why interested: ${merged.whyUs || ""}
- Key Strengths: ${merged.strengths || ""}
- Hobbies / Interests: ${merged.hobbies || ""}
- Additional Message: ${merged.message || ""}

${Object.keys(extraFields).length > 0 ? `### Extra Fields Provided by User\n${Object.entries(extraFields).map(([k,v]) => `- ${k}: ${v}`).join("\n")}` : ""}

${otpSection}
## PLATFORM-SPECIFIC INSTRUCTIONS
${platform.hints}

## UNIVERSAL FILLING RULES
1. Navigate to the URL and wait for the page to fully load. Dismiss cookie banners / popups.
2. Scan ALL visible form fields: inputs, textareas, dropdowns, radio buttons, checkboxes, date pickers, file upload buttons, tag selectors, etc.
3. For each field, match to the best profile value using the field label, placeholder, and context.
4. As you work through the form, track every field you encounter.

## CRITICAL REPORTING REQUIREMENT — READ THIS CAREFULLY
After scanning and filling the form (but BEFORE submitting), you MUST emit TWO reports:

### Report A — Fields you COULD NOT fill (SKIPPED_FIELDS)
For every field on the page that you left blank (either because the profile had no matching data, or it was a custom question unique to this form), emit this EXACT JSON on its own line:
SKIPPED_FIELDS:{"fields":[{"label":"<exact question/label from the page>","type":"<text|email|tel|textarea|select|radio|checkbox|file>","required":<true|false>,"reason":"<why skipped: no profile data / custom question / file upload needed / etc>"}]}

Include ALL skipped fields — both required and optional ones. If you filled everything, emit: SKIPPED_FIELDS:{"fields":[]}

### Report B — Fields you could NOT fill that need user input (NEEDS_INPUT)
For fields that are REQUIRED and you could NOT fill, also emit:
NEEDS_INPUT:{"fields":[{"label":"<field label>","type":"<text|email|tel|select|textarea>","required":true}]}

5. After both reports, continue to:
   - Scroll the page to catch any fields below the fold.
   - Accept all terms/privacy/consent checkboxes.
   - Click Submit / Apply / Register / Join / Participate / Next.
   - Wait for a success/confirmation screen.
6. Report each action you take as a short sentence.

## IMPORTANT RULES
- Emit SKIPPED_FIELDS with ALL skipped fields — this is the most important output.
- Emit NEEDS_INPUT only for fields that are required AND have no profile match.
- Only report fields ACTUALLY on this specific page.
- Do not refresh the page mid-fill.
- If a CAPTCHA is encountered, report it and pause.
- If a login/signup wall blocks access, report it immediately.
- Use the bio/message as fallback for any open-ended text fields.
`.trim();
}

/* ══════════════════════════════════════════════════════
   OTP WAIT STORE
   When agent hits an OTP screen:
     1. server stores a Promise resolver keyed by sessionId
     2. frontend calls POST /api/agent/submit-otp with { sessionId, otp }
     3. server resolves the promise → agent goal gets the code and types it
══════════════════════════════════════════════════════ */
export const otpWaiters = new Map();
// Map<sessionId, { resolve: (otp: string) => void, createdAt: number }>

export function waitForOtp(sessionId, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      otpWaiters.delete(sessionId);
      reject(new Error("OTP timeout — user did not enter code within 2 minutes."));
    }, timeoutMs);

    otpWaiters.set(sessionId, {
      resolve: (otp) => {
        clearTimeout(timer);
        otpWaiters.delete(sessionId);
        resolve(otp);
      },
      createdAt: Date.now(),
    });
  });
}

/* ══════════════════════════════════════════════════════
   STREAM AGENT
══════════════════════════════════════════════════════ */
export const streamAgent = async (url, profile, extraFields, res, otpValue = "", sessionId = "") => {
  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const response = await axios.post(
      "https://agent.tinyfish.ai/v1/automation/run-sse",
      {
        url,
        goal: buildGoal(url, profile, extraFields, otpValue),
        browser_profile: "stealth",   // needed for bot-protected sites like Unstop
      },
      {
        headers: {
          "X-API-Key": process.env.TINYFISH_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "stream",
        timeout: 300_000,
      }
    );

    let buffer = "";

    response.data.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const raw = trimmed.replace(/^data:\s*/, "");
        if (!raw || raw === "[DONE]") continue;

        try {
          const evt = JSON.parse(raw);
          const evtType   = (evt.type   || "").toUpperCase();
          const evtStatus = (evt.status || "").toUpperCase();

          // ── Streaming URL ── forward it so UI can show live browser feed
          if (evtType === "STREAMING_URL" && evt.streamingUrl) {
            send("streaming_url", { url: evt.streamingUrl });
            continue;
          }

          // ── THE ONLY REAL DONE: type=COMPLETE AND status=COMPLETED ──
          if (evtType === "COMPLETE" && evtStatus === "COMPLETED") {
            const result = evt.resultJson || {};

            // Parse any skipped/needs fields from resultJson if agent embedded them
            if (result.skipped_fields) send("skipped_fields", { fields: result.skipped_fields });
            if (result.needs_input)    send("needs_input",    { fields: result.needs_input    });

            // Check resultJson for confirmation signals
            const resultStr = JSON.stringify(result).toLowerCase();
            const confirmed = [
              /registered/i, /submitted/i, /confirmation/i, /success/i, /you.{0,20}in/i,
            ].some(r => r.test(resultStr));

            send("done", {
              success: true,
              confirmed,
              message: confirmed
                ? "✅ Registration confirmed!"
                : "Agent completed. Please check the form page to verify submission.",
              result,
            });
            res.end();
            return;
          }

          // ── PROGRESS events — forward as messages to show in live console ──
          if (evtType === "PROGRESS" || evtType === "STARTED") {
            const progressText = evt.purpose || evt.message || evt.log || JSON.stringify(evt);

            // Detect SKIPPED_FIELDS embedded in progress text
            const sfMatch = progressText.match(/SKIPPED_FIELDS:(\{[\s\S]*?\})/);
            if (sfMatch) {
              try {
                const p = JSON.parse(sfMatch[1]);
                if (p.fields) send("skipped_fields", { fields: p.fields });
              } catch { /* malformed */ }
            }

            // Detect NEEDS_INPUT embedded in progress text
            const niMatch = progressText.match(/NEEDS_INPUT:(\{[\s\S]*?\})/);
            if (niMatch) {
              try {
                const p = JSON.parse(niMatch[1]);
                if (p.fields?.length) send("needs_input", { fields: p.fields });
              } catch { /* malformed */ }
            }

            send("message", { message: progressText, raw: evt });
            continue;
          }

          // ── ERROR from TinyFish ──
          if (evtType === "ERROR" || evtType === "FAILED") {
            send("error", { message: evt.message || evt.error || "Agent encountered an error." });
            res.end();
            return;
          }

          // ── Any other event type — forward as a plain message ──
          send("message", { message: evt.purpose || evt.message || JSON.stringify(evt), raw: evt });

        } catch {
          // Raw non-JSON line — forward as log
          if (raw.trim()) send("log", { message: raw });
        }
      }
    });

    response.data.on("end", () => {
      // Stream ended without a COMPLETE event — warn user
      send("done", { success: false, confirmed: false, message: "⚠️ Agent stream ended without confirmation. Please check the form page manually." });
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
