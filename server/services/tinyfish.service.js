import { chromium } from "playwright";

/* ══════════════════════════════════════════════════════
   AUTOFILL AGENT — Pure Playwright, Zero AI
   ─────────────────────────────────────────────────────
   How it works:
     1. Playwright opens a real Chromium browser
     2. Scans every input/select/textarea on the page
     3. Matches each field by name/id/placeholder/label
        against the user's saved profile
     4. Fills matched fields directly — fast, no loops
     5. Clicks the submit/register button
     6. Multi-step: if a Next button exists, clicks it
        and repeats until done or no more steps
══════════════════════════════════════════════════════ */

/* ── OTP wait store (shared with routes) ── */
export const otpWaiters = new Map();

export function waitForOtp(sessionId, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      otpWaiters.delete(sessionId);
      reject(new Error("OTP timeout"));
    }, timeoutMs);
    otpWaiters.set(sessionId, {
      resolve: (otp) => { clearTimeout(timer); otpWaiters.delete(sessionId); resolve(otp); },
      createdAt: Date.now(),
    });
  });
}

/* ══════════════════════════════════════════════════════
   FIELD MAP
══════════════════════════════════════════════════════ */
const FIELD_MAP = [
  // ── Identity ──
  { keys: ["firstname", "first_name", "first name", "fname", "given name", "given_name"],          profile: "firstName"              },
  { keys: ["lastname", "last_name", "last name", "lname", "surname", "family name"],               profile: "lastName"               },
  { keys: ["fullname", "full_name", "full name", "your name", "participant name", "name"],         profile: "name"                   },
  { keys: ["email", "e-mail", "mail", "email address", "emailaddress"],                            profile: "email"                  },
  { keys: ["phone", "mobile", "contact", "phonenumber", "phone_number", "mobile number",
            "contact number", "whatsapp"],                                                          profile: "phone"                  },
  { keys: ["dob", "date of birth", "birth date", "birthday", "dateofbirth"],                      profile: "dob"                    },
  { keys: ["gender", "sex"],                                                                       profile: "gender"                 },

  // ── Address ──
  { keys: ["address", "address1", "street", "street address", "house"],                           profile: "address1"               },
  { keys: ["address2", "apartment", "suite", "flat"],                                              profile: "address2"               },
  { keys: ["city", "town", "district"],                                                            profile: "city"                   },
  { keys: ["state", "province", "region"],                                                         profile: "state"                  },
  { keys: ["pincode", "zip", "postal", "zipcode", "postalcode", "pin"],                           profile: "pincode"                },
  { keys: ["country"],                                                                             profile: "country"                },

  // ── Education ──
  { keys: ["college", "university", "institution", "school", "collegename", "university name",
            "institute", "college name"],                                                           profile: "collegeName"            },
  { keys: ["degree", "qualification", "program", "course", "branch", "degreename",
            "degree name", "stream"],                                                               profile: "degreeName"             },
  { keys: ["year", "current year", "study year", "yearofstudy", "year of study",
            "semester", "sem"],                                                                     profile: "year"                   },
  { keys: ["graduation", "graduationyear", "passing year", "passout", "passoutyear",
            "expected graduation", "graduating year"],                                              profile: "expectedGraduationYear" },
  { keys: ["rollno", "roll", "rollnumber", "roll number", "student id", "enrollment",
            "registrationnumber", "reg no"],                                                        profile: "rollNumber"             },
  { keys: ["cgpa", "gpa", "percentage", "marks", "score", "aggregate"],                           profile: "cgpa"                   },

  // ── Professional ──
  { keys: ["organization", "org", "company", "employer", "workplace", "company name"],            profile: "organization"           },
  { keys: ["jobtitle", "job title", "designation", "role", "position"],                           profile: "jobTitle"               },
  { keys: ["experience", "work experience", "years of experience", "exp"],                        profile: "experience"             },
  { keys: ["skills", "technical skills", "technologies", "tech stack", "expertise",
            "skillset", "skill set"],                                                               profile: "skills"                 },
  { keys: ["ctc", "current ctc", "current salary", "salary"],                                     profile: "ctc"                    },
  { keys: ["expectedctc", "expected ctc", "expected salary"],                                     profile: "expectedCtc"            },
  { keys: ["notice", "notice period", "noticeperiod", "availability"],                            profile: "noticePeriod"           },

  // ── Social / Links ──
  { keys: ["linkedin", "linkedin url", "linkedin profile"],                                        profile: "linkedin"               },
  { keys: ["github", "github url", "github profile", "github link"],                              profile: "github"                 },
  { keys: ["portfolio", "website", "personal website", "portfolio url"],                          profile: "portfolio"              },
  { keys: ["twitter", "twitter handle", "twitter url"],                                           profile: "twitter"                },
  { keys: ["leetcode", "leetcode url", "leetcode profile"],                                       profile: "leetcode"               },

  // ── Hackathon / Team ──
  { keys: ["teamname", "team name", "team"],                                                      profile: "teamName"               },
  { keys: ["teamsize", "team size", "members", "no of members"],                                  profile: "teamSize"               },
  { keys: ["teamrole", "team role", "your role", "role in team"],                                 profile: "teamRole"               },
  { keys: ["projectname", "project name", "project title"],                                       profile: "projectName"            },
  { keys: ["projectdescription", "project description", "project idea", "idea",
            "project abstract", "abstract"],                                                        profile: "projectDescription"     },
  { keys: ["githublink", "github repo", "repo link", "repository", "repo url",
            "github repository"],                                                                   profile: "github"                 },
  { keys: ["demolink", "demo link", "demo url", "live link", "deployed link"],                    profile: "demoLink"               },
  { keys: ["achievements", "achievement", "awards"],                                              profile: "achievements"           },

  // ── Documents ──
  { keys: ["resume", "cv", "resume url", "resume link", "resumeurl"],                            profile: "resumeURL"              },

  // ── Bio / Long text ──
  { keys: ["bio", "about", "about you", "about yourself", "introduction", "intro",
            "tell us about yourself"],                                                              profile: "bio"                    },
  { keys: ["whyus", "why us", "why do you want", "motivation", "why join",
            "why hackathon", "why participate"],                                                    profile: "whyUs"                  },
  { keys: ["strengths", "strength", "your strengths"],                                            profile: "strengths"              },
  { keys: ["hobbies", "hobby", "interests", "interest"],                                          profile: "hobbies"                },
  { keys: ["message", "additional info", "anything else", "comments", "remarks",
            "other details"],                                                                       profile: "message"                },
];

