import { useState, useEffect } from "react";
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
   PROFILE FIELDS — shown in the compact in-popup form
══════════════════════════════════════════════════════ */
const PROFILE_FIELDS = [
  { key: "firstName",              label: "First Name",             placeholder: "Arjun",                  required: true  },
  { key: "lastName",               label: "Last Name",              placeholder: "Sharma",                 required: true  },
  { key: "email",                  label: "Email",                  placeholder: "arjun@gmail.com",        required: true, type: "email" },
  { key: "phone",                  label: "Phone",                  placeholder: "+91 98765 43210",        required: true  },
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

function FieldInput({ field, value, onChange }) {
  const [foc, setFoc] = useState(false);
  const common = {
    value, onChange,
    placeholder: field.placeholder,
    onFocus: () => setFoc(true),
    onBlur:  () => setFoc(false),
    style: inputStyle(foc),
  };
  return field.textarea
    ? <textarea rows={2} {...common} />
    : <input type={field.type || "text"} {...common} />;
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
    // First ping to see if content script is alive
    chrome.tabs.sendMessage(tabId, { action: "AUTOSLAY_PING" }, (pingResp) => {
      if (chrome.runtime.lastError || !pingResp) {
        // Content script not injected yet — inject it programmatically
        chrome.scripting.executeScript(
          { target: { tabId }, files: ["content.js"] },
          () => {
            if (chrome.runtime.lastError) {
              resolve({ error: "Cannot inject into this page. Try refreshing." });
              return;
            }
            // Give it a moment then send fill
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
        // Content script is live — send fill directly
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
  // view: "loading" | "auth" | "profile-setup" | "ready"
  const [view,     setView]     = useState("loading");
  const [user,     setUser]     = useState(null);
  const [profile,  setProfile]  = useState(null);

  // Auth form state
  const [authMode,  setAuthMode]  = useState("login"); // "login" | "signup"
  const [authEmail, setAuthEmail] = useState("");
  const [authPass,  setAuthPass]  = useState("");
  const [authErr,   setAuthErr]   = useState("");
  const [authBusy,  setAuthBusy]  = useState(false);

  // Profile form state
  const [profData,  setProfData]  = useState({ ...EMPTY });
  const [profSaving,setProfSav]   = useState(false);
  const [profErr,   setProfErr]   = useState("");
  const [profSaved, setProfSaved] = useState(false);

  // Fill state
  const [filling,   setFilling]   = useState(false);
  const [fillResult,setFillResult]= useState(null); // { filled, log } | { error }

  /* ── Auth listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setView("auth");
        return;
      }
      setUser(u);
      // Load profile
      try {
        const snap = await getDoc(doc(db, "profiles", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setProfData(prev => ({ ...prev, ...data }));
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
      // onAuthStateChanged will fire and move us forward
    } catch (e) {
      const raw = e.code?.replace("auth/", "").replace(/-/g, " ") || "Auth failed";
      setAuthErr(raw.charAt(0).toUpperCase() + raw.slice(1) + ".");
    } finally {
      setAuthBusy(false);
    }
  };

  /* ── Profile save ── */
  const handleSaveProfile = async () => {
    if (!profData.firstName || !profData.email) {
      setProfErr("First name and email are required.");
      return;
    }
    setProfSav(true); setProfErr("");
    try {
      const payload = {
        ...profData,
        uid: user.uid,
        email: user.email || profData.email,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "profiles", user.uid), payload);
      setProfile(payload);
      setProfSaved(true);
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
    setFilling(true);
    setFillResult(null);
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
    setProfile(null);
    setFillResult(null);
    setProfData({ ...EMPTY });
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
      `}</style>

      {/* ── Header (always shown) ── */}
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
              <button
                onClick={() => { setProfile(null); setView("profile-setup"); }}
                title="Edit profile"
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "2px 4px", fontSize: "0.75rem" }}
              >✏️</button>
            )}
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", padding: "2px 4px", fontSize: "0.75rem" }}
            >↩</button>
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

          {/* Mode toggle */}
          <div style={{ display: "flex", borderRadius: "0.625rem", border: `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.03)", padding: "3px", gap: "3px" }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setAuthErr(""); }}
                style={{
                  flex: 1, padding: "0.4375rem 0",
                  borderRadius: "0.4375rem", border: "none", cursor: "pointer",
                  fontSize: "0.75rem", fontWeight: 600,
                  backgroundColor: authMode === m ? "white" : "transparent",
                  color: authMode === m ? "black" : "rgba(255,255,255,0.35)",
                  transition: "all 0.15s",
                }}
              >{m === "login" ? "Sign In" : "Sign Up"}</button>
            ))}
          </div>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>Email</label>
            <input
              type="email" value={authEmail}
              onChange={e => { setAuthEmail(e.target.value); setAuthErr(""); }}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              placeholder="you@example.com"
              style={inputStyle(false)}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>Password</label>
            <input
              type="password" value={authPass}
              onChange={e => { setAuthPass(e.target.value); setAuthErr(""); }}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              placeholder={authMode === "signup" ? "Min. 6 chars" : "••••••••"}
              style={inputStyle(false)}
            />
          </div>

          {authErr && (
            <div style={{ borderRadius: "0.5rem", border: "1px solid rgba(248,113,113,0.2)", backgroundColor: "rgba(248,113,113,0.07)", padding: "0.5rem 0.625rem", fontSize: "0.75rem", color: T.err }}>
              {authErr}
            </div>
          )}

          <button onClick={handleAuth} disabled={authBusy}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "0.75rem", borderRadius: "0.625rem", border: "none",
              backgroundColor: authBusy ? "rgba(255,255,255,0.07)" : "white",
              color: authBusy ? "rgba(255,255,255,0.3)" : "black",
              fontWeight: 700, fontSize: "0.875rem", cursor: authBusy ? "not-allowed" : "pointer",
              fontFamily: T.font,
            }}
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

          {/* Web dashboard link */}
          <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
            <button
              onClick={() => window.open("https://autofill-agent.vercel.app", "_blank")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: "0.6875rem", cursor: "pointer", fontFamily: T.font }}
            >Open full dashboard ↗</button>
          </div>
        </div>
      )}

      {/* ── PROFILE SETUP ── */}
      {view === "profile-setup" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1rem 0.5rem", flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700 }}>Complete Your Profile</p>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)" }}>
              Saved once — AutoSlay fills any form from this.
            </p>
          </div>

          {/* Scrollable fields */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {PROFILE_FIELDS.map(field => (
              <div key={field.key}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
                  {field.label}
                  {field.required && <span style={{ color: T.err, marginLeft: 2 }}>*</span>}
                </label>
                <FieldInput
                  field={field}
                  value={profData[field.key] || ""}
                  onChange={e => { setProfData(p => ({ ...p, [field.key]: e.target.value })); setProfErr(""); }}
                />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: "0.75rem 1rem", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {profErr && (
              <div style={{ borderRadius: "0.5rem", border: "1px solid rgba(248,113,113,0.2)", backgroundColor: "rgba(248,113,113,0.07)", padding: "0.4rem 0.625rem", fontSize: "0.6875rem", color: T.err }}>
                {profErr}
              </div>
            )}
            <button onClick={handleSaveProfile} disabled={profSaving || profSaved}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                padding: "0.6875rem", borderRadius: "0.625rem", border: "none",
                backgroundColor: profSaved ? "rgba(52,211,153,0.15)" : profSaving ? "rgba(255,255,255,0.07)" : "white",
                color: profSaved ? T.accent : profSaving ? "rgba(255,255,255,0.3)" : "black",
                fontWeight: 700, fontSize: "0.8125rem", cursor: profSaving ? "not-allowed" : "pointer",
                border: profSaved ? `1px solid rgba(52,211,153,0.3)` : "none",
                fontFamily: T.font, transition: "all 0.2s",
              }}
            >
              {profSaving && <Spinner size={13} color="rgba(0,0,0,0.5)" />}
              {profSaved ? "✅ Saved! Entering…" : profSaving ? "Saving…" : "💾 Save & Start Autofilling"}
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
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem", flexShrink: 0,
              }}>👤</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                  {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Profile"}
                </p>
                <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile.collegeName || profile.email || "—"}
                </p>
              </div>
              <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                <span style={{
                  fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.12em", color: "rgba(52,211,153,0.8)",
                  border: "1px solid rgba(52,211,153,0.2)", borderRadius: "9999px",
                  padding: "2px 8px", backgroundColor: "rgba(52,211,153,0.06)",
                }}>Ready</span>
              </div>
            </div>
          )}

          {/* What gets filled */}
          <div style={{
            borderRadius: "0.75rem", border: `1px solid ${T.border}`,
            backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem",
          }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)" }}>
              Profile data ready
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {PROFILE_FIELDS
                .filter(f => profile?.[f.key])
                .map(f => (
                  <span key={f.key} style={{
                    fontSize: "0.5625rem", fontWeight: 600,
                    padding: "2px 7px", borderRadius: "0.3125rem",
                    border: `1px solid ${T.border}`,
                    color: "rgba(255,255,255,0.4)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                  }}>{f.label}</span>
                ))
              }
            </div>
          </div>

          {/* Fill result banner */}
          {fillResult && (
            <div style={{
              borderRadius: "0.75rem",
              border: fillResult.error
                ? "1px solid rgba(248,113,113,0.2)"
                : "1px solid rgba(52,211,153,0.2)",
              backgroundColor: fillResult.error
                ? "rgba(248,113,113,0.06)"
                : "rgba(52,211,153,0.06)",
              padding: "0.75rem",
            }}>
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
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)" }}>
                      No matching fields found on this page.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Main CTA */}
          <button
            onClick={handleFill}
            disabled={filling}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
              padding: "0.9375rem", borderRadius: "0.875rem", border: "none",
              backgroundColor: filling ? "rgba(255,255,255,0.07)" : "white",
              color: filling ? "rgba(255,255,255,0.3)" : "black",
              fontWeight: 800, fontSize: "0.9375rem",
              cursor: filling ? "wait" : "pointer",
              boxShadow: filling ? "none" : "0 4px 16px rgba(0,0,0,0.4)",
              transition: "all 0.2s", fontFamily: T.font,
              letterSpacing: "-0.01em",
            }}
          >
            {filling && <Spinner size={16} color="rgba(255,255,255,0.5)" />}
            {filling ? "Filling form…" : "⚡ Fill This Page"}
          </button>

          {/* Refill hint */}
          {fillResult && !fillResult.error && !filling && (
            <p style={{ margin: 0, textAlign: "center", fontSize: "0.6875rem", color: "rgba(255,255,255,0.2)" }}>
              Click again to re-fill or update
            </p>
          )}
        </div>
      )}
    </div>
  );
}
