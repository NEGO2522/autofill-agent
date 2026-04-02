import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

/* ══════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════ */
const T = {
  bg:      "#080808",
  surface: "#0f0f0f",
  border:  "rgba(255,255,255,0.08)",
  accent:  "#34d399",
  err:     "#f87171",
  font:    "Inter, ui-sans-serif, system-ui, sans-serif",
};

/* ══════════════════════════════════════════════════════
   CLOUDINARY CONFIG
══════════════════════════════════════════════════════ */
const CLOUDINARY_CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/* ══════════════════════════════════════════════════════
   PROFILE FIELDS — shown in the compact in-popup form
══════════════════════════════════════════════════════ */
const PROFILE_FIELDS = [
  { key: "firstName",              label: "First Name",             placeholder: "Arjun",                  required: true  },
  { key: "lastName",               label: "Last Name",              placeholder: "Sharma",                 required: true  },
  { key: "email",                  label: "Email",                  placeholder: "arjun@gmail.com",        required: true, type: "email" },
  { key: "phone",                  label: "Phone",                  placeholder: "+91 98765 43210",        required: true  },
  { key: "gender",                 label: "Gender",                 placeholder: "",                       required: false, select: ["Male", "Female", "Non-binary", "Prefer not to say"] },
  { key: "location",               label: "Location / City",        placeholder: "Jaipur, Rajasthan",      required: false },
  { key: "collegeName",            label: "College / University",   placeholder: "JECRC University",       required: true  },
  { key: "degreeName",             label: "Degree / Program",       placeholder: "B.Tech CS",              required: false },
  { key: "year",                   label: "Current Year",           placeholder: "3rd Year",               required: false },
  { key: "expectedGraduationYear", label: "Grad Year",              placeholder: "2026",                   required: false },
  { key: "rollNumber",             label: "Roll Number",            placeholder: "21EJCCS001",             required: false },
  { key: "skills",                 label: "Skills",                 placeholder: "React, Node, Python",    required: false },
  { key: "linkedin",               label: "LinkedIn URL",           placeholder: "linkedin.com/in/...",    required: false },
  { key: "github",                 label: "GitHub URL",             placeholder: "github.com/...",         required: false },
  { key: "bio",                    label: "About You",              placeholder: "Short bio…",             required: false, textarea: true },
];

const EMPTY = PROFILE_FIELDS.reduce((a, f) => { a[f.key] = ""; return a; }, {});

/* ══════════════════════════════════════════════════════
   CLOUDINARY UPLOAD HELPER
══════════════════════════════════════════════════════ */
const uploadToCloudinary = async (file, setProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "autofill-agent");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const r = JSON.parse(xhr.responseText);
        resolve({ url: r.secure_url, publicId: r.public_id });
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
    xhr.send(formData);
  });
};

/* ══════════════════════════════════════════════════════
   TINY SHARED PRIMITIVES
══════════════════════════════════════════════════════ */
function inputStyle(focused) {
  return {
    width: "100%", boxSizing: "border-box",
    borderRadius: "0.5rem",
    border: `1px solid ${focused ? "rgba(255,255,255,0.22)" : T.border}`,
    backgroundColor: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
    padding: "0.5rem 0.625rem",
    fontSize: "0.75rem",
    color: "white",
    outline: "none",
    transition: "border-color 0.15s, background 0.15s",
    fontFamily: T.font,
    resize: "vertical",
  };
}

function FieldLabel({ children, required }) {
  return (
    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
      {children}
      {required && <span style={{ color: T.err, marginLeft: 2 }}>*</span>}
    </label>
  );
}

