/**
 * FILLUX — Content Script (v2)
 * Runs inside every webpage. Listens for FILLUX_FILL from the popup.
 */

console.log("⚡ Fillux content script loaded.");

/* ══════════════════════════════════════════════════════
   COMPREHENSIVE FIELD MAP
   Each entry: { keys: string[], profile: keyof profile }
══════════════════════════════════════════════════════ */
const FIELD_MAP = [
  // Identity
  { keys: ["firstname","first_name","first name","fname","given name","given_name"],       profile: "firstName"               },
  { keys: ["lastname","last_name","last name","lname","surname","family name","last_name"], profile: "lastName"                },
  { keys: ["fullname","full_name","full name","your name","participant name","name","first & last name"],   profile: "__fullName"              },
  { keys: ["email","e-mail","mail","email address","emailaddress","email_address","email id","emailid"],     profile: "email"                   },
  { keys: ["phone","mobile","contact","phonenumber","phone_number","mobile number","contact number","whatsapp","ph","mob"], profile: "phone" },
  { keys: ["dob","date of birth","birth date","birthday","dateofbirth","date_of_birth"],   profile: "dob"                     },
  { keys: ["gender","sex","identity","identify as","your gender"],                                profile: "gender"                  },

  // Address
  { keys: ["address","address1","street","street address","house","addr"],                  profile: "address1"                },
  { keys: ["address2","apartment","suite","flat","apt"],                                    profile: "address2"                },
  { keys: ["city","town","district","location","city & state","city and state"],            profile: "city"                    },
  { keys: ["state","province","region"],                                                    profile: "state"                   },
  { keys: ["pincode","zip","postal","zipcode","postalcode","pin","zip code","postal code"], profile: "pincode"                 },
  { keys: ["country"],                                                                      profile: "country"                 },

  // Education
  { keys: ["college","university","institution","school","collegename","university name","institute","college name","clg"], profile: "collegeName" },
  { keys: ["degree","qualification","program","course","branch","degreename","degree name","stream","major"],               profile: "degreeName"  },
  { keys: ["current year","currentyear","study year","yearofstudy","year of study","semester","sem","year of study"],       profile: "year"        },
  { keys: ["graduation year","graduationyear","passing year","passout","passout year","expected graduation","graduating year","batch","passout_year"], profile: "expectedGraduationYear" },
  { keys: ["rollno","roll","rollnumber","roll number","student id","enrollment","registrationnumber","reg no","reg_no","roll_no"], profile: "rollNumber" },
  { keys: ["cgpa","gpa","percentage","marks","score","aggregate","grades"],                 profile: "cgpa"                    },

  // Professional
  { keys: ["organization","org","company","employer","workplace","company name","organisation"], profile: "organization"       },
  { keys: ["jobtitle","job title","designation","job role","position","title"],             profile: "jobTitle"                },
  { keys: ["experience","work experience","years of experience","exp","yoe"],               profile: "experience"              },
  { keys: ["skills","technical skills","technologies","tech stack","expertise","skillset","skill set","tools"], profile: "skills" },
  { keys: ["ctc","current ctc","current salary","salary","package"],                        profile: "ctc"                     },
  { keys: ["expectedctc","expected ctc","expected salary","expected package"],              profile: "expectedCtc"             },
  { keys: ["notice","notice period","noticeperiod","availability","joining"],               profile: "noticePeriod"            },

  // Social / Links
  { keys: ["linkedin","linkedin url","linkedin profile","linkedin_url"],                    profile: "linkedin"                },
  { keys: ["github","github url","github profile","github link","github_url"],              profile: "github"                  },
  { keys: ["portfolio","website","personal website","portfolio url","personal site"],       profile: "portfolio"               },
  { keys: ["twitter","twitter handle","twitter url","twitter_url"],                         profile: "twitter"                 },
  { keys: ["leetcode","leetcode url","leetcode profile"],                                   profile: "leetcode"                },
  { keys: ["instagram","instagram url","instagram handle"],                                 profile: "instagram"               },

  // Hackathon / Team
  { keys: ["team name","teamname","team_name","your team"],                                 profile: "teamName"                },
  { keys: ["team size","teamsize","team_size","no of members","number of members"],         profile: "teamSize"                },
  { keys: ["team role","teamrole","your role","role in team","team_role"],                  profile: "teamRole"                },
  { keys: ["project name","projectname","project title","project_name"],                    profile: "projectName"             },
  { keys: ["project description","projectdescription","project idea","idea","abstract","project abstract","project_description"], profile: "projectDescription" },
  { keys: ["github repo","githublink","repo link","repository","repo url","github repository"], profile: "github"              },
  { keys: ["demo link","demolink","demo url","live link","deployed link","demo_link"],      profile: "demoLink"                },
  { keys: ["achievements","achievement","awards","accomplishments"],                         profile: "achievements"            },

  // Documents
  { keys: ["resume","cv","resume url","resume link","resumeurl","resume_url","upload resume"], profile: "resumeURL"            },

  // Bio / Long-form
  { keys: ["bio","about","about you","about yourself","introduction","intro","tell us about yourself","describe yourself"], profile: "bio" },
  { keys: ["why us","whyus","why do you want","motivation","why join","why hackathon","why participate","why_us"],          profile: "whyUs" },
  { keys: ["strengths","strength","your strengths","key strengths"],                        profile: "strengths"               },
  { keys: ["hobbies","hobby","interests","interest","passions"],                             profile: "hobbies"                 },
  { keys: ["message","additional info","anything else","comments","remarks","other details","additional comments"], profile: "message" },

  // Yes/No questions (Hackathon specific)
  { keys: ["first hackathon","first time","first timer","have you ever been"],               profile: "firstHackathon"          },
  { keys: ["team ready","formed a team","team formed","pre-formed team"],                    profile: "teamFormed"              },
  { keys: ["dietary","food","vegetarian","meal","allergy","accessibility"],                  profile: "dietaryNeeds"            },
];

