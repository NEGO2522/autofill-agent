/**
 * AUTOSLAY AGENT — Content Script
 * This runs inside the webpage you are visiting.
 */

console.log("⚡ AutoSlay Agent is ready on this page.");

// Listen for messages from the popup (your React app)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "AUTOSLAY_FILL") {
    const profile = request.profile;
    console.log("🚀 Starting AutoFill with profile:", profile);
    
    fillForm(profile).then(results => {
      sendResponse({ status: "done", filled: results.filled });
    });
    return true; // Keep message channel open for async response
  }
});

/**
 * The actual filling logic
 */
async function fillForm(profile) {
  let filledCount = 0;

  // 1. Find all inputs/selects/textareas
  const elements = document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select");

  for (const el of elements) {
    // Skip if hidden or disabled
    if (el.offsetParent === null || el.disabled) continue;

    // Get field hints (id, name, placeholder, label text, and context)
    const hints = Array.from(new Set([
      el.id,
      el.name,
      el.placeholder,
      el.getAttribute("aria-label"),
      el.getAttribute("data-label"),
      el.getAttribute("title"),
      getLabelText(el),
      getContextText(el)
    ])).map(h => (h || "").toLowerCase().trim()).filter(Boolean);

    // Match hints against profile fields
    const value = findMatchingValue(hints, profile);

    if (value) {
      if (el.tagName === "SELECT") {
        selectOption(el, value);
      } else if (el.type === "checkbox" || el.type === "radio") {
        // Auto-check terms/policies if value is truthy (advanced)
        const combined = hints.join(" ");
        if (["terms", "privacy", "policy", "agree"].some(k => combined.includes(k))) {
           el.checked = true;
        }
      } else {
        el.value = value;
        // Trigger React/Vue change listeners
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      filledCount++;
      highlightField(el);
      // Small delay for realism & to allow page logic to react
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return { filled: filledCount };
}

/**
 * Enhanced matching logic
 */
function findMatchingValue(hints, profile) {
  const map = {
    firstName: ["first name", "firstname", "fname", "given name", "first_name"],
    lastName:  ["last name", "lastname", "lname", "surname", "family name", "last_name"],
    email:     ["email", "e-mail", "mail", "email address", "email_address"],
    phone:     ["phone", "mobile", "contact", "phonenumber", "phone_number", "whatsapp"],
    collegeName: ["college", "university", "school", "institution", "college_name", "university_name"],
    degreeName:  ["degree", "major", "program", "course", "degree_name", "stream"],
    year:        ["year", "semester", "current year", "current_year", "sem"],
    expectedGraduationYear: ["graduation year", "passout year", "batch", "expected graduation"],
    rollNumber:  ["roll number", "rollno", "student id", "enrollment"],
  };

  for (const [profKey, keywords] of Object.entries(map)) {
    // Check if any keyword matches any hint (fuzzy matching)
    if (keywords.some(k => hints.some(h => h.includes(k) || k.includes(h)))) {
      const val = profile[profKey];
      if (val && String(val).trim()) return String(val).trim();
    }
  }
  
  // Special case for full name if we don't have separate fields
  if (profile.firstName && profile.lastName) {
     const fullNameKeywords = ["full name", "fullname", "your name", "name"];
     if (fullNameKeywords.some(k => hints.some(h => h.includes(k) || k.includes(h)))) {
        return `${profile.firstName} ${profile.lastName}`;
     }
  }

  return null;
}

function getLabelText(el) {
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) return label.innerText;
  }
  const parentLabel = el.closest("label");
  if (parentLabel) return parentLabel.innerText;
  
  // Check previous elements for labels
  const prev = el.previousElementSibling;
  if (prev && ["LABEL", "SPAN", "P", "H3", "H4"].includes(prev.tagName)) return prev.innerText;

  return "";
}

function getContextText(el) {
  const container = el.closest("div, fieldset, section");
  if (container) {
    const text = container.innerText || "";
    // Return first 50 chars of nearby text as context
    return text.slice(0, 100);
  }
  return "";
}

function selectOption(el, value) {
  const options = Array.from(el.options);
  const best = options.find(o => 
    o.text.toLowerCase().includes(value.toLowerCase()) || 
    o.value.toLowerCase().includes(value.toLowerCase())
  );
  if (best) {
    el.value = best.value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function highlightField(el) {
  const original = el.style.boxShadow;
  el.style.boxShadow = "0 0 0 4px rgba(52, 211, 153, 0.4)";
  el.style.transition = "box-shadow 0.3s ease";
  setTimeout(() => el.style.boxShadow = original, 2000);
}