function FieldInput({ field, value, onChange }) {
  const [foc, setFoc] = useState(false);
  const common = {
    value, onChange,
    placeholder: field.placeholder,
    onFocus: () => setFoc(true),
    onBlur:  () => setFoc(false),
    style: inputStyle(foc),
  };

  if (field.select) {
    return (
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFoc(true)}
        onBlur={() => setFoc(false)}
        style={{ ...inputStyle(foc), appearance: "none", cursor: "pointer", color: value ? "white" : "rgba(255,255,255,0.3)" }}
      >
        <option value="" disabled style={{ backgroundColor: "#1a1a1a" }}>Select…</option>
        {field.select.map(o => (
          <option key={o} value={o} style={{ backgroundColor: "#1a1a1a" }}>{o}</option>
        ))}
      </select>
    );
  }

  return field.textarea
    ? <textarea rows={2} {...common} />
    : <input type={field.type || "text"} {...common} />;
}

/* ── Yes / No radio group with custom labels ── */
function YesNoField({ label, yesLabel, noLabel, fieldKey, value, onChange }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {[{ val: "yes", display: yesLabel }, { val: "no", display: noLabel }].map(opt => {
          const active = value === opt.val;
          return (
            <button
              key={opt.val}
              type="button"
              onClick={() => onChange(fieldKey, opt.val)}
              style={{
                flex: 1,
                padding: "0.45rem 0",
                borderRadius: "0.5rem",
                border: active
                  ? `1px solid ${opt.val === "yes" ? "rgba(52,211,153,0.5)" : "rgba(248,113,113,0.5)"}`
                  : `1px solid ${T.border}`,
                backgroundColor: active
                  ? (opt.val === "yes" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)")
                  : "rgba(255,255,255,0.03)",
                color: active
                  ? (opt.val === "yes" ? T.accent : T.err)
                  : "rgba(255,255,255,0.4)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: T.font,
                transition: "all 0.15s",
              }}
            >
              {opt.display}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Resume / file upload card ── */
function ResumeUpload({ file, url, progress, uploading, onFileChange, onView }) {
  const inputRef = useRef();
  const hasFile  = !!file || !!url;

  return (
    <div>
      <FieldLabel required>Resume / CV</FieldLabel>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: hasFile ? "1px solid rgba(52,211,153,0.3)" : "1px dashed rgba(255,255,255,0.12)",
          borderRadius: "0.625rem",
          backgroundColor: hasFile ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.02)",
          padding: "0.875rem 0.75rem",
          cursor: uploading ? "wait" : "pointer",
          textAlign: "center",
          transition: "all 0.2s",
        }}
      >
        <input ref={inputRef} type="file" accept="application/pdf" style={{ display: "none" }}
          onChange={e => onFileChange(e.target.files[0])} />

        {uploading ? (
          <div>
            <div style={{ height: "3px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: "0.4rem" }}>
              <div style={{ height: "100%", width: `${progress}%`, backgroundColor: T.accent, borderRadius: "9999px", transition: "width 0.3s" }} />
            </div>
            <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)" }}>Uploading… {progress}%</p>
          </div>
        ) : url ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span style={{ color: T.accent }}>✅</span>
            <button onClick={e => { e.stopPropagation(); onView(); }}
              style={{ fontSize: "0.6875rem", color: T.accent, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: T.font }}>
              View uploaded
            </button>
            <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.25)" }}>· click to replace</span>
          </div>
        ) : file ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span>📄</span>
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.6)" }}>{file.name}</span>
          </div>
        ) : (
          <div>
            <p style={{ margin: "0 0 0.2rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.3)" }}>📎 Click to upload PDF</p>
            <p style={{ margin: 0, fontSize: "0.625rem", color: "rgba(255,255,255,0.15)" }}>Required · PDF only</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner({ size = 14, color = "white" }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      borderRadius: "50%",
      border: `2px solid rgba(255,255,255,0.15)`,
      borderTopColor: color,
      animation: "aSpin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

/* ══════════════════════════════════════════════════════
   SEND MESSAGE TO CONTENT SCRIPT (with ping-first)
══════════════════════════════════════════════════════ */
async function sendFill(tabId, profile) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { action: "AUTOSLAY_PING" }, (pingResp) => {
      if (chrome.runtime.lastError || !pingResp) {
        chrome.scripting.executeScript(
          { target: { tabId }, files: ["content.js"] },
          () => {
            if (chrome.runtime.lastError) {
              resolve({ error: "Cannot inject into this page. Try refreshing." });
              return;
            }
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, { action: "AUTOSLAY_FILL", profile }, (resp) => {
                if (chrome.runtime.lastError) {
                  resolve({ error: "Page refused connection. Try refreshing." });
                } else {
                  resolve(resp || { filled: 0 });
                }
              });
            }, 300);
          }
        );
      } else {
        chrome.tabs.sendMessage(tabId, { action: "AUTOSLAY_FILL", profile }, (resp) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            resolve(resp || { filled: 0 });
          }
        });
      }
    });
  });
}