const AUTO_CHECK_KEYWORDS = [
  "terms","condition","privacy","policy","agree","consent",
  "accept","certify","confirm","acknowledge","newsletter",
  "code of conduct","mlh","18","above","rules"
];

/* ══════════════════════════════════════════════════════
   REACT-COMPATIBLE VALUE SETTER
   Standard el.value = x won't trigger React's onChange.
   We use the native input value descriptor trick.
══════════════════════════════════════════════════════ */
function setNativeValue(el, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
    "value"
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event("input",  { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keydown",  { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keyup",    { bubbles: true }));
}

/* ══════════════════════════════════════════════════════
   GET FIELD HINTS FROM A DOM ELEMENT
══════════════════════════════════════════════════════ */
function getFieldHints(el) {
  const raw = [];
  const add = (v) => {
    if (v && typeof v === "string") {
      const clean = v.toLowerCase().trim().replace(/[:*]/g, "");
      if (clean) raw.push(clean);
    }
  };

  add(el.name);
  add(el.id);
  add(el.placeholder);
  add(el.getAttribute("aria-label"));
  add(el.getAttribute("data-label"));
  add(el.getAttribute("data-field"));
  add(el.getAttribute("title"));
  add(el.getAttribute("autocomplete"));

  // Associated <label for="id">
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl) add(lbl.innerText);
  }

  // aria-labelledby
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    labelledBy.split(/\s+/).forEach(id => {
      const lbl = document.getElementById(id);
      if (lbl) add(lbl.innerText);
    });
  }

  // Wrapping <label>
  const parentLabel = el.closest("label");
  if (parentLabel) add(parentLabel.innerText);

  // Google Forms & modern apps: walk up and find "label-like" text
  // We look for a container that might contain both the label and the input
  let runner = el.parentElement;
  let depth = 0;
  while (runner && depth < 5) {
    // Check for role="heading" or common label classes
    const heading = runner.querySelector('[role="heading"], [role="label"], .M7pj6b, .m7ZMe');
    if (heading) {
      add(heading.innerText);
      break; 
    }
    
    // If we find text that isn't too long, it might be the label
    const text = runner.innerText?.split("\n")[0]?.trim();
    if (text && text.length > 1 && text.length < 100) {
      // Avoid taking current input's value as hint
      if (text !== el.value) add(text);
    }

    runner = runner.parentElement;
    depth++;
  }

  // Next sibling that looks like a label (common for radio/checkbox)
  const next = el.nextElementSibling;
  if (next && ["LABEL","SPAN","P","H3","H4","DIV"].includes(next.tagName)) {
    const t = next.innerText?.trim();
    if (t && t.length < 80) add(t);
  }

  // Parent's text (if short)
  if (el.parentElement) {
    const pt = el.parentElement.innerText?.split("\n")[0]?.trim();
    if (pt && pt.length > 1 && pt.length < 100) add(pt);
  }

  return [...new Set(raw)].filter(h => h.length > 0 && h.length < 120);
}

/* ══════════════════════════════════════════════════════
   MATCH HINTS → PROFILE VALUE
══════════════════════════════════════════════════════ */
function findProfileValue(hints, profile) {
  // Build helper fields
  const fullProfile = {
    ...profile,
    ...(profile.yesNoFields || {}),
    __fullName: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
  };

  for (const entry of FIELD_MAP) {
    for (const keyword of entry.keys) {
      for (const hint of hints) {
        if (hint.includes(keyword) || keyword.includes(hint)) {
          // Try primary profile key
          let val = fullProfile[entry.profile];
          
          // Mismatch fallbacks
          if (!val && entry.profile === "city") val = profile.location;
          if (!val && entry.profile === "state") val = profile.location;
          if (!val && entry.profile === "pincode") val = profile.zip || profile.zipcode;
          
          if (val && String(val).trim()) return String(val).trim();
        }
      }
    }
  }
  return null;
}