/* ══════════════════════════════════════════════════════
   SUCCESS DETECTOR
══════════════════════════════════════════════════════ */
const SUCCESS_KEYWORDS = [
  "successfully registered", "registration successful", "you are registered",
  "application submitted", "submission successful", "thank you for registering",
  "thank you for applying", "you have been registered", "registration complete",
  "successfully applied", "application received", "we received your",
  "you're in!", "you are in!", "spot confirmed", "see you at",
  "registration confirmed", "confirmed your registration",
];

async function isSuccessPage(page) {
  try {
    const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
    return SUCCESS_KEYWORDS.find(k => text.includes(k)) || null;
  } catch { return null; }
}

/* ══════════════════════════════════════════════════════
   FIND PROFILE VALUE FOR A FIELD ELEMENT
══════════════════════════════════════════════════════ */
function findProfileValue(hints, profile) {
  for (const entry of FIELD_MAP) {
    for (const keyword of entry.keys) {
      for (const hint of hints) {
        if (hint.includes(keyword) || keyword.includes(hint)) {
          const val = profile[entry.profile];
          if (val && String(val).trim()) return String(val).trim();
        }
      }
    }
  }
  return null;
}

/* ══════════════════════════════════════════════════════
   EXTRACT FIELD HINTS FROM AN ELEMENT
══════════════════════════════════════════════════════ */
async function getFieldHints(page, el) {
  return page.evaluate((el) => {
    const hints = [];
    const add = (v) => { if (v) hints.push(v.toLowerCase().trim()); };

    add(el.name);
    add(el.id);
    add(el.placeholder);
    add(el.getAttribute("aria-label"));
    add(el.getAttribute("data-label"));
    add(el.getAttribute("title"));

    if (el.id) {
      const lbl = document.querySelector(`label[for="${el.id}"]`);
      if (lbl) add(lbl.innerText);
    }
    const parent = el.closest("label");
    if (parent) add(parent.innerText);

    const wrap = el.closest("div, fieldset, li");
    if (wrap) {
      const lbl = wrap.querySelector("label");
      if (lbl) add(lbl.innerText);
      const prev = el.previousElementSibling;
      if (prev && ["LABEL","SPAN","P","LEGEND"].includes(prev.tagName)) add(prev.innerText);
    }

    return [...new Set(hints)];
  }, el);
}