/* ══════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════ */
export default function ExtensionPopup() {
  const [view,     setView]     = useState("loading");
  const [user,     setUser]     = useState(null);
  const [profile,  setProfile]  = useState(null);

  // Auth form state
  const [authMode,  setAuthMode]  = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass,  setAuthPass]  = useState("");
  const [authErr,   setAuthErr]   = useState("");
  const [authBusy,  setAuthBusy]  = useState(false);

  // Profile form state
  const [profData,  setProfData]  = useState({ ...EMPTY });
  const [profSaving,setProfSav]   = useState(false);
  const [profErr,   setProfErr]   = useState("");
  const [profSaved, setProfSaved] = useState(false);

  // Yes/No extra fields
  const [yesNoFields, setYesNoFields] = useState({
    firstHackathon: "",   // "yes" | "no"
    teamFormed:     "",
    dietaryNeeds:   "",
  });

  // Terms state — auto-checked
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Resume state
  const [resumeFile,     setResumeFile]     = useState(null);
  const [resumeURL,      setResumeURL]      = useState("");
  const [resumeProgress, setResumeProgress] = useState(0);
  const [resumeUploading,setResumeUploading]= useState(false);

  // Fill state
  const [filling,   setFilling]   = useState(false);
  const [fillResult,setFillResult]= useState(null);

  /* ── Auth listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setUser(null); setView("auth"); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, "profiles", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setProfData(prev => ({ ...prev, ...data }));
          if (data.resumeURL) setResumeURL(data.resumeURL);
          if (data.yesNoFields) setYesNoFields(prev => ({ ...prev, ...data.yesNoFields }));
          setView("ready");
        } else {
          setView("profile-setup");
        }
      } catch {
        setView("profile-setup");
      }
    });
    return unsub;
  }, []);

  /* ── Auth submit ── */
  const handleAuth = async () => {
    if (!authEmail || !authPass) { setAuthErr("Email and password required."); return; }
    setAuthBusy(true); setAuthErr("");
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, authEmail, authPass);
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPass);
      }
    } catch (e) {
      const raw = e.code?.replace("auth/", "").replace(/-/g, " ") || "Auth failed";
      setAuthErr(raw.charAt(0).toUpperCase() + raw.slice(1) + ".");
    } finally {
      setAuthBusy(false);
    }
  };

  /* ── Yes/No change helper ── */
  const handleYesNo = (key, val) => {
    setYesNoFields(p => ({ ...p, [key]: val }));
    setProfErr("");
  };

  /* ── Profile save ── */
  const handleSaveProfile = async () => {
    if (!profData.firstName || !profData.email) {
      setProfErr("First name and email are required.");
      return;
    }
    if (!termsAccepted) {
      setProfErr("Please accept the terms & conditions.");
      return;
    }

    setProfSav(true); setProfErr("");
    try {
      let finalResumeURL = resumeURL;

      // Upload resume if a new file was chosen
      if (resumeFile && CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
        setResumeUploading(true);
        try {
          const result = await uploadToCloudinary(resumeFile, setResumeProgress);
          finalResumeURL = result.url;
          setResumeURL(result.url);
        } catch (err) {
          setProfErr("Resume upload failed: " + err.message);
          setResumeUploading(false);
          setProfSav(false);
          return;
        }
        setResumeUploading(false);
      }

      const payload = {
        ...profData,
        yesNoFields,
        resumeURL: finalResumeURL || "",
        termsAccepted: true,
        uid: user.uid,
        email: user.email || profData.email,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "profiles", user.uid), payload);
      setProfile(payload);
      setProfSaved(true);

      // ── Click the "Next" button on the active page ──
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, { action: "AUTOSLAY_CLICK_NEXT" }, () => {});
        }
      } catch (_) {}

      setTimeout(() => {
        setProfSaved(false);
        setView("ready");
      }, 1200);
    } catch (e) {
      setProfErr("Save failed: " + e.message);
    } finally {
      setProfSav(false);
    }
  };

  /* ── Autofill trigger ── */
  const handleFill = async () => {
    setFilling(true); setFillResult(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab found.");
      const result = await sendFill(tab.id, profile);
      setFillResult(result);
    } catch (e) {
      setFillResult({ error: e.message });
    } finally {
      setFilling(false);
    }
  };

  /* ── Sign out ── */
  const handleSignOut = async () => {
    await signOut(auth);
    setProfile(null); setFillResult(null);
    setProfData({ ...EMPTY }); setResumeURL(""); setResumeFile(null);
    setYesNoFields({ firstHackathon: "", teamFormed: "", dietaryNeeds: "" });
    setView("auth");
  };

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <div style={{
      width: 360,
      backgroundColor: T.bg,
      color: "white",
      fontFamily: T.font,
      display: "flex",
      flexDirection: "column",
      minHeight: 480,
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes aSpin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 9999px; }
        button:active { opacity: 0.85; }
        select option { background: #1a1a1a; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.875rem 1rem",
        borderBottom: `1px solid ${T.border}`,
        backgroundColor: "rgba(255,255,255,0.02)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: 24, height: 24, borderRadius: "0.4375rem",
            backgroundColor: "white", color: "black",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.8125rem", fontWeight: 900, flexShrink: 0,
          }}>⚡</div>
          <span style={{ fontSize: "0.9375rem", fontWeight: 800, letterSpacing: "-0.02em" }}>AutoSlay</span>
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.3)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </span>
            {view === "ready" && (
              <button onClick={() => { setProfile(null); setView("profile-setup"); }} title="Edit profile"
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "2px 4px", fontSize: "0.75rem" }}>✏️</button>
            )}
            <button onClick={handleSignOut} title="Sign out"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", padding: "2px 4px", fontSize: "0.75rem" }}>↩</button>
          </div>
        )}
      </div>

      {/* ── LOADING ── */}
      {view === "loading" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner size={20} />
        </div>
      )}

      {/* ── AUTH ── */}
      {view === "auth" && (
        <div style={{ flex: 1, padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {authMode === "login" ? "Welcome back" : "Create account"}
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
              {authMode === "login" ? "Sign in to use AutoSlay" : "Start autofilling forms for free"}
            </p>
          </div>

          <div style={{ display: "flex", borderRadius: "0.625rem", border: `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.03)", padding: "3px", gap: "3px" }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setAuthErr(""); }}
                style={{ flex: 1, padding: "0.4375rem 0", borderRadius: "0.4375rem", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, backgroundColor: authMode === m ? "white" : "transparent", color: authMode === m ? "black" : "rgba(255,255,255,0.35)", transition: "all 0.15s" }}
              >{m === "login" ? "Sign In" : "Sign Up"}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>Email</label>
            <input type="email" value={authEmail} onChange={e => { setAuthEmail(e.target.value); setAuthErr(""); }} onKeyDown={e => e.key === "Enter" && handleAuth()} placeholder="you@example.com" style={inputStyle(false)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>Password</label>
            <input type="password" value={authPass} onChange={e => { setAuthPass(e.target.value); setAuthErr(""); }} onKeyDown={e => e.key === "Enter" && handleAuth()} placeholder={authMode === "signup" ? "Min. 6 chars" : "••••••••"} style={inputStyle(false)} />
          </div>

          {authErr && (
            <div style={{ borderRadius: "0.5rem", border: "1px solid rgba(248,113,113,0.2)", backgroundColor: "rgba(248,113,113,0.07)", padding: "0.5rem 0.625rem", fontSize: "0.75rem", color: T.err }}>
              {authErr}
            </div>
          )}

          <button onClick={handleAuth} disabled={authBusy}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem", borderRadius: "0.625rem", border: "none", backgroundColor: authBusy ? "rgba(255,255,255,0.07)" : "white", color: authBusy ? "rgba(255,255,255,0.3)" : "black", fontWeight: 700, fontSize: "0.875rem", cursor: authBusy ? "not-allowed" : "pointer", fontFamily: T.font }}
          >
            {authBusy && <Spinner size={14} color="rgba(0,0,0,0.5)" />}
            {authBusy ? "Please wait…" : authMode === "login" ? "Sign In" : "Create Account"}
          </button>

          <p style={{ margin: 0, textAlign: "center", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>
            {authMode === "login" ? "No account? " : "Have an account? "}
            <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthErr(""); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontWeight: 600, cursor: "pointer", fontSize: "inherit", padding: 0 }}
            >{authMode === "login" ? "Sign up free →" : "Sign in →"}</button>
          </p>

          <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
            <button onClick={() => window.open("https://autofill-agent.vercel.app", "_blank")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: "0.6875rem", cursor: "pointer", fontFamily: T.font }}>
              Open full dashboard ↗
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          ── PROFILE SETUP ──
      ══════════════════════════════════════════════ */}
      {view === "profile-setup" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1rem 0.5rem", flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700 }}>Complete Your Profile</p>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)" }}>
              Saved once — AutoSlay fills any form from this.
            </p>
          </div>

          {/* Scrollable fields */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

            {/* ── Standard text / select fields ── */}
            {PROFILE_FIELDS.map(field => (
              <div key={field.key}>
                <FieldLabel required={field.required}>{field.label}</FieldLabel>
                <FieldInput
                  field={field}
                  value={profData[field.key] || ""}
                  onChange={e => { setProfData(p => ({ ...p, [field.key]: e.target.value })); setProfErr(""); }}
                />
              </div>
            ))}

            {/* ── Resume upload ── */}
            <ResumeUpload
              file={resumeFile}
              url={resumeURL}
              progress={resumeProgress}
              uploading={resumeUploading}
              onFileChange={f => { setResumeFile(f); setResumeURL(""); setProfErr(""); }}
              onView={() => resumeURL && window.open(resumeURL, "_blank")}
            />

            {/* ────────────────────────────────────────
                YES / NO QUESTIONS  (differently labelled)
            ──────────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)" }}>
                Quick questions
              </p>

              {/* Q1 — first hackathon */}
              <YesNoField
                label="Is this your first hackathon?"
                yesLabel="🎉 First timer!"
                noLabel="🔥 Veteran"
                fieldKey="firstHackathon"
                value={yesNoFields.firstHackathon}
                onChange={handleYesNo}
              />

              {/* Q2 — team formed */}
              <YesNoField
                label="Have you already formed a team?"
                yesLabel="✅ Team ready"
                noLabel="🔍 Need team"
                fieldKey="teamFormed"
                value={yesNoFields.teamFormed}
                onChange={handleYesNo}
              />

              {/* Q3 — dietary needs */}
              <YesNoField
                label="Any dietary / accessibility needs?"
                yesLabel="Yes, I do"
                noLabel="No, all good"
                fieldKey="dietaryNeeds"
                value={yesNoFields.dietaryNeeds}
                onChange={handleYesNo}
              />
            </div>

            {/* ── Terms & Conditions (auto-checked) ── */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.625rem",
              borderRadius: "0.625rem",
              border: `1px solid ${termsAccepted ? "rgba(52,211,153,0.25)" : T.border}`,
              backgroundColor: termsAccepted ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.02)",
              padding: "0.625rem 0.75rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
              onClick={() => setTermsAccepted(v => !v)}
            >
              {/* Custom checkbox */}
              <div style={{
                width: 16, height: 16, flexShrink: 0,
                borderRadius: "0.3125rem",
                border: termsAccepted ? "1px solid rgba(52,211,153,0.6)" : `1px solid ${T.border}`,
                backgroundColor: termsAccepted ? T.accent : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: "0.05rem",
                transition: "all 0.15s",
              }}>
                {termsAccepted && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.2 7.2L8 3" stroke="#080808" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                I agree to the{" "}
                <button onClick={e => { e.stopPropagation(); window.open("https://autofill-agent.vercel.app/terms", "_blank"); }}
                  style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", padding: 0, fontFamily: T.font, fontSize: "inherit", textDecoration: "underline" }}>
                  Terms & Conditions
                </button>
                {" "}and{" "}
                <button onClick={e => { e.stopPropagation(); window.open("https://autofill-agent.vercel.app/privacy", "_blank"); }}
                  style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", padding: 0, fontFamily: T.font, fontSize: "inherit", textDecoration: "underline" }}>
                  Privacy Policy
                </button>
                .{" "}
                <span style={{ color: T.accent, fontSize: "0.625rem" }}>(auto-accepted)</span>
              </p>
            </div>

            {/* bottom spacer so last item isn't hidden behind footer */}
            <div style={{ height: "0.5rem" }} />
          </div>

          {/* Footer */}
          <div style={{ padding: "0.75rem 1rem", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {profErr && (
              <div style={{ borderRadius: "0.5rem", border: "1px solid rgba(248,113,113,0.2)", backgroundColor: "rgba(248,113,113,0.07)", padding: "0.4rem 0.625rem", fontSize: "0.6875rem", color: T.err }}>
                {profErr}
              </div>
            )}
            <button onClick={handleSaveProfile} disabled={profSaving || profSaved || resumeUploading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                padding: "0.6875rem", borderRadius: "0.625rem", border: "none",
                backgroundColor: profSaved ? "rgba(52,211,153,0.15)" : profSaving ? "rgba(255,255,255,0.07)" : "white",
                color: profSaved ? T.accent : profSaving ? "rgba(255,255,255,0.3)" : "black",
                fontWeight: 700, fontSize: "0.8125rem",
                cursor: (profSaving || resumeUploading) ? "not-allowed" : "pointer",
                border: profSaved ? `1px solid rgba(52,211,153,0.3)` : "none",
                fontFamily: T.font, transition: "all 0.2s",
              }}
            >
              {(profSaving || resumeUploading) && <Spinner size={13} color="rgba(0,0,0,0.5)" />}
              {profSaved
                ? "✅ Saved! Entering…"
                : (profSaving || resumeUploading)
                  ? "Saving…"
                  : "Next →"}
            </button>
          </div>
        </div>
      )}

      {/* ── READY / AGENT VIEW ── */}
      {view === "ready" && (
        <div style={{ flex: 1, padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Profile preview chip */}
          {profile && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.625rem",
              borderRadius: "0.75rem", border: `1px solid ${T.border}`,
              backgroundColor: "rgba(255,255,255,0.03)", padding: "0.625rem 0.75rem",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>👤</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                  {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Profile"}
                </p>
                <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile.location ? `📍 ${profile.location}` : profile.collegeName || profile.email || "—"}
                </p>
              </div>
              <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                <span style={{ fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(52,211,153,0.8)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "9999px", padding: "2px 8px", backgroundColor: "rgba(52,211,153,0.06)" }}>Ready</span>
              </div>
            </div>
          )}

          {/* Profile data chips */}
          <div style={{ borderRadius: "0.75rem", border: `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)" }}>
              Profile data ready
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {PROFILE_FIELDS
                .filter(f => profile?.[f.key])
                .map(f => (
                  <span key={f.key} style={{ fontSize: "0.5625rem", fontWeight: 600, padding: "2px 7px", borderRadius: "0.3125rem", border: `1px solid ${T.border}`, color: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.03)" }}>{f.label}</span>
                ))
              }
              {profile?.resumeURL && (
                <span style={{ fontSize: "0.5625rem", fontWeight: 600, padding: "2px 7px", borderRadius: "0.3125rem", border: "1px solid rgba(52,211,153,0.2)", color: T.accent, backgroundColor: "rgba(52,211,153,0.05)" }}>📄 Resume</span>
              )}
            </div>
          </div>

          {/* Fill result */}
          {fillResult && (
            <div style={{ borderRadius: "0.75rem", border: fillResult.error ? "1px solid rgba(248,113,113,0.2)" : "1px solid rgba(52,211,153,0.2)", backgroundColor: fillResult.error ? "rgba(248,113,113,0.06)" : "rgba(52,211,153,0.06)", padding: "0.75rem" }}>
              {fillResult.error ? (
                <p style={{ margin: 0, fontSize: "0.75rem", color: T.err }}>⚠️ {fillResult.error}</p>
              ) : (
                <>
                  <p style={{ margin: "0 0 0.375rem", fontSize: "0.8125rem", fontWeight: 700, color: T.accent }}>
                    ✅ Filled {fillResult.filled} field{fillResult.filled !== 1 ? "s" : ""}
                  </p>
                  {fillResult.log?.length > 0 && (
                    <div style={{ maxHeight: 80, overflowY: "auto" }}>
                      {fillResult.log.slice(0, 8).map((l, i) => (
                        <p key={i} style={{ margin: 0, fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{l}</p>
                      ))}
                      {fillResult.log.length > 8 && (
                        <p style={{ margin: 0, fontSize: "0.625rem", color: "rgba(255,255,255,0.25)" }}>+{fillResult.log.length - 8} more…</p>
                      )}
                    </div>
                  )}
                  {fillResult.filled === 0 && (
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)" }}>No matching fields found on this page.</p>
                  )}
                </>
              )}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Edit details button */}
          <button
            onClick={() => { setProfile(null); setView("profile-setup"); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "0.6875rem",
              borderRadius: "0.75rem",
              border: `1px solid ${T.border}`,
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 600, fontSize: "0.8125rem",
              cursor: "pointer",
              fontFamily: T.font,
              letterSpacing: "-0.01em",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = T.border; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit your details
          </button>

          {/* Main CTA */}
          <button onClick={handleFill} disabled={filling}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", padding: "0.9375rem", borderRadius: "0.875rem", border: "none", backgroundColor: filling ? "rgba(255,255,255,0.07)" : "white", color: filling ? "rgba(255,255,255,0.3)" : "black", fontWeight: 800, fontSize: "0.9375rem", cursor: filling ? "wait" : "pointer", boxShadow: filling ? "none" : "0 4px 16px rgba(0,0,0,0.4)", transition: "all 0.2s", fontFamily: T.font, letterSpacing: "-0.01em" }}
          >
            {filling && <Spinner size={16} color="rgba(255,255,255,0.5)" />}
            {filling ? "Filling form…" : "⚡ Fill This Page"}
          </button>

          {fillResult && !fillResult.error && !filling && (
            <p style={{ margin: 0, textAlign: "center", fontSize: "0.6875rem", color: "rgba(255,255,255,0.2)" }}>Click again to re-fill or update</p>
          )}
        </div>
      )}
    </div>
  );
}