/* ══════════════════════════════════════════════════════
   SELECT OPTION HELPER
══════════════════════════════════════════════════════ */
function selectBestOption(el, value) {
  const options = Array.from(el.options);
  const v = value.toLowerCase();

  // 1. Exact value match
  let best = options.find(o => o.value.toLowerCase() === v);
  // 2. Exact text match
  if (!best) best = options.find(o => o.text.toLowerCase() === v);
  // 3. Text includes value
  if (!best) best = options.find(o => o.text.toLowerCase().includes(v));
  // 4. Value includes option text
  if (!best) best = options.find(o => v.includes(o.text.toLowerCase()) && o.text.length > 2);

  if (best) {
    el.value = best.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  return false;
}

/* ══════════════════════════════════════════════════════
   HIGHLIGHT HELPER
══════════════════════════════════════════════════════ */
function highlight(el) {
  const prev = el.style.outline;
  el.style.outline = "2px solid rgba(52,211,153,0.8)";
  el.style.outlineOffset = "2px";
  setTimeout(() => {
    el.style.outline = prev;
    el.style.outlineOffset = "";
  }, 2500);
}

/* ══════════════════════════════════════════════════════
   MAIN FILL FUNCTION
══════════════════════════════════════════════════════ */
async function fillForm(profile) {
  let filled = 0;
  const log = [];

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

// All visible, interactive form elements
  const selector = [
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='image'])",
    "textarea",
    "select",
    "input[type='checkbox']",
    "input[type='radio']",
    "[role='checkbox']",
    "[role='radio']",
    "[role='option']",
    ".whsOnd", // Google Forms specialized inputs
  ].join(", ");

  const elements = Array.from(document.querySelectorAll(selector));

  for (const el of elements) {
    // Skip invisible / disabled / readonly
    // Note: Some custom elements might have 0 offsetParent but be visible via ARIA
    const isCustom = el.getAttribute("role") || el.classList.contains("whsOnd");
    if (el.offsetParent === null && el.type !== "hidden" && !isCustom) continue;
    if (el.disabled || el.getAttribute("aria-disabled") === "true") continue;
    if (el.readOnly) continue;

    const hints = getFieldHints(el);
    if (hints.length === 0) continue;

    // ── Checkbox (Standard & Custom) ──
    if (el.type === "checkbox" || el.getAttribute("role") === "checkbox") {
      const combined = hints.join(" ");
      if (AUTO_CHECK_KEYWORDS.some(k => combined.includes(k))) {
        const isChecked = el.type === "checkbox" ? el.checked : (el.getAttribute("aria-checked") === "true");
        if (!isChecked) {
          el.click();
          log.push(`☑️ Checked: ${hints[0]}`);
          filled++;
          await delay(60);
        }
      }
      continue;
    }

    // ── Radio (Standard & Custom) ──
    if (el.type === "radio" || el.getAttribute("role") === "radio") {
      const value = findProfileValue(hints, profile);
      if (value) {
        const profileVal = value.toLowerCase();
        
        // Match if the profile value is mentioned in this specific radio button's hints
        // but the hint shouldn't JUST be the group name (like 'gender')
        const isMatch = hints.some(h => {
          const hh = h.toLowerCase();
          // The hint must contain the profile value (e.g., 'male')
          return (hh.includes(profileVal) || profileVal.includes(hh)) && hh.length > 1;
        });

        if (isMatch) {
          const isSelected = el.type === "radio" ? el.checked : (el.getAttribute("aria-checked") === "true");
          if (!isSelected) {
            el.click();
            log.push(`🔘 Selected radio: ${hints[0]} → ${value}`);
            filled++;
            await delay(60);
          }
        }
      }
      continue;
    }

    // ── Select dropdown ──
    if (el.tagName === "SELECT") {
      const value = findProfileValue(hints, profile);
      if (value) {
        const ok = selectBestOption(el, value);
        if (ok) {
          log.push(`📋 Selected: ${hints[0]} → ${value}`);
          highlight(el);
          filled++;
          await delay(80);
        }
      }
      continue;
    }

    // ── Text / email / tel / number / textarea ──
    const value = findProfileValue(hints, profile);
    if (value) {
      el.focus();
      setNativeValue(el, value);
      el.blur();
      highlight(el);
      log.push(`✏️ Filled: ${hints[0]} → ${value.slice(0, 40)}${value.length > 40 ? "…" : ""}`);
      filled++;
      await delay(80);
    }
  }

  return { filled, log };
}

/* ══════════════════════════════════════════════════════
   MESSAGE LISTENER
══════════════════════════════════════════════════════ */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FILLUX_FILL") {
    console.log("⚡ Fillux: Starting fill with profile keys:", Object.keys(request.profile));
    fillForm(request.profile).then(({ filled, log }) => {
      console.log(`⚡ Fillux: Filled ${filled} fields.`, log);
      sendResponse({ status: "done", filled, log });
    }).catch(err => {
      console.error("⚡ Fillux fill error:", err);
      sendResponse({ status: "error", filled: 0, log: [] });
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === "FILLUX_PING") {
    sendResponse({ status: "ready" });
    return true;
  }
});