/* ══════════════════════════════════════════════════════
   FILL ONE PAGE PASS
   Returns { filled, skipped }
══════════════════════════════════════════════════════ */
async function fillPageFields(page, profile, send) {
  let filled = 0, skipped = 0;

  // ── Text inputs & textareas ──
  const inputs = await page.$$(
    "input:not([type='hidden']):not([type='submit']):not([type='button'])" +
    ":not([type='checkbox']):not([type='radio']):not([type='file']), textarea"
  );

  for (const el of inputs) {
    try {
      const visible = await el.isVisible();
      if (!visible) continue;

      const hints = await getFieldHints(page, el);
      const value = findProfileValue(hints, profile);
      if (!value) { skipped++; continue; }

      await el.scrollIntoViewIfNeeded();
      await el.fill(value);
      await page.waitForTimeout(120);
      filled++;
      send("message", { message: `✏️ Filled: "${hints[0] || "field"}" → ${value.slice(0, 40)}${value.length > 40 ? "…" : ""}` });
    } catch { /* skip uninteractable */ }
  }

  // ── Select dropdowns ──
  const selects = await page.$$("select");
  for (const el of selects) {
    try {
      const visible = await el.isVisible();
      if (!visible) continue;

      const hints = await getFieldHints(page, el);
      const value = findProfileValue(hints, profile);
      if (!value) { skipped++; continue; }

      await el.scrollIntoViewIfNeeded();
      try { await el.selectOption({ label: new RegExp(value.slice(0, 8), "i") }); }
      catch {
        try { await el.selectOption({ value }); }
        catch { try { await el.selectOption({ label: value }); } catch { skipped++; continue; } }
      }
      await page.waitForTimeout(120);
      filled++;
      send("message", { message: `📋 Selected: "${hints[0] || "dropdown"}" → ${value.slice(0, 40)}` });
    } catch { /* skip */ }
  }

  // ── Checkboxes (terms, consent, etc.) ──
  const checkboxes = await page.$$("input[type='checkbox']");
  for (const el of checkboxes) {
    try {
      const visible = await el.isVisible();
      if (!visible) continue;
      const checked = await el.isChecked();
      if (checked) continue;

      const hints = await getFieldHints(page, el);
      const combined = hints.join(" ");
      const autoCheck = ["terms", "condition", "privacy", "policy", "agree", "consent",
                         "accept", "certify", "confirm", "acknowledge", "newsletter",
                         "code of conduct", "mlh", "18", "above"];
      if (autoCheck.some(k => combined.includes(k))) {
        await el.scrollIntoViewIfNeeded();
        await el.check();
        await page.waitForTimeout(100);
        filled++;
        send("message", { message: `☑️ Checked: "${hints[0] || "checkbox"}"` });
      }
    } catch { /* skip */ }
  }

  return { filled, skipped };
}

/* ══════════════════════════════════════════════════════
   GET VISIBLE FORM INPUT COUNT
   Used to detect real page/step changes
══════════════════════════════════════════════════════ */
async function getVisibleInputCount(page) {
  try {
    return await page.evaluate(() =>
      document.querySelectorAll(
        "input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select"
      ).length
    );
  } catch { return 0; }
}

