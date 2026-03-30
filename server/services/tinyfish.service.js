import axios from "axios";

/**
 * Builds a universal, context-aware goal prompt for ANY type of form.
 * The agent will intelligently map profile data to whatever fields exist.
 */
function buildGoal(url, profile) {
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.name || "";

  return `
You are an expert form-filling AI agent. Your task is to fill out a web form completely and accurately.

## TARGET URL
${url}

## USER PROFILE (use this data to fill the form — map fields intelligently)
- Full Name: ${fullName}
- First Name: ${profile.firstName || ""}
- Last Name: ${profile.lastName || ""}
- Email: ${profile.email || ""}
- Phone / Mobile: ${profile.phone || ""}
- Date of Birth: ${profile.dob || ""}
- Gender: ${profile.gender || ""}
- Address Line 1: ${profile.address1 || ""}
- Address Line 2: ${profile.address2 || ""}
- City: ${profile.city || ""}
- State / Province: ${profile.state || ""}
- PIN Code / ZIP / Postal Code: ${profile.pincode || ""}
- Country: ${profile.country || "India"}
- Nationality: ${profile.nationality || "Indian"}
- Organization / Company / College / Institution: ${profile.organization || ""}
- Job Title / Designation / Role: ${profile.jobTitle || ""}
- Years of Experience: ${profile.experience || ""}
- LinkedIn URL: ${profile.linkedin || ""}
- GitHub URL: ${profile.github || ""}
- Portfolio / Website URL: ${profile.website || ""}
- Skills / Technologies (comma-separated): ${profile.skills || ""}
- Highest Qualification / Degree: ${profile.qualification || ""}
- Field of Study / Branch / Specialization: ${profile.fieldOfStudy || ""}
- University / School Name: ${profile.university || ""}
- Graduation Year: ${profile.graduationYear || ""}
- Team Name (for hackathons/events): ${profile.teamName || ""}
- Team Size: ${profile.teamSize || ""}
- Project Name / Idea Title: ${profile.projectName || ""}
- Project Description / Idea: ${profile.projectDescription || ""}
- Cover Letter / Statement of Purpose / Bio / About Me: ${profile.bio || ""}
- Message / How can we help / Additional Info: ${profile.message || ""}
- Form Context / Purpose: ${profile.formContext || "Fill this form completely and accurately"}

## INSTRUCTIONS
1. Navigate to the URL and wait for the page to fully load.
2. Scan ALL visible form fields on the page — inputs, textareas, dropdowns, radio buttons, checkboxes, date pickers, file uploads, etc.
3. For each field, check if the User Profile above has a value that fits.
   - Map profile data to fields intelligently based on the label, placeholder, and context.
   - For dropdowns / radio buttons: pick the best matching option.
   - For checkboxes: check relevant ones (terms & conditions, consent, skills, etc.).
   - For date fields: use the correct format for that field.
   - For file uploads: skip unless a file path is provided.
4. BEFORE filling anything, identify which fields on the actual page are REQUIRED (marked with *, "required", or similar) AND have no matching value in the User Profile above.
   - If any such fields exist, output a JSON block on its own line in this EXACT format and nothing else on that line:
     NEEDS_INPUT:{"fields":[{"label":"<exact field label from the page>","type":"<text|email|tel|textarea|select>","required":true}]}
   - Only include fields that are truly on the page AND have no match in the profile.
   - Do NOT include fields you can already fill from the profile.
   - Do NOT guess fields based on the URL or website name — only report fields you can actually see on the page.
   - After emitting NEEDS_INPUT, continue filling all the fields you DO have data for. Do not wait.
5. For optional fields not in the profile (e.g. "Message", "Tell us more"):
   - Use the bio/cover letter field if relevant, or generate a short professional response.
6. After filling ALL fields:
   - Scroll to check for any missed fields.
   - Accept terms/privacy policy checkboxes if present.
   - Click the Submit / Apply / Register / Send / Next button.
   - Wait for a success/confirmation message.
7. Report each action as you take it.

## IMPORTANT
- Only ask for missing fields that ACTUALLY exist on this specific page — not guesses based on the URL or company type.
- If a required field is missing from the profile, emit NEEDS_INPUT once, then continue filling what you can.
- This could be any type of form. Adapt to what you actually see on the page.
`.trim();
}

/**
 * Streams TinyFish SSE events directly to the Express response.
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
        goal: buildGoal(url, profile),
      },
      {
        headers: {
          "X-API-Key": process.env.TINYFISH_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "stream",
        timeout: 300_000, // 5 min for complex multi-step forms
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
        if (raw === "[DONE]") continue;

        // Check for NEEDS_INPUT signal from the agent (a plain-text line, not JSON)
        if (raw.startsWith("NEEDS_INPUT:")) {
          try {
            const payload = JSON.parse(raw.slice("NEEDS_INPUT:".length));
            if (payload.fields && payload.fields.length > 0) {
              send("needs_input", { fields: payload.fields });
            }
          } catch { /* malformed, ignore */ }
          continue;
        }

        try {
          const evt = JSON.parse(raw);

          // Also check if the agent embedded NEEDS_INPUT inside a message string
          const msgText = typeof evt.message === "string" ? evt.message : "";
          const niMatch = msgText.match(/NEEDS_INPUT:(\{.*\})/);
          if (niMatch) {
            try {
              const payload = JSON.parse(niMatch[1]);
              if (payload.fields && payload.fields.length > 0) {
                send("needs_input", { fields: payload.fields });
              }
            } catch { /* malformed, ignore */ }
          }

          send("message", evt);

          // Only treat structural completion events as "done" —
          // NOT log messages that happen to contain keywords like "success".
          // This prevents premature done firing when the agent merely
          // narrates an action (e.g. "Clicking the submit button").
          const isStructuralDone =
            evt.type === "result" ||
            evt.type === "done" ||
            evt.type === "complete" ||
            evt.type === "finished" ||
            evt.status === "completed" ||
            evt.status === "success" ||
            evt.status === "done" ||
            evt.status === "finished" ||
            evt.finished === true ||
            evt.done === true;

          // For message/log events, look for the agent confirming a
          // post-submission page (thank-you, confirmation, success screen).
          // Require at least TWO strong signals to avoid false positives.
          const msg = typeof evt.message === "string" ? evt.message.toLowerCase() : "";
          const confirmSignals = [
            /thank.{0,10}(you|registr|submiss|appl)/i,
            /successfull?y\s+(submitted|registered|applied|sent)/i,
            /your (application|registration|submission|form) (has been|was) (submitted|received|sent)/i,
            /confirmation (number|id|code)/i,
            /you.{0,20}(registered|applied|signed up)/i,
          ];
          const confirmedByMessage = confirmSignals.some(r => r.test(msg));

          if (isStructuralDone || confirmedByMessage) {
            send("done", {
              success: true,
              confirmed: isStructuralDone || confirmedByMessage,
              message: confirmedByMessage
                ? "Form submitted — confirmation detected on page!"
                : "Agent finished. Check the browser to confirm submission.",
            });
            res.end();
            return;
          }
        } catch {
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
