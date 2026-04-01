import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { runAgent } from "../api/agent";
import { EMPTY_PROFILE } from "./Form";

/* ══════════════════════════════════════════════════════
   STEP TRACKER
══════════════════════════════════════════════════════ */
const STEPS = [
  { id: 1, label: "Opening website",          icon: "🌐" },
  { id: 2, label: "Detecting all fields",     icon: "🔍" },
  { id: 3, label: "Filling personal info",    icon: "✍️"  },
  { id: 4, label: "Filling professional info",icon: "💼" },
  { id: 5, label: "Filling extra fields",     icon: "📋" },
  { id: 6, label: "Submitting form",          icon: "🚀" },
];

const STEP_KEYWORDS = [
  [6, ["submit","privacy","checkbox","send","done","finish","complet","success","thank"]],
  [5, ["message","textarea","bio","project","team","description","cover","additional"]],
  [4, ["phone","mobile","company","organisation","org","linkedin","github","skills","experience","education","university"]],
  [3, ["first name","last name","email","mail","name","gender","dob","address","city","state"]],
  [2, ["detect","scan","field","form","inspect","analy","find"]],
  [1, ["open","navigat","load","visit","browse","url","website","page"]],
];

function guessStep(message, currentStep) {
  if (!message) return null;
  const low = message.toLowerCase();
  for (const [id, keywords] of STEP_KEYWORDS) {
    if (id <= currentStep) continue;
    if (keywords.some(k => low.includes(k))) return id;
  }
  return null;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function formatTime(ts) {
  return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ══════════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════════ */
const S = {
  bg:      "#080808",
  bgPanel: "#0c0c0c",
  border:  "1px solid rgba(255,255,255,0.07)",
  font:    "Inter, ui-sans-serif, system-ui, sans-serif",
};

/* ══════════════════════════════════════════════════════
   AGENT-REPORTED MISSING FIELDS PANEL
  (only shown when the agent finds fields on the real page
   that have no matching value in the user's profile)
══════════════════════════════════════════════════════ */
// (no pre-run heuristic — fields come from the agent after it scans the page)

/* ══════════════════════════════════════════════════════
   TINY SHARED COMPONENTS
══════════════════════════════════════════════════════ */
function Label({ children }) {
  return (
    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)" }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, type = "text", placeholder, disabled }) {
  const [foc, setFoc] = useState(false);
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} disabled={disabled}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: "0.625rem",
        border: foc ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.09)",
        backgroundColor: foc ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
        padding: "0.6875rem 0.875rem", fontSize: "0.8125rem", color: "white",
        outline: "none", opacity: disabled ? 0.4 : 1,
        transition: "border-color 0.2s, background-color 0.2s", fontFamily: S.font,
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, disabled, rows = 3 }) {
  const [foc, setFoc] = useState(false);
  return (
    <textarea placeholder={placeholder} value={value} onChange={onChange} disabled={disabled} rows={rows}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: "0.625rem",
        border: foc ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.09)",
        backgroundColor: foc ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
        padding: "0.6875rem 0.875rem", fontSize: "0.8125rem", color: "white",
        outline: "none", resize: "vertical", opacity: disabled ? 0.4 : 1,
        fontFamily: S.font, transition: "border-color 0.2s, background-color 0.2s",
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   HISTORY CARD
══════════════════════════════════════════════════════ */
function HistoryCard({ entry, onRerun }) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess     = entry.status === "success";
  const isError       = entry.status === "error";
  const isUnconfirmed = entry.status === "unconfirmed";
  const statusColor = isSuccess ? "#34d399" : isError ? "#f87171" : isUnconfirmed ? "#fbbf24" : "rgba(255,255,255,0.4)";
  const statusBg    = isSuccess ? "rgba(52,211,153,0.06)" : isError ? "rgba(248,113,113,0.06)" : isUnconfirmed ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.04)";
  const statusBdr   = isSuccess ? "rgba(52,211,153,0.2)" : isError ? "rgba(248,113,113,0.2)" : isUnconfirmed ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.08)";
  const statusLabel = isSuccess ? "✅ Confirmed" : isError ? "❌ Failed" : isUnconfirmed ? "⚠️ Unconfirmed" : "⚪ Unknown";

  let displayUrl = entry.url;
  try { displayUrl = new URL(entry.url).hostname + new URL(entry.url).pathname; } catch {}

  return (
    <div style={{ borderRadius: "0.875rem", border: S.border, backgroundColor: "#0f0f0f", overflow: "hidden" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
    >
      <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => setExpanded(x => !x)}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: statusColor }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayUrl}</p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)" }}>{entry.profile.firstName} {entry.profile.lastName} · {entry.profile.email}</p>
        </div>
        <span style={{ flexShrink: 0, fontSize: "0.625rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "0.375rem", border: `1px solid ${statusBdr}`, backgroundColor: statusBg, color: statusColor }}>{statusLabel}</span>
        <span style={{ flexShrink: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.2)" }}>{timeAgo(entry.timestamp)}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {expanded && (
        <div style={{ borderTop: S.border }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { label: "Full Name",    val: `${entry.profile.firstName||""} ${entry.profile.lastName||""}`.trim() || "—" },
              { label: "Email",        val: entry.profile.email     || "—" },
              { label: "Phone",        val: entry.profile.phone     || "—" },
              { label: "Organization", val: entry.profile.organization || "—" },
              { label: "Skills",       val: entry.profile.skills    || "—" },
              { label: "Run at",       val: formatTime(entry.timestamp) },
            ].map(({ label, val }) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)" }}>{label}</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", wordBreak: "break-all" }}>{val}</p>
              </div>
            ))}
          </div>
          {entry.logs.length > 0 && (
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)" }}>Agent log</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", maxHeight: 120, overflowY: "auto" }}>
                {entry.logs.slice(-10).map((line, i) => (
                  <div key={i} style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", lineHeight: 1.5 }}>
                    <span style={{ color: "rgba(255,255,255,0.12)", marginRight: "0.375rem" }}>›</span>{line}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ padding: "0.75rem 1.25rem" }}>
            <button onClick={() => onRerun(entry)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", cursor: "pointer", transition: "all 0.15s", fontFamily: S.font }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >↩ Re-run this form</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AGENT-REQUESTED MISSING FIELDS PANEL
  Shown mid-run when the agent finds fields on the REAL page
  that have no match in the user profile.
  Fields come from the agent — NOT from URL guessing.
══════════════════════════════════════════════════════ */
function AgentMissingFieldsPanel({ agentFields, tempValues, onChange, onNavigate }) {
  // agentFields: [{ label, type, required }] from the agent's NEEDS_INPUT event
  if (!agentFields || agentFields.length === 0) return null;

  return (
    <div style={{ margin: "0.875rem 1.25rem 0", borderRadius: "0.875rem", border: "1px solid rgba(251,191,36,0.25)", backgroundColor: "rgba(251,191,36,0.04)", overflow: "hidden" }} className="animate-fade-up">
      {/* header */}
      <div style={{ padding: "0.875rem 1.125rem", borderBottom: "1px solid rgba(251,191,36,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ fontSize: "1.125rem" }}>🤖</span>
          <div>
            <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "rgba(251,191,36,0.9)" }}>
              Agent found fields it can’t fill
            </p>
            <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)" }}>
              These fields exist on the actual page but aren’t in your profile
            </p>
          </div>
        </div>
        <button onClick={onNavigate} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "0.375rem 0.75rem", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: S.font, whiteSpace: "nowrap", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >📝 Save to Profile →</button>
      </div>

      {/* fields — rendered from agent-reported labels */}
      <div style={{ padding: "1rem 1.125rem", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.875rem" }} className="missing-grid">
        {agentFields.map((field, i) => {
          const isTextarea = field.type === "textarea";
          const key = field.label; // use label as key since these are freeform from the agent
          return (
            <div key={i} style={{ gridColumn: isTextarea ? "1 / -1" : "auto" }}>
              <Label>{field.label}{field.required && <span style={{ color: "rgba(248,113,113,0.6)", marginLeft: 3 }}>*</span>}</Label>
              {isTextarea ? (
                <Textarea
                  value={tempValues[key] || ""}
                  onChange={e => onChange(key, e.target.value)}
                  placeholder={`Enter your ${field.label.toLowerCase()}…`}
                  rows={2}
                />
              ) : (
                <Input
                  type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
                  value={tempValues[key] || ""}
                  onChange={e => onChange(key, e.target.value)}
                  placeholder={`Enter your ${field.label.toLowerCase()}…`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: "0.5rem 1.125rem 0.875rem", fontSize: "0.625rem", color: "rgba(255,255,255,0.2)" }}>
        💡 The agent is still running — it will pick up these values when it re-attempts the unfilled fields.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const user     = auth.currentUser;

  const [page,       setPage]       = useState("agent");
  const [url,        setUrl]        = useState("");
  const [profile,    setProfile]    = useState({ ...EMPTY_PROFILE });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [status,     setStatus]     = useState("idle");
  const [step,       setStep]       = useState(0);
  const [msg,        setMsg]        = useState("");
  const [logs,       setLogs]       = useState([]);
  const [navOpen,    setNavOpen]    = useState(false);
  const [history,    setHistory]    = useState([]);

  // agent-reported missing fields (populated mid-run from NEEDS_INPUT events)
  const [agentFields,   setAgentFields]   = useState([]); // required fields agent couldn't fill
  const [skippedFields, setSkippedFields] = useState([]); // ALL fields agent skipped (required + optional)
  const [tempValues,    setTempValues]    = useState({});  // label → user-typed value
  const [missingKeys,   setMissingKeys]   = useState([]);  // pre-run missing fields
  const [platformName,  setPlatformName]  = useState("");  // detected platform label

  // Session + Live browser stream
  const [sessionId,     setSessionId]     = useState("");
  const [streamingUrl,  setStreamingUrl]  = useState("");

  // Credentials (collected before run)
  const [sitePassword,  setSitePassword]  = useState("");      // password for the site
  const [showPassword,  setShowPassword]  = useState(false);

  // OTP state — two modes:
  // 1. preOtp: user enters OTP BEFORE re-run (agent paused on OTP screen)
  // 2. otpRequired: agent reported OTP screen mid-run (shown after run ends)
  const [otpRequired,   setOtpRequired]   = useState(false);
  const [otpValue,      setOtpValue]      = useState("");
  const [otpHint,       setOtpHint]       = useState("");

  const esRef   = useRef(null);
  const stepRef = useRef(0);

  /* ── load history from Firestore ── */
  useEffect(() => {
    if (!user) return;
    
    const historyQuery = query(
      collection(db, "users", user.uid, "history"),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
    }, (error) => {
      console.error("History load error:", error);
    });

    return unsubscribe;
  }, [user]);

  /* ── save history entry to Firestore ── */
  const saveHistoryEntry = async (entry) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "history"), {
        ...entry,
        timestamp: entry.timestamp || Date.now()
      });
    } catch (error) {
      console.error("History save error:", error);
    }
  };

  /* ── clear all history from Firestore ── */
  const clearHistory = async () => {
    if (!user || !window.confirm("Are you sure you want to delete all history? This cannot be undone.")) return;
    
    try {
      const historyQuery = query(collection(db, "users", user.uid, "history"));
      const snapshot = await getDocs(historyQuery);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("History clear error:", error);
    }
  };

  /* ── load profile from Firestore ── */
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(prev => ({ ...prev, ...data }));
          
          // Check if user has completed the form (has resume)
          if (!data.resumeURL) {
            navigate("/form");
            return;
          }
        } else {
          // No profile exists, redirect to form
          navigate("/form");
          return;
        }
      } catch (e) {
        console.error("Profile load error:", e);
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, [user, navigate]);

  /* ── detect platform + pre-run missing fields whenever URL changes ── */
  useEffect(() => {
    if (!url || !profileLoaded) { setMissingKeys([]); setPlatformName(""); return; }
    const u = url.toLowerCase();
    const platforms = [
      ["unstop.com", "Unstop"],
      ["devfolio.co", "Devfolio"],
      ["devpost.com", "Devpost"],
      ["docs.google.com/forms", "Google Forms"],
      ["forms.gle", "Google Forms"],
      ["linkedin.com/jobs", "LinkedIn"],
      ["linkedin.com/apply", "LinkedIn Easy Apply"],
      ["greenhouse.io", "Greenhouse ATS"],
      ["lever.co", "Lever ATS"],
      ["workday", "Workday ATS"],
      ["internshala.com", "Internshala"],
      ["hackerearth.com", "HackerEarth"],
      ["hackerrank.com", "HackerRank"],
    ];
    const matched = platforms.find(([key]) => u.includes(key));
    setPlatformName(matched ? matched[1] : "");
    const missing = [];
    setMissingKeys(missing);
    setTempValues(prev => {
      const next = {};
      missing.forEach(k => { next[k] = prev[k] || ""; });
      return next;
    });
  }, [url, profileLoaded]);

  const running = status === "running";

  const handleTempChange = (key, val) => setTempValues(prev => ({ ...prev, [key]: val }));

  /* ── build final profile merging saved + temp ── */
  const buildFinalProfile = () => {
    const merged = { ...profile };
    Object.entries(tempValues).forEach(([k, v]) => { if (v?.trim()) merged[k] = v.trim(); });
    if (sitePassword?.trim()) merged.sitePassword = sitePassword.trim();
    return { ...merged, name: `${merged.firstName} ${merged.lastName}`.trim() };
  };

  const handleRun = (prefillUrl, prefillProfile) => {
    const runUrl     = prefillUrl     || url;
    const runProfile = prefillProfile || buildFinalProfile();

    if (!runUrl)               { setStatus("error"); setMsg("Please enter a URL."); return; }
    if (!runProfile.email)     { setStatus("error"); setMsg("Email is required — please complete your profile."); return; }
    if (!runProfile.firstName) { setStatus("error"); setMsg("First name is required — please complete your profile."); return; }

    if (prefillUrl) { setUrl(prefillUrl); setPage("agent"); }

    setStatus("running"); setStep(1); stepRef.current = 1;
    setMsg("Starting agent…"); setLogs([]);

    const runStart = Date.now();
    let   runLogs  = [];

    const { close } = runAgent(runUrl, runProfile, {
      onSession(data) {
        if (data?.sessionId) setSessionId(data.sessionId);
      },
      onStreamingUrl(data) {
        if (data?.url) setStreamingUrl(data.url);
      },
      onOtpRequired(data) {
        setOtpRequired(true);
        setOtpHint(data?.hint || data?.message || "OTP detected — please enter the code sent to you.");
        setStatus("otp");
        setMsg("⏳ OTP required — enter your verification code below and click Submit OTP.");
      },
      onNeedsInput(data) {
        if (data?.fields && data.fields.length > 0) {
          setAgentFields(prev => {
            const existingLabels = new Set(prev.map(f => f.label));
            const newFields = data.fields.filter(f => !existingLabels.has(f.label));
            return [...prev, ...newFields];
          });
          setTempValues(prev => {
            const next = { ...prev };
            data.fields.forEach(f => { if (!next[f.label]) next[f.label] = ""; });
            return next;
          });
        }
      },
      onSkippedFields(data) {
        if (data?.fields) {
          setSkippedFields(data.fields);
        }
      },
      onMessage(evt) {
        const text = evt.message || evt.log || evt.output || JSON.stringify(evt);
        runLogs = [...runLogs.slice(-49), text];
        setLogs([...runLogs]);
        setMsg(text);
        const guessed = guessStep(text, stepRef.current);
        if (guessed) { stepRef.current = guessed; setStep(guessed); }
      },
      onDone(data) {
        stepRef.current = 6; setStep(6);
        const confirmed = data?.confirmed === true;  // only true when agent explicitly confirms
        const succeeded = data?.success === true;
        const doneMsg = data?.message || (confirmed
          ? "Form submitted — confirmation detected!"
          : succeeded
          ? "Agent finished. Check the page to confirm submission."
          : "Agent ended without confirmation. Please verify the form was submitted.");
        const newStatus = confirmed ? "success" : "warning";
        setStatus(newStatus);
        setMsg(doneMsg);
        saveHistoryEntry({
          id: runStart, timestamp: runStart,
          url: runUrl, profile: runProfile,
          status: confirmed ? "success" : "unconfirmed",
          stepsReached: 6, logs: runLogs,
        });
      },
      onError(errMsg) {
        setStatus("error"); setMsg(errMsg || "Something went wrong.");
        saveHistoryEntry({
          id: runStart, timestamp: runStart,
          url: runUrl, profile: runProfile,
          status: "error", stepsReached: stepRef.current, logs: runLogs,
        });
      },
    });
    esRef.current = { close };
  };

  const handleOtpSubmit = async () => {
    if (!otpValue.trim() || !sessionId) return;
    const base = import.meta.env.VITE_API_URL || "";
    try {
      const res = await fetch(`${base}/api/agent/submit-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp: otpValue.trim() }),
      });
      if (res.ok) {
        setOtpRequired(false);
        setOtpValue("");
        setStatus("running");
        setMsg("✅ OTP submitted — agent is continuing...");
      } else {
        setMsg("❌ Failed to submit OTP. Please try again.");
      }
    } catch {
      setMsg("❌ Could not reach server to submit OTP.");
    }
  };

  const handleReset = () => {
    esRef.current?.close();
    setStatus("idle"); setStep(0); stepRef.current = 0;
    setMsg(""); setLogs([]); setUrl(""); setTempValues({});
    setMissingKeys([]); setAgentFields([]); setSkippedFields([]); setPlatformName("");
    setOtpRequired(false); setOtpValue(""); setOtpHint("");
    setStreamingUrl(""); setSessionId("");
  };

  const handleRerun = (entry) => {
    handleReset();
    setTimeout(() => handleRun(entry.url, entry.profile), 50);
  };

  const handleLogout = async () => { await signOut(auth); navigate("/"); };

  const totalRuns    = history.length;
  const successCount = history.filter(h => h.status === "success").length;
  const successRate  = totalRuns ? Math.round((successCount / totalRuns) * 100) + "%" : "—";

  /* profile completeness */
  const filledCount = Object.values(profile).filter(v => v?.trim()).length;
  const totalFields = Object.keys(EMPTY_PROFILE).length;

  const pillCfg = {
    idle:    { dot: "rgba(255,255,255,0.2)", text: "rgba(255,255,255,0.3)",  label: "Ready",       bdr: "rgba(255,255,255,0.08)",  bg: "rgba(255,255,255,0.04)" },
    running: { dot: "white",                text: "rgba(255,255,255,0.7)",  label: "Running",     bdr: "rgba(255,255,255,0.15)",  bg: "rgba(255,255,255,0.06)" },
    otp:     { dot: "#a78bfa",              text: "#a78bfa",                label: "OTP Needed",  bdr: "rgba(167,139,250,0.25)",  bg: "rgba(167,139,250,0.06)" },
    success: { dot: "#34d399",              text: "#34d399",                label: "Confirmed",   bdr: "rgba(52,211,153,0.2)",    bg: "rgba(52,211,153,0.06)"  },
    warning: { dot: "#fbbf24",              text: "#fbbf24",                label: "Unconfirmed", bdr: "rgba(251,191,36,0.2)",   bg: "rgba(251,191,36,0.06)"  },
    error:   { dot: "#f87171",              text: "#f87171",                label: "Error",       bdr: "rgba(248,113,113,0.2)",   bg: "rgba(248,113,113,0.06)" },
  };
  const pill = pillCfg[status];

  const NAV = [
    { id: "agent",   icon: "🤖", label: "Agent"   },
    { id: "history", icon: "📋", label: "History" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: S.bg, fontFamily: S.font, color: "white" }}>

      {/* ════ SIDEBAR ════ */}
      <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40, width: "220px", display: "flex", flexDirection: "column", borderRight: S.border, backgroundColor: S.bgPanel, transform: navOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s" }} className="sidebar">
        <div style={{ pointerEvents: "none", position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
        <div style={{ position: "relative", zIndex: 10, display: "flex", height: "100%", flexDirection: "column", padding: "1.5rem 1rem" }}>

          {/* Brand */}
          <div onClick={() => navigate("/")} style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            <div style={{ display: "flex", height: "2rem", width: "2rem", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "0.625rem", backgroundColor: "white", color: "black", fontSize: "0.875rem", fontWeight: 900 }}>⚡</div>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.02em" }}>AutoSlay</span>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {NAV.map(item => {
              const active = page === item.id;
              return (
                <div key={item.id} onClick={() => { setPage(item.id); setNavOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: "0.625rem", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", backgroundColor: active ? "rgba(255,255,255,0.09)" : "transparent", color: active ? "white" : "rgba(255,255,255,0.25)", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}}
                >
                  <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === "history" && totalRuns > 0 && (
                    <span style={{ marginLeft: "auto", fontSize: "0.5625rem", fontWeight: 700, backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: "9999px", padding: "1px 7px" }}>{totalRuns}</span>
                  )}
                </div>
              );
            })}

            {/* Profile link */}
            <div onClick={() => navigate("/form")} style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: "0.625rem", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", backgroundColor: "transparent", color: "rgba(255,255,255,0.25)", transition: "all 0.15s", marginTop: "0.25rem" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}
            >
              <span style={{ fontSize: "1rem" }}>📝</span>
              <span>My Profile</span>
            </div>
          </nav>

          {/* Stats */}
          <div style={{ marginTop: "1.5rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem" }}>
            <p style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", margin: 0 }}>Total runs</p>
            <p style={{ marginTop: "0.25rem", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.04em", color: totalRuns ? "white" : "rgba(255,255,255,0.1)", margin: "0.25rem 0 0" }}>{totalRuns || "—"}</p>
            <p style={{ marginTop: "0.75rem", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", margin: "0.75rem 0 0" }}>Success rate</p>
            <p style={{ marginTop: "0.25rem", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.04em", color: totalRuns ? "#34d399" : "rgba(255,255,255,0.1)", margin: "0.25rem 0 0" }}>{successRate}</p>
          </div>

          {/* Profile link */}
          <div style={{ marginTop: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.875rem 1rem" }}>
            <button onClick={() => navigate("/form")} style={{ fontSize: "0.5625rem", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: S.font, textDecoration: "underline" }}>
              Edit profile →
            </button>
          </div>

          <div style={{ flex: 1 }} />

          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.75rem" }}>
            <div style={{ display: "flex", height: "2rem", width: "2rem", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              {user?.photoURL ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{user?.displayName || "User"}</p>
              <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>{user?.email || ""}</p>
            </div>
            <button onClick={handleLogout} style={{ flexShrink: 0, borderRadius: "0.5rem", padding: "0.375rem", color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {navOpen && <div onClick={() => setNavOpen(false)} className="sidebar-overlay" style={{ position: "fixed", inset: 0, zIndex: 30, backgroundColor: "rgba(0,0,0,0.6)" }} />}

      {/* ════ MAIN ════ */}
      <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden", minWidth: 0 }} className="main-content">

        {/* Topbar */}
        <header style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between", borderBottom: S.border, backgroundColor: "rgba(8,8,8,0.9)", padding: "0.875rem 1.25rem", backdropFilter: "blur(12px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={() => setNavOpen(true)} className="hamburger" style={{ marginRight: "0.25rem", borderRadius: "0.5rem", padding: "0.375rem", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h1 style={{ fontSize: "1.0625rem", fontWeight: 800, letterSpacing: "-0.03em", color: "white", margin: 0 }}>
              {page === "agent" ? "Universal Form Agent" : "History"}
            </h1>
            <span className="ai-badge" style={{ borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.08)", padding: "0.125rem 0.75rem", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)" }}>
              {page === "agent" ? "AI Powered" : `${totalRuns} runs`}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            {/* Profile shortcut */}
            <button onClick={() => navigate("/form")} className="profile-btn" style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.375rem 0.75rem", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.35)", cursor: "pointer", transition: "all 0.15s", fontFamily: S.font }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
            >
              <span>📝</span>
              <span>Profile</span>
            </button>

            {page === "agent" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "9999px", border: `1px solid ${pill.bdr}`, backgroundColor: pill.bg, padding: "0.375rem 0.75rem", fontSize: "0.75rem", fontWeight: 600 }}>
                <span style={{ height: "8px", width: "8px", borderRadius: "9999px", backgroundColor: pill.dot, flexShrink: 0 }} className={status === "running" ? "animate-pulse-dot" : ""} />
                <span style={{ color: pill.text }}>{pill.label}</span>
              </div>
            )}
            {page === "history" && history.length > 0 && (
              <button onClick={clearHistory} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "0.375rem 0.875rem", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: S.font, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"; e.currentTarget.style.color = "#f87171"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
              >Clear all</button>
            )}
          </div>
        </header>

        {/* ════ AGENT PAGE ════ */}
        {page === "agent" && (
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

            {/* LEFT — URL + missing fields + action */}
            <div style={{ display: "flex", flex: 1, flexDirection: "column", overflowY: "auto", borderRight: S.border }}>

              {/* ── URL row ── */}
              <div style={{ padding: "1rem 1.25rem", borderBottom: S.border }}>
                <Label>Target URL <span style={{ color: "rgba(255,255,255,0.12)" }}>*</span></Label>
                <div style={{ display: "flex", alignItems: "center", overflow: "hidden", borderRadius: "0.625rem", border: "1px solid rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.04)" }}>
                  <span style={{ flexShrink: 0, paddingLeft: "0.875rem", fontSize: "0.9375rem", color: "rgba(255,255,255,0.2)" }}>🔗</span>
                  <input type="text" placeholder="Paste any form URL: job, hackathon, scholarship, govt portal, event…"
                    value={url} onChange={e => setUrl(e.target.value)} disabled={running}
                    style={{ flex: 1, background: "transparent", padding: "0.6875rem 0.75rem", fontSize: "0.8125rem", color: "white", outline: "none", border: "none", opacity: running ? 0.4 : 1, fontFamily: S.font }}
                  />
                  {url && !running && (
                    <button onClick={() => { setUrl(""); setMissingKeys([]); setTempValues({}); }} style={{ flexShrink: 0, marginRight: "0.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "0.25rem" }}>×</button>
                  )}
                </div>
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.18)" }}>
                  Works on any web form: jobs, hackathons, scholarships, govt portals, events, college admissions…
                </p>
                {platformName && (
                  <div style={{ marginTop: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", borderRadius: "9999px", border: "1px solid rgba(52,211,153,0.25)", backgroundColor: "rgba(52,211,153,0.06)", padding: "0.2rem 0.75rem" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#34d399", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(52,211,153,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Platform detected: {platformName}</span>
                  </div>
                )}
              </div>

              {/* ── Profile loaded indicator ── */}
              {profileLoaded && (filledCount > 0) && (
                <div style={{ padding: "0.5rem 1.25rem", borderBottom: S.border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#34d399", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Profile loaded · {filledCount} fields ready</span>
                  </div>
                  <button onClick={() => navigate("/form")} style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: S.font, textDecoration: "underline" }}>Edit →</button>
                </div>
              )}
              {profileLoaded && filledCount === 0 && (
                <div style={{ padding: "0.75rem 1.25rem", borderBottom: S.border, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(251,191,36,0.04)", borderLeft: "2px solid rgba(251,191,36,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>⚠️</span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(251,191,36,0.8)", fontWeight: 500 }}>Your profile is empty — fill it for best autofill results</span>
                  </div>
                  <button onClick={() => navigate("/form")} style={{ fontSize: "0.75rem", fontWeight: 700, color: "white", background: "white", color: "black", border: "none", borderRadius: "0.375rem", padding: "0.375rem 0.75rem", cursor: "pointer", fontFamily: S.font }}>Set up →</button>
                </div>
              )}

              {/* ── Agent NEEDS_INPUT panel — shown mid-run when agent finds unfilled required fields ── */}
              {agentFields.length > 0 && (
                <div style={{ padding: "0.875rem 0 0" }}>
                  <AgentMissingFieldsPanel
                    agentFields={agentFields}
                    tempValues={tempValues}
                    onChange={handleTempChange}
                    onNavigate={() => navigate("/form")}
                  />
                </div>
              )}

              {/* ── Pre-run missing fields (static) ── */}
              {url && missingKeys.length > 0 && !agentFields.length && (
                <div style={{ padding: "0.875rem 0 0" }}>
                  <AgentMissingFieldsPanel
                    agentFields={missingKeys.map(key => ({ label: key, type: 'text', required: false }))}
                    tempValues={tempValues}
                    onChange={handleTempChange}
                    onNavigate={() => navigate("/form")}
                  />
                </div>
              )}

              {/* ── No missing fields confirmation ── */}
              {url && missingKeys.length === 0 && !agentFields.length && profileLoaded && filledCount > 0 && (
                <div style={{ margin: "0.875rem 1.25rem 0", borderRadius: "0.75rem", border: "1px solid rgba(52,211,153,0.15)", backgroundColor: "rgba(52,211,153,0.04)", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span>✅</span>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(52,211,153,0.8)", fontWeight: 500 }}>Profile looks complete for this URL — ready to launch!</p>
                </div>
              )}

              {/* ── OTP Panel ── */}
              {otpRequired && (
                <div style={{ margin: "0.875rem 1.25rem 0", borderRadius: "0.875rem", border: "1px solid rgba(167,139,250,0.35)", backgroundColor: "rgba(167,139,250,0.06)", overflow: "hidden" }} className="animate-fade-up">
                  <div style={{ padding: "0.875rem 1.125rem", borderBottom: "1px solid rgba(167,139,250,0.15)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>🔐</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "rgba(167,139,250,0.95)" }}>OTP / Verification Code Required</p>
                      <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)" }}>{otpHint || "The form is asking for a verification code sent to your phone or email."}</p>
                    </div>
                  </div>
                  <div style={{ padding: "1rem 1.125rem" }}>
                    <Label>Enter OTP / Verification Code <span style={{ color: "rgba(248,113,113,0.7)" }}>*</span></Label>
                    <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 123456"
                        value={otpValue}
                        onChange={e => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        onKeyDown={e => { if (e.key === "Enter") handleOtpSubmit(); }}
                        autoFocus
                        style={{
                          flex: 1, boxSizing: "border-box", borderRadius: "0.625rem",
                          border: "1px solid rgba(167,139,250,0.35)",
                          backgroundColor: "rgba(167,139,250,0.06)",
                          padding: "0.6875rem 0.875rem", fontSize: "1.125rem", fontWeight: 700,
                          color: "white", outline: "none", letterSpacing: "0.2em",
                          fontFamily: S.font, textAlign: "center",
                        }}
                      />
                      <button
                        onClick={handleOtpSubmit}
                        disabled={!otpValue.trim()}
                        style={{
                          flexShrink: 0, borderRadius: "0.625rem", padding: "0.6875rem 1.25rem",
                          fontSize: "0.875rem", fontWeight: 700, cursor: otpValue.trim() ? "pointer" : "not-allowed",
                          opacity: otpValue.trim() ? 1 : 0.4,
                          backgroundColor: "#a78bfa", color: "white", border: "none",
                          fontFamily: S.font, transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { if (otpValue.trim()) e.currentTarget.style.backgroundColor = "#9061f9"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#a78bfa"; }}
                      >
                        Submit OTP →
                      </button>
                    </div>
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.2)" }}>
                      💡 Check your phone (SMS) or email inbox for the code. Press Enter or click Submit OTP to continue.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Error ── */}
              {status === "error" && msg && (
                <div style={{ margin: "0.875rem 1.25rem 0", borderRadius: "0.625rem", border: "1px solid rgba(248,113,113,0.2)", backgroundColor: "rgba(248,113,113,0.06)", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 500, color: "#f87171" }}>{msg}</div>
              )}

              {/* ── Action buttons ── */}
              <div style={{ display: "flex", gap: "0.75rem", padding: "1rem 1.25rem", marginTop: "auto", flexShrink: 0 }}>
                {(status === "success" || status === "warning" || status === "error") && (
                  <button onClick={handleReset} style={{ borderRadius: "0.6875rem", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", padding: "0.75rem 1.25rem", fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.15s", fontFamily: S.font }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "white"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                  >Reset</button>
                )}
                <button
                  onClick={running ? undefined : () => handleRun()}
                  disabled={running}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
                    borderRadius: "0.6875rem", padding: "0.8125rem 0",
                    fontSize: "0.875rem", fontWeight: 700,
                    cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.5 : 1,
                    transition: "all 0.15s",
                    border: status === "success" ? "1px solid rgba(52,211,153,0.2)" : running ? "1px solid rgba(255,255,255,0.07)" : "none",
                    backgroundColor: status === "success" ? "rgba(52,211,153,0.07)" : running ? "rgba(255,255,255,0.04)" : "white",
                    color: status === "success" ? "#34d399" : running ? "rgba(255,255,255,0.3)" : "black",
                    fontFamily: S.font,
                  }}
                  onMouseEnter={e => { if (!running && status !== "success") e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)"; }}
                  onMouseLeave={e => { if (!running && status !== "success") e.currentTarget.style.backgroundColor = "white"; }}
                  onMouseDown={e  => { if (!running) e.currentTarget.style.transform = "scale(0.99)"; }}
                  onMouseUp={e    => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {running ? (
                    <><span style={{ display: "block", height: "1rem", width: "1rem", borderRadius: "9999px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "rgba(255,255,255,0.7)" }} className="animate-spin-slow" /><span>Agent Running…</span></>
                  ) : status === "success" ? <span>✅ Run Again</span> : <span>⚡ Launch Agent</span>}
                </button>
              </div>
            </div>

            {/* RIGHT — activity panel */}
            <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", width: "42%", flexShrink: 0 }} className="activity-panel">
              <div style={{ borderBottom: S.border, padding: "1.25rem 1.5rem" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Agent Activity</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>Live step-by-step progress</p>
              </div>

              {/* ── Live browser stream iframe ── */}
              {streamingUrl && (
                <div style={{ borderBottom: S.border, overflow: "hidden" }} className="animate-fade-up">
                  <div style={{ padding: "0.5rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#34d399", flexShrink: 0 }} className="animate-pulse-dot" />
                      <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Browser</span>
                    </div>
                    <a href={streamingUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>Open full screen ↗</a>
                  </div>
                  <iframe
                    src={streamingUrl}
                    style={{ width: "100%", height: "280px", border: "none", display: "block", backgroundColor: "#000" }}
                    title="Live agent browser"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )}
              <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: "1.5rem" }}>
                {/* Steps */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {STEPS.map((s, idx) => {
                    const done   = step > s.id;
                    const active = step === s.id && running;
                    const dotBdr = done ? "1px solid rgba(52,211,153,0.3)" : active ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.07)";
                    const dotBg  = done ? "rgba(52,211,153,0.1)"           : active ? "rgba(255,255,255,0.1)"           : "rgba(255,255,255,0.03)";
                    const dotClr = done ? "#34d399"                        : active ? "white"                           : "rgba(255,255,255,0.15)";
                    const lblClr = done ? "rgba(255,255,255,0.35)"         : active ? "rgba(255,255,255,0.8)"           : "rgba(255,255,255,0.15)";
                    return (
                      <div key={s.id} style={{ display: "flex", gap: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ display: "flex", height: "1.75rem", width: "1.75rem", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "9999px", border: dotBdr, backgroundColor: dotBg, color: dotClr, fontSize: "0.6875rem", fontWeight: 700, transition: "all 0.3s", boxShadow: active ? "0 0 12px rgba(255,255,255,0.08)" : "none" }}>
                            {done ? (
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : active ? (
                              <span style={{ height: "8px", width: "8px", borderRadius: "9999px", backgroundColor: "white" }} className="animate-pulse-dot" />
                            ) : (
                              <span style={{ fontSize: "0.625rem" }}>{idx + 1}</span>
                            )}
                          </div>
                          {idx < STEPS.length - 1 && (
                            <div style={{ margin: "0.25rem 0", width: "1px", flex: 1, minHeight: "20px", backgroundColor: done ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)", transition: "background-color 0.5s" }} />
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "1.5rem", fontSize: "0.8125rem", fontWeight: 500, color: lblClr, transition: "all 0.3s" }}>
                          <span style={{ fontSize: "0.875rem" }}>{s.icon}</span>
                          <span>{s.label}</span>
                          {active && <span style={{ borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.06)", padding: "0.125rem 0.5rem", fontSize: "0.625rem", fontWeight: 600, color: "rgba(255,255,255,0.4)" }} className="animate-pulse-dot">working</span>}
                          {done  && <span style={{ borderRadius: "0.375rem", border: "1px solid rgba(52,211,153,0.15)", backgroundColor: "rgba(52,211,153,0.06)", padding: "0.125rem 0.5rem", fontSize: "0.625rem", fontWeight: 600, color: "rgba(52,211,153,0.7)" }}>done</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status msg */}
                {status !== "idle" && msg && (
                  <div style={{ marginTop: "0.5rem", borderRadius: "0.6875rem", border: status === "success" ? "1px solid rgba(52,211,153,0.2)" : status === "error" ? "1px solid rgba(248,113,113,0.2)" : "1px solid rgba(255,255,255,0.08)", backgroundColor: status === "success" ? "rgba(52,211,153,0.06)" : status === "error" ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.04)", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 500, color: status === "success" ? "#34d399" : status === "error" ? "#f87171" : "rgba(255,255,255,0.4)" }} className="animate-fade-up">{msg}</div>
                )}

                {/* Live console */}
                {logs.length > 0 && (
                  <div style={{ marginTop: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(0,0,0,0.4)", overflow: "hidden" }}>
                    <div style={{ padding: "0.5rem 0.875rem", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ height: "6px", width: "6px", borderRadius: "9999px", backgroundColor: running ? "#34d399" : "rgba(255,255,255,0.2)" }} className={running ? "animate-pulse-dot" : ""} />
                      Agent Console
                    </div>
                    <div style={{ maxHeight: "180px", overflowY: "auto", padding: "0.625rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {logs.map((line, i) => (
                        <div key={i} style={{ fontSize: "0.6875rem", lineHeight: 1.5, color: i === logs.length - 1 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)", fontFamily: "ui-monospace, monospace" }}>
                          <span style={{ color: "rgba(255,255,255,0.15)", marginRight: "0.5rem" }}>›</span>{line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Skipped / Unfilled Fields Panel ── */}
                {skippedFields.length > 0 && (
                  <div style={{ marginTop: "1rem", borderRadius: "0.875rem", border: "1px solid rgba(251,191,36,0.2)", backgroundColor: "rgba(251,191,36,0.03)", overflow: "hidden" }} className="animate-fade-up">
                    {/* header */}
                    <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(251,191,36,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1rem" }}>📋</span>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "rgba(251,191,36,0.9)" }}>
                            {skippedFields.filter(f => f.required).length > 0
                              ? `${skippedFields.filter(f=>f.required).length} required · ${skippedFields.filter(f=>!f.required).length} optional skipped`
                              : `${skippedFields.length} optional field${skippedFields.length !== 1 ? "s" : ""} skipped`
                            }
                          </p>
                          <p style={{ margin: 0, fontSize: "0.625rem", color: "rgba(255,255,255,0.25)" }}>Questions the agent left blank on this form</p>
                        </div>
                      </div>
                      <button onClick={() => navigate("/form")} style={{ flexShrink: 0, background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.375rem", padding: "0.3rem 0.625rem", fontSize: "0.625rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: S.font, whiteSpace: "nowrap" }}>💾 Save to Profile</button>
                    </div>

                    {/* required fields first */}
                    {skippedFields.filter(f => f.required).length > 0 && (
                      <div style={{ padding: "0.625rem 1rem 0" }}>
                        <p style={{ margin: "0 0 0.4rem", fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f87171" }}>⚠ Required — couldn't be filled</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          {skippedFields.filter(f => f.required).map((f, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", borderRadius: "0.5rem", border: "1px solid rgba(248,113,113,0.15)", backgroundColor: "rgba(248,113,113,0.05)", padding: "0.5rem 0.75rem" }}>
                              <span style={{ marginTop: 2, width: 6, height: 6, borderRadius: "50%", backgroundColor: "#f87171", flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{f.label}</p>
                                {f.reason && <p style={{ margin: "0.15rem 0 0", fontSize: "0.625rem", color: "rgba(255,255,255,0.3)" }}>{f.reason}</p>}
                              </div>
                              <span style={{ flexShrink: 0, marginLeft: "auto", fontSize: "0.5rem", fontWeight: 700, color: "rgba(248,113,113,0.7)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "0.25rem", padding: "0.1rem 0.4rem", textTransform: "uppercase" }}>{f.type || "text"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* optional fields */}
                    {skippedFields.filter(f => !f.required).length > 0 && (
                      <div style={{ padding: "0.625rem 1rem" }}>
                        <p style={{ margin: "0 0 0.4rem", fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)" }}>Optional — not filled</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {skippedFields.filter(f => !f.required).map((f, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.4rem 0.75rem" }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                              <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", flex: 1 }}>{f.label}</p>
                              {f.reason && <p style={{ margin: 0, fontSize: "0.5625rem", color: "rgba(255,255,255,0.2)" }}>{f.reason}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ padding: "0.5rem 1rem 0.75rem", fontSize: "0.5625rem", color: "rgba(255,255,255,0.18)" }}>
                      💡 Add these answers to your Profile so the agent fills them automatically next time.
                    </div>
                  </div>
                )}

                {/* Idle hint */}
                {status === "idle" && (
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "flex-start", gap: "0.75rem", borderRadius: "0.6875rem", border: "1px dashed rgba(255,255,255,0.07)", padding: "1rem" }}>
                    <span style={{ fontSize: "1.125rem", opacity: 0.3, flexShrink: 0 }}>🤖</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
                        Paste a URL above. We'll detect which fields that form likely needs, let you fill any gaps right here, then launch the agent to handle the rest.
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.625rem" }}>
                        {["Job applications","Hackathons","Govt portals","Scholarships","Events","College admissions"].map(tag => (
                          <span key={tag} style={{ fontSize: "0.5625rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "0.25rem", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.2)" }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ HISTORY PAGE ════ */}
        {page === "history" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            {history.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem", opacity: 0.4 }}>
                <span style={{ fontSize: "2.5rem" }}>📋</span>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.4)" }}>No runs yet</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>Every form you fill will appear here</p>
                <button onClick={() => setPage("agent")} style={{ marginTop: "0.5rem", background: "white", color: "black", border: "none", borderRadius: "0.625rem", padding: "0.625rem 1.25rem", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", fontFamily: S.font }}>⚡ Run the agent</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 860, margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  {[
                    { label: "Total Runs",  val: totalRuns,                color: "white"    },
                    { label: "Successful",  val: successCount,             color: "#34d399"  },
                    { label: "Failed",      val: totalRuns - successCount, color: "#f87171"  },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ borderRadius: "0.75rem", border: S.border, backgroundColor: "#0f0f0f", padding: "1rem 1.25rem" }}>
                      <p style={{ margin: 0, fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>{label}</p>
                      <p style={{ margin: "0.375rem 0 0", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.04em", color }}>{val}</p>
                    </div>
                  ))}
                </div>
                {history.map(entry => <HistoryCard key={entry.id} entry={entry} onRerun={handleRerun} />)}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar         { transform: translateX(0) !important; position: relative !important; }
          .sidebar-overlay { display: none !important; }
          .hamburger       { display: none !important; }
        }
        @media (max-width: 768px) {
          .activity-panel  { display: none !important; }
          .ai-badge        { display: none !important; }
          .missing-grid    { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .profile-btn { display: none !important; }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.15); }
        textarea { color-scheme: dark; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin 1s linear infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .animate-pulse-dot { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .animate-fade-up { animation: fadeUp 0.3s ease; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 9999px; }
      `}</style>
    </div>
  );
}