/* ══════════════════════════════════════════════════════
   FIND SUBMIT OR NEXT BUTTON
   ─────────────────────────────────────────────────────
   Key improvement: only matches buttons that are INSIDE
   a <form> or near form fields, not navbar/header links.
   Returns { el, type: "submit" | "next" } | null
══════════════════════════════════════════════════════ */
async function findActionButton(page) {
  const SUBMIT_TEXTS = ["submit", "register", "apply now", "apply", "join now", "join", "sign up", "signup", "finish", "complete"];
  const NEXT_TEXTS   = ["next", "continue", "proceed", "save & continue", "save and continue", "next step", "go to next"];

  // Evaluate in-browser: find all visible buttons sorted by proximity to form fields
  const result = await page.evaluate((submitTexts, nextTexts) => {
    const allButtons = [
      ...document.querySelectorAll("button, input[type='submit']")
    ];

    const visible = allButtons.filter(btn => {
      const r = btn.getBoundingClientRect();
      // Must be visible and have non-zero size
      if (r.width === 0 || r.height === 0) return false;
      // Must not be in a header or nav
      if (btn.closest("header, nav, [role='navigation'], .navbar, .nav, .header, .topbar")) return false;
      // Must not be disabled
      if (btn.disabled) return false;
      return true;
    });

    // Score each button: submit > next, prefer inside form, prefer lower on page
    let bestSubmit = null, bestNext = null;

    for (const btn of visible) {
      const rawText = (btn.innerText || btn.value || btn.getAttribute("aria-label") || "").toLowerCase().trim();
      const inForm = !!btn.closest("form");
      const rect = btn.getBoundingClientRect();
      const score = (inForm ? 1000 : 0) + rect.top; // lower top = earlier in page

      if (submitTexts.some(s => rawText.includes(s))) {
        if (!bestSubmit || score < bestSubmit.score) {
          bestSubmit = { text: rawText, score, inForm, selector: null };
          // Build a unique selector
          if (btn.id) bestSubmit.selector = `#${btn.id}`;
          else if (btn.name) bestSubmit.selector = `[name="${btn.name}"]`;
          else bestSubmit.index = [...document.querySelectorAll("button, input[type='submit']")].indexOf(btn);
        }
      } else if (nextTexts.some(s => rawText.includes(s))) {
        if (!bestNext || score < bestNext.score) {
          bestNext = { text: rawText, score, inForm, selector: null };
          if (btn.id) bestNext.selector = `#${btn.id}`;
          else if (btn.name) bestNext.selector = `[name="${btn.name}"]`;
          else bestNext.index = [...document.querySelectorAll("button, input[type='submit']")].indexOf(btn);
        }
      }
    }

    return { submit: bestSubmit, next: bestNext };
  }, SUBMIT_TEXTS, NEXT_TEXTS);

  // Resolve to actual element
  const resolve = async (info, type) => {
    if (!info) return null;
    try {
      let el;
      if (info.selector) {
        el = await page.$(info.selector);
      } else if (info.index !== undefined) {
        const all = await page.$$("button, input[type='submit']");
        el = all[info.index];
      }
      if (el && await el.isVisible()) return { el, type };
    } catch { /* ignore */ }
    return null;
  };

  // Always prefer submit over next
  return (await resolve(result.submit, "submit")) || (await resolve(result.next, "next")) || null;
}

/* ══════════════════════════════════════════════════════
   WAIT FOR PAGE/DOM CHANGE AFTER BUTTON CLICK
   Works for both full navigations and SPA step changes
══════════════════════════════════════════════════════ */
async function waitForChange(page, prevUrl, prevInputCount) {
  // Try waiting for navigation first (real page load)
  try {
    await page.waitForNavigation({ timeout: 3000, waitUntil: "domcontentloaded" });
    return "navigation";
  } catch { /* no navigation, probably SPA */ }

  // Wait up to 2s for input count to change (SPA showing next step)
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(200);
    const count = await getVisibleInputCount(page);
    if (count !== prevInputCount) return "spa-step";
  }

  // No change detected — still same step or error
  const newUrl = page.url();
  if (newUrl !== prevUrl) return "navigation";
  return "no-change";
}

