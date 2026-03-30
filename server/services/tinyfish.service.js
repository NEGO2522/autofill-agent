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
2. Identify ALL visible and interactive form fields on the page — inputs, textareas, dropdowns, radio buttons, checkboxes, date pickers, file uploads, sliders, etc.
3. For EACH field, intelligently determine what data it needs by reading:
   - The field label
   - Placeholder text
   - Surrounding context / section heading
   - Field name / ID attribute
4. Map the most appropriate value from the user profile above to each field.
5. For fields not covered by the profile (e.g. "Why do you want to join?", "Describe your project"):
   - Use the "Cover Letter / Bio" field if relevant
   - Otherwise generate a sensible, professional response based on the user's profile context
6. Handle special field types:
   - Dropdowns: select the best matching option
   - Radio buttons: select the most appropriate option
   - Checkboxes: check relevant ones (e.g. terms & conditions, skills, interests)
   - Date fields: use the correct format for that field
   - File uploads: skip unless a file path is provided
   - Multi-step forms: complete each step before proceeding to the next
   - CAPTCHA: solve if possible, otherwise note it
7. After filling ALL fields:
   - Scroll to check for any missed fields
   - Accept terms/privacy policy checkboxes if present
   - Click the Submit / Apply / Register / Send / Next button
   - Wait for a success/confirmation message
8. Report each action as you take it.

## IMPORTANT
- Do NOT skip any field — fill everything you can
- If a required field has no matching profile data, make a reasonable professional inference
- This could be any type of form: job application, hackathon registration, government portal, contact form, event signup, college application, visa form, insurance, etc.
- Adapt your strategy to the specific form you encounter
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

        try {
          const evt = JSON.parse(raw);
          send("message", evt);

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
            (typeof evt.message === "string" &&
              /(success|submitted|done|complet|registered|applied|thank)/i.test(evt.message));

          if (isDone) {
            send("done", { success: true, message: "Form submitted successfully!" });
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