/* ══════════════════════════════════════════════════════
   MAIN STREAM AGENT
══════════════════════════════════════════════════════ */
export const streamAgent = async (url, profile, extraFields, res, otpValue = "", sessionId = "") => {
  const send = (event, data) => {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch { /* client disconnected */ }
  };

  const merged = {
    ...profile,
    ...extraFields,
    name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
  };

  send("message", { message: "🌐 Starting browser…" });

  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    send("message", { message: `🔗 Opening ${url}…` });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(1800);
    send("message", { message: "✅ Page loaded — scanning form fields…" });

    const MAX_STEPS = 15;
    let stepNum     = 0;
    let totalFilled = 0;
    let noProgressCount = 0; // consecutive steps with 0 filled + no page change

    while (stepNum < MAX_STEPS) {
      stepNum++;

      // ── Success check ──
      const successSignal = await isSuccessPage(page);
      if (successSignal) {
        send("done", { success: true, confirmed: true, message: `✅ ${successSignal}` });
        res.end();
        await browser.close();
        return;
      }

      // ── Snapshot before filling ──
      const urlBefore        = page.url();
      const inputsBefore     = await getVisibleInputCount(page);

      // ── Fill fields ──
      send("message", { message: `📄 Step ${stepNum}: filling fields…` });
      const { filled, skipped } = await fillPageFields(page, merged, send);
      totalFilled += filled;
      send("message", { message: `✅ Step ${stepNum} complete — ${filled} filled, ${skipped} unmatched` });

      await page.waitForTimeout(400);

      // ── OTP check ──
      const pageText = (await page.evaluate(() => document.body.innerText).catch(() => "")).toLowerCase();
      if (pageText.includes("otp") || pageText.includes("verification code") || pageText.includes("one-time")) {
        send("message", { message: "🔐 OTP screen detected — waiting for code…" });
        const sessionSendFn = otpWaiters.get(`__send_${sessionId}`);
        if (sessionSendFn) sessionSendFn({ event: "otp_required", data: { hint: "Enter the OTP sent to your phone/email.", sessionId } });

        try {
          const otp = otpValue || await waitForOtp(sessionId, 120_000);
          const otpInput = await page.$([
            "input[type='number']", "input[name*='otp']", "input[id*='otp']",
            "input[placeholder*='OTP']", "input[placeholder*='code']",
            "input[autocomplete='one-time-code']",
          ].join(", "));
          if (otpInput) {
            await otpInput.fill(otp);
            await page.keyboard.press("Enter");
            send("message", { message: "✅ OTP submitted — continuing…" });
            await page.waitForTimeout(2000);
          }
        } catch {
          send("message", { message: "⚠️ OTP timeout — continuing…" });
        }
        noProgressCount = 0;
        continue;
      }

      // ── Find and click the right button ──
      const btn = await findActionButton(page);

      if (!btn) {
        // No action button found at all
        if (totalFilled > 0) {
          send("done", {
            success: true, confirmed: false,
            message: `⚠️ Filled ${totalFilled} field(s) but no submit button found. Please submit manually.`,
          });
        } else {
          send("done", {
            success: false, confirmed: false,
            message: "⚠️ No fillable fields and no submit button found. The form may require login or a manual step.",
          });
        }
        res.end();
        await browser.close();
        return;
      }

      send("message", { message: btn.type === "submit" ? "🚀 Clicking Submit…" : `➡️ Clicking Next…` });
      const urlAtClick    = page.url();
      const inputsAtClick = await getVisibleInputCount(page);

      await btn.el.scrollIntoViewIfNeeded();
      await btn.el.click();

      // Wait for page/step change
      const changeType = await waitForChange(page, urlAtClick, inputsAtClick);
      send("message", { message: `🔀 Change detected: ${changeType}` });

      if (btn.type === "submit") {
        // After submit, wait a moment then check for success
        await page.waitForTimeout(1500);
        const signal = await isSuccessPage(page);
        send("done", {
          success: true,
          confirmed: !!signal,
          message: signal
            ? `✅ ${signal}`
            : `⚠️ Form submitted (${totalFilled} fields filled). Please verify the page to confirm.`,
        });
        res.end();
        await browser.close();
        return;
      }

      // For "next" clicks — check if anything actually changed
      const urlAfter    = page.url();
      const inputsAfter = await getVisibleInputCount(page);
      const realChange  = (urlAfter !== urlAtClick) || (inputsAfter !== inputsAtClick);

      if (!realChange) {
        noProgressCount++;
        send("message", { message: `⚠️ No page change after click (attempt ${noProgressCount})` });

        if (noProgressCount >= 3) {
          // Stuck — likely all fields filled, just no submit button visible
          // Try scrolling down to reveal it
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(800);
          const btnAfterScroll = await findActionButton(page);
          if (btnAfterScroll?.type === "submit") {
            send("message", { message: "🚀 Found Submit after scroll — clicking…" });
            await btnAfterScroll.el.click();
            await page.waitForTimeout(1500);
            const signal = await isSuccessPage(page);
            send("done", {
              success: true, confirmed: !!signal,
              message: signal ? `✅ ${signal}` : `⚠️ Submitted. Please verify the page.`,
            });
          } else {
            send("done", {
              success: totalFilled > 0, confirmed: false,
              message: `⚠️ Filled ${totalFilled} field(s). Form appears stuck — please complete submission manually.`,
            });
          }
          res.end();
          await browser.close();
          return;
        }
      } else {
        noProgressCount = 0; // reset on real progress
      }
    }

    // Exceeded max steps — shouldn't normally reach here
    send("done", {
      success: totalFilled > 0, confirmed: false,
      message: `⚠️ Filled ${totalFilled} field(s) across ${stepNum} steps. Please verify and submit the remaining steps manually.`,
    });
    res.end();

  } catch (err) {
    console.error("[Agent] Fatal:", err.message);
    send("error", { message: "Agent crashed: " + err.message });
    res.end();
  } finally {
    if (browser) { try { await browser.close(); } catch { } }
  }
};
