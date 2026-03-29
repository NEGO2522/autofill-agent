import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { runAgent } from "../api/agent";

const STEPS = [
  { id: 1, label: "Opening website",        icon: "🌐" },
  { id: 2, label: "Detecting fields",        icon: "🔍" },
  { id: 3, label: "Filling name & email",    icon: "✍️"  },
  { id: 4, label: "Filling phone & company", icon: "📱" },
  { id: 5, label: "Filling message",         icon: "💬" },
  { id: 6, label: "Submitting form",         icon: "🚀" },
];

const STEP_KEYWORDS = [
  [6, ["submit", "privacy", "checkbox", "send message", "done", "finish", "complet", "success", "thank"]],
  [5, ["message", "textarea", "description", "how can we help"]],
  [4, ["phone", "mobile", "company", "organisation", "org"]],
  [3, ["first name", "last name", "email", "mail"]],
  [2, ["detect", "scan", "field", "form", "inspect", "analy", "find"]],
  [1, ["open", "navigat", "load", "visit", "browse", "url", "website", "page"]],
];

function guessStep(message, currentStep) {
  if (!message) return null;
  const low = message.toLowerCase();
  for (const [id, keywords] of STEP_KEYWORDS) {
    if (id <= currentStep) continue;
    if (keywords.some((k) => low.includes(k))) return id;
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
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── shared style tokens ── */
const S = {
  bg:      "#080808",
  bgPanel: "#0c0c0c",
  border:  "1px solid rgba(255,255,255,0.07)",
  font:    "Inter, ui-sans-serif, system-ui, sans-serif",
};

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{
        display: "block", marginBottom: "0.5rem",
        fontSize: "0.6875rem", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.3)",
      }}>
        {label}{required && <span style={{ color: "rgba(255,255,255,0.15)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, type = "text", placeholder, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={onChange} disabled={disabled}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: "100%", borderRadius: "0.6875rem", boxSizing: "border-box",
        border: focused ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.09)",
        backgroundColor: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
        padding: "0.75rem 1rem", fontSize: "0.875rem", color: "white",
        outline: "none", opacity: disabled ? 0.4 : 1,
        transition: "border-color 0.2s, background-color 0.2s", fontFamily: S.font,
      }}
    />
  );
}

/* ── History entry card ── */
function HistoryCard({ entry, onRerun }) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = entry.status === "success";
  const isError   = entry.status === "error";

  const statusColor = isSuccess ? "#34d399" : isError ? "#f87171" : "rgba(255,255,255,0.4)";
  const statusBg    = isSuccess ? "rgba(52,211,153,0.06)" : isError ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.04)";
  const statusBdr   = isSuccess ? "rgba(52,211,153,0.2)"  : isError ? "rgba(248,113,113,0.2)"  : "rgba(255,255,255,0.08)";
  const statusLabel = isSuccess ? "✅ Success" : isError ? "❌ Failed" : "⚪ Unknown";

  // Shorten URL for display
  let displayUrl = entry.url;
  try { displayUrl = new URL(entry.url).hostname + new URL(entry.url).pathname; } catch {}

  return (
    <div style={{
      borderRadius: "0.875rem", border: S.border,
      backgroundColor: "#0f0f0f", overflow: "hidden",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
    >
      {/* Header row */}
      <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
        onClick={() => setExpanded(x => !x)}>
        {/* Status dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          backgroundColor: statusColor,
        }} />

        {/* URL + name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.8)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{displayUrl}</p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)" }}>
            {entry.profile.firstName} {entry.profile.lastName} · {entry.profile.email}
          </p>
        </div>

        {/* Status badge */}
        <span style={{
          flexShrink: 0, fontSize: "0.625rem", fontWeight: 700,
          padding: "0.25rem 0.625rem", borderRadius: "0.375rem",
          border: `1px solid ${statusBdr}`, backgroundColor: statusBg,
          color: statusColor,
        }}>{statusLabel}</span>

        {/* Time */}
        <span style={{ flexShrink: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.2)" }}>
          {timeAgo(entry.timestamp)}
        </span>

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.2" strokeLinecap="round"
          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: S.border }}>
          {/* Profile grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            {[
              { label: "Full Name",  val: `${entry.profile.firstName} ${entry.profile.lastName}`.trim() || "—" },
              { label: "Email",      val: entry.profile.email      || "—" },
              { label: "Phone",      val: entry.profile.phone      || "—" },
              { label: "Company",    val: entry.profile.company    || "—" },
              { label: "Run at",     val: formatTime(entry.timestamp) },
              { label: "Steps done", val: `${entry.stepsReached} / 6` },
            ].map(({ label, val }) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)" }}>{label}</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", wordBreak: "break-all" }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Message preview */}
          {entry.profile.message && (
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ margin: 0, fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", marginBottom: "0.375rem" }}>Message sent</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{entry.profile.message}</p>
            </div>
          )}

          {/* Last log lines */}
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

          {/* Rerun button */}
          <div style={{ padding: "0.75rem 1.25rem" }}>
            <button onClick={() => onRerun(entry)} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.5rem", padding: "0.5rem 1rem",
              fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.45)",
              cursor: "pointer", transition: "all 0.15s", fontFamily: S.font,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >
              ↩ Re-run this form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const user     = auth.currentUser;

  // ── page state ──
  const [page, setPage] = useState("agent"); // "agent" | "history"

  // ── agent state ──
  const [url,     setUrl]     = useState("");
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", message: "" });
  const [status,  setStatus]  = useState("idle");
  const [step,    setStep]    = useState(0);
  const [msg,     setMsg]     = useState("");
  const [logs,    setLogs]    = useState([]);
  const [navOpen, setNavOpen] = useState(false);
  const esRef    = useRef(null);
  const stepRef  = useRef(0);   // track step inside async callback

  // ── history state ──
  const [history, setHistory] = useState([]);

  const running = status === "running";

  const handleRun = (prefillUrl, prefillProfile) => {
    const runUrl     = prefillUrl     || url;
    const runProfile = prefillProfile || profile;

    if (!runUrl || !runProfile.firstName || !runProfile.email) {
      setStatus("error"); setMsg("Please fill in all required fields."); return;
    }

    // If rerunning from history, populate the form fields too
    if (prefillUrl) { setUrl(prefillUrl); setProfile(prefillProfile); setPage("agent"); }

    const enriched = { ...runProfile, name: `${runProfile.firstName} ${runProfile.lastName}`.trim() };
    setStatus("running"); setStep(1); stepRef.current = 1; setMsg("Starting agent…"); setLogs([]);

    const runStart = Date.now();
    let   runLogs  = [];

    const { close } = runAgent(runUrl, enriched, {
      onMessage(evt) {
        const text = evt.message || evt.log || evt.output || JSON.stringify(evt);
        runLogs = [...runLogs.slice(-49), text];
        setLogs([...runLogs]);
        setMsg(text);
        const guessed = guessStep(text, stepRef.current);
        if (guessed) { stepRef.current = guessed; setStep(guessed); }
      },
      onDone() {
        stepRef.current = 6;
        setStep(6);
        setStatus("success");
        setMsg("Form submitted successfully!");
        // Save to history
        setHistory(prev => [{
          id: runStart,
          timestamp: runStart,
          url: runUrl,
          profile: { ...runProfile },
          status: "success",
          stepsReached: 6,
          logs: runLogs,
        }, ...prev]);
      },
      onError(errMsg) {
        setStatus("error");
        setMsg(errMsg || "Something went wrong. Please try again.");
        setHistory(prev => [{
          id: runStart,
          timestamp: runStart,
          url: runUrl,
          profile: { ...runProfile },
          status: "error",
          stepsReached: stepRef.current,
          logs: runLogs,
        }, ...prev]);
      },
    });

    esRef.current = { close };
  };

  const handleReset = () => {
    esRef.current?.close();
    setStatus("idle"); setStep(0); stepRef.current = 0;
    setMsg(""); setLogs([]); setUrl("");
    setProfile({ firstName: "", lastName: "", email: "", phone: "", company: "", message: "" });
  };

  const handleRerun = (entry) => {
    handleReset();
    // Small delay so state clears before re-running
    setTimeout(() => handleRun(entry.url, entry.profile), 50);
  };

  const handleLogout = async () => { await signOut(auth); navigate("/"); };

  /* ── status pill ── */
  const pillCfg = {
    idle:    { dot: "rgba(255,255,255,0.2)", text: "rgba(255,255,255,0.3)",  label: "Ready",    bdr: "rgba(255,255,255,0.08)", bg: "rgba(255,255,255,0.04)" },
    running: { dot: "white",                text: "rgba(255,255,255,0.7)",  label: "Running",  bdr: "rgba(255,255,255,0.15)", bg: "rgba(255,255,255,0.06)" },
    success: { dot: "#34d399",              text: "#34d399",                label: "Complete", bdr: "rgba(52,211,153,0.2)",   bg: "rgba(52,211,153,0.06)"  },
    error:   { dot: "#f87171",              text: "#f87171",                label: "Error",    bdr: "rgba(248,113,113,0.2)",  bg: "rgba(248,113,113,0.06)" },
  };
  const pill = pillCfg[status];

  const NAV = [
    { id: "agent",   icon: "🤖", label: "Agent"   },
    { id: "history", icon: "📋", label: "History" },
  ];

  /* ── success / fail counts for stats ── */
  const totalRuns    = history.length;
  const successCount = history.filter(h => h.status === "success").length;
  const successRate  = totalRuns ? Math.round((successCount / totalRuns) * 100) + "%" : "—";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: S.bg, fontFamily: S.font, color: "white" }}>

      {/* ══════ SIDEBAR ══════ */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40, width: "230px",
        display: "flex", flexDirection: "column",
        borderRight: S.border, backgroundColor: S.bgPanel,
        transform: navOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s",
      }} className="sidebar">
        {/* grid texture */}
        <div style={{
          pointerEvents: "none", position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
          backgroundSize: "36px 36px",
        }} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", height: "100%", flexDirection: "column", padding: "1.5rem 1rem" }}>
          {/* Brand */}
          <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{
              display: "flex", height: "2rem", width: "2rem", flexShrink: 0,
              alignItems: "center", justifyContent: "center",
              borderRadius: "0.625rem", backgroundColor: "white", color: "black",
              fontSize: "0.875rem", fontWeight: 900,
            }}>⚡</div>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.02em" }}>AutoFill Agent</span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {NAV.map((item) => {
              const active = page === item.id;
              return (
                <div key={item.id} onClick={() => { setPage(item.id); setNavOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  borderRadius: "0.625rem", padding: "0.625rem 0.75rem",
                  fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer",
                  backgroundColor: active ? "rgba(255,255,255,0.09)" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.25)",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}}
                >
                  <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {/* history badge */}
                  {item.id === "history" && totalRuns > 0 && (
                    <span style={{
                      marginLeft: "auto", fontSize: "0.5625rem", fontWeight: 700,
                      backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
                      borderRadius: "9999px", padding: "1px 7px",
                    }}>{totalRuns}</span>
                  )}
                  {active && item.id !== "history" && (
                    <span style={{ marginLeft: "auto", height: "6px", width: "6px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.6)" }} />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Live stats (from actual history) */}
          <div style={{
            marginTop: "1.5rem", borderRadius: "0.75rem",
            border: "1px solid rgba(255,255,255,0.07)",
            backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem",
          }}>
            <p style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", margin: 0 }}>Total runs</p>
            <p style={{ marginTop: "0.25rem", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.04em", color: totalRuns ? "white" : "rgba(255,255,255,0.1)", margin: "0.25rem 0 0" }}>{totalRuns || "—"}</p>
            <p style={{ marginTop: "0.75rem", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", margin: "0.75rem 0 0" }}>Success rate</p>
            <p style={{ marginTop: "0.25rem", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.04em", color: totalRuns ? "#34d399" : "rgba(255,255,255,0.1)", margin: "0.25rem 0 0" }}>{successRate}</p>
          </div>

          <div style={{ flex: 1 }} />

          {/* User card */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)",
            backgroundColor: "rgba(255,255,255,0.03)", padding: "0.75rem",
          }}>
            <div style={{
              display: "flex", height: "2rem", width: "2rem", flexShrink: 0,
              alignItems: "center", justifyContent: "center",
              borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.1)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                {user?.displayName || "User"}
              </p>
              <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>
                {user?.email || ""}
              </p>
            </div>
            <button onClick={handleLogout} title="Sign out" style={{
              flexShrink: 0, borderRadius: "0.5rem", padding: "0.375rem",
              color: "rgba(255,255,255,0.2)", background: "none", border: "none",
              cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {navOpen && (
        <div onClick={() => setNavOpen(false)} className="sidebar-overlay"
          style={{ position: "fixed", inset: 0, zIndex: 30, backgroundColor: "rgba(0,0,0,0.6)" }} />
      )}

      {/* ══════ MAIN ══════ */}
      <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden", minWidth: 0 }} className="main-content">

        {/* Top bar */}
        <header style={{
          display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between",
          borderBottom: S.border, backgroundColor: "rgba(8,8,8,0.9)",
          padding: "1rem 1.25rem", backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={() => setNavOpen(true)} className="hamburger" style={{
              marginRight: "0.25rem", borderRadius: "0.5rem", padding: "0.375rem",
              color: "rgba(255,255,255,0.3)", background: "none", border: "none",
              cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "-0.03em", color: "white", margin: 0 }}>
              {page === "agent" ? "Form Agent" : "History"}
            </h1>
            <span className="ai-badge" style={{
              borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.08)",
              padding: "0.125rem 0.75rem", fontSize: "0.625rem", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)",
            }}>
              {page === "agent" ? "AI Powered" : `${totalRuns} runs`}
            </span>
          </div>

          {/* Status pill — only on agent page */}
          {page === "agent" && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              borderRadius: "9999px", border: `1px solid ${pill.bdr}`,
              backgroundColor: pill.bg, padding: "0.375rem 0.75rem",
              fontSize: "0.75rem", fontWeight: 600,
            }}>
              <span style={{ height: "8px", width: "8px", borderRadius: "9999px", backgroundColor: pill.dot, flexShrink: 0 }}
                className={status === "running" ? "animate-pulse-dot" : ""} />
              <span style={{ color: pill.text }}>{pill.label}</span>
            </div>
          )}

          {/* Clear history — only on history page */}
          {page === "history" && history.length > 0 && (
            <button onClick={() => setHistory([])} style={{
              background: "none", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0.5rem", padding: "0.375rem 0.875rem",
              fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.3)",
              cursor: "pointer", fontFamily: S.font, transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
            >
              Clear all
            </button>
          )}
        </header>

        {/* ══ AGENT PAGE ══ */}
        {page === "agent" && (
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

            {/* FORM PANEL */}
            <div style={{ display: "flex", flex: 1, flexDirection: "column", overflowY: "auto", borderRight: S.border }}>
              <div style={{ borderBottom: S.border, padding: "1.25rem 1.5rem" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Configure Run</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>Enter the target URL and your profile details</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "1.5rem" }}>
                {/* URL */}
                <Field label="Target URL" required>
                  <div style={{
                    display: "flex", alignItems: "center", overflow: "hidden",
                    borderRadius: "0.6875rem", border: "1px solid rgba(255,255,255,0.09)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                  }}>
                    <span style={{ flexShrink: 0, paddingLeft: "1rem", fontSize: "0.9375rem", color: "rgba(255,255,255,0.2)" }}>🔗</span>
                    <input type="text" placeholder="https://example.com/contact" value={url}
                      onChange={e => setUrl(e.target.value)} disabled={running}
                      style={{ flex: 1, background: "transparent", padding: "0.75rem 0.75rem", fontSize: "0.875rem", color: "white", outline: "none", border: "none", opacity: running ? 0.4 : 1, fontFamily: S.font }}
                    />
                  </div>
                </Field>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ height: "1px", flex: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
                  <span style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>Profile</span>
                  <div style={{ height: "1px", flex: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
                </div>

                {/* First + Last */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="two-col">
                  <Field label="First Name" required>
                    <StyledInput value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} placeholder="John" disabled={running} />
                  </Field>
                  <Field label="Last Name">
                    <StyledInput value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} placeholder="Doe" disabled={running} />
                  </Field>
                </div>

                {/* Email + Phone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="two-col">
                  <Field label="Work Email" required>
                    <StyledInput type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="john@company.com" disabled={running} />
                  </Field>
                  <Field label="Phone Number">
                    <StyledInput value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" disabled={running} />
                  </Field>
                </div>

                {/* Company */}
                <Field label="Company">
                  <StyledInput value={profile.company} onChange={e => setProfile({ ...profile, company: e.target.value })} placeholder="Acme Technologies" disabled={running} />
                </Field>

                {/* Message */}
                <Field label="Message">
                  <textarea value={profile.message} onChange={e => setProfile({ ...profile, message: e.target.value })}
                    disabled={running} placeholder="Tell them what you're looking for…" rows={3}
                    style={{
                      width: "100%", boxSizing: "border-box", borderRadius: "0.6875rem",
                      border: "1px solid rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.04)",
                      padding: "0.75rem 1rem", fontSize: "0.875rem", color: "white",
                      outline: "none", resize: "vertical", opacity: running ? 0.4 : 1,
                      fontFamily: S.font, transition: "border-color 0.2s, background-color 0.2s",
                    }}
                    onFocus={e => { e.target.style.borderColor = "rgba(255,255,255,0.22)"; e.target.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
                    onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                  />
                </Field>

                {/* Error msg */}
                {status === "error" && msg && (
                  <div style={{
                    borderRadius: "0.625rem", border: "1px solid rgba(248,113,113,0.2)",
                    backgroundColor: "rgba(248,113,113,0.06)", padding: "0.75rem 1rem",
                    fontSize: "0.8125rem", fontWeight: 500, color: "#f87171",
                  }}>{msg}</div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
                  {(status === "success" || status === "error") && (
                    <button onClick={handleReset} style={{
                      borderRadius: "0.6875rem", border: "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: "rgba(255,255,255,0.04)", padding: "0.75rem 1.25rem",
                      fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.4)",
                      cursor: "pointer", transition: "all 0.15s", fontFamily: S.font,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                    >Reset</button>
                  )}
                  <button
                    onClick={running ? undefined : (status === "success" || status === "error") ? handleReset : () => handleRun()}
                    disabled={running}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
                      borderRadius: "0.6875rem", padding: "0.75rem 0",
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
                      <>
                        <span style={{ display: "block", height: "1rem", width: "1rem", borderRadius: "9999px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "rgba(255,255,255,0.7)" }} className="animate-spin-slow" />
                        <span>Agent Running…</span>
                      </>
                    ) : status === "success" ? <span>✅ Run Again</span> : <span>⚡ Launch Agent</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* ACTIVITY PANEL */}
            <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", width: "44%", flexShrink: 0 }} className="activity-panel">
              <div style={{ borderBottom: S.border, padding: "1.25rem 1.5rem" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Agent Activity</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>Live step-by-step progress</p>
              </div>

              <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: "1.5rem" }}>
                {/* Steps */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {STEPS.map((s, idx) => {
                    const done   = step > s.id;
                    const active = step === s.id && running;
                    const dotBdr  = done ? "1px solid rgba(52,211,153,0.3)" : active ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.07)";
                    const dotBg   = done ? "rgba(52,211,153,0.1)"           : active ? "rgba(255,255,255,0.1)"           : "rgba(255,255,255,0.03)";
                    const dotClr  = done ? "#34d399"                        : active ? "white"                           : "rgba(255,255,255,0.15)";
                    const lblClr  = done ? "rgba(255,255,255,0.35)"         : active ? "rgba(255,255,255,0.8)"           : "rgba(255,255,255,0.15)";

                    return (
                      <div key={s.id} style={{ display: "flex", gap: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{
                            display: "flex", height: "1.75rem", width: "1.75rem", flexShrink: 0,
                            alignItems: "center", justifyContent: "center", borderRadius: "9999px",
                            border: dotBdr, backgroundColor: dotBg, color: dotClr,
                            fontSize: "0.6875rem", fontWeight: 700, transition: "all 0.3s",
                            boxShadow: active ? "0 0 12px rgba(255,255,255,0.08)" : "none",
                          }}>
                            {done ? (
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
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
                          {active && (
                            <span style={{ borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.06)", padding: "0.125rem 0.5rem", fontSize: "0.625rem", fontWeight: 600, color: "rgba(255,255,255,0.4)" }} className="animate-pulse-dot">working</span>
                          )}
                          {done && (
                            <span style={{ borderRadius: "0.375rem", border: "1px solid rgba(52,211,153,0.15)", backgroundColor: "rgba(52,211,153,0.06)", padding: "0.125rem 0.5rem", fontSize: "0.625rem", fontWeight: 600, color: "rgba(52,211,153,0.7)" }}>done</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status message */}
                {status !== "idle" && msg && (
                  <div style={{
                    marginTop: "0.5rem", borderRadius: "0.6875rem",
                    border: status === "success" ? "1px solid rgba(52,211,153,0.2)" : status === "error" ? "1px solid rgba(248,113,113,0.2)" : "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: status === "success" ? "rgba(52,211,153,0.06)" : status === "error" ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.04)",
                    padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 500,
                    color: status === "success" ? "#34d399" : status === "error" ? "#f87171" : "rgba(255,255,255,0.4)",
                  }} className="animate-fade-up">{msg}</div>
                )}

                {/* Live console */}
                {logs.length > 0 && (
                  <div style={{ marginTop: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(0,0,0,0.4)", overflow: "hidden" }}>
                    <div style={{ padding: "0.5rem 0.875rem", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ height: "6px", width: "6px", borderRadius: "9999px", backgroundColor: running ? "#34d399" : "rgba(255,255,255,0.2)" }} className={running ? "animate-pulse-dot" : ""} />
                      Agent Console
                    </div>
                    <div style={{ maxHeight: "160px", overflowY: "auto", padding: "0.625rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {logs.map((line, i) => (
                        <div key={i} style={{ fontSize: "0.6875rem", lineHeight: 1.5, color: i === logs.length - 1 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)", fontFamily: "ui-monospace, monospace" }}>
                          <span style={{ color: "rgba(255,255,255,0.15)", marginRight: "0.5rem" }}>›</span>{line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Idle hint */}
                {status === "idle" && (
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: "0.6875rem", border: "1px dashed rgba(255,255,255,0.07)", padding: "1rem" }}>
                    <span style={{ fontSize: "1.125rem", opacity: 0.3 }}>🕐</span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>Launch the agent to see live activity here</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ HISTORY PAGE ══ */}
        {page === "history" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            {history.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: "100%", gap: "1rem", opacity: 0.4,
              }}>
                <span style={{ fontSize: "2.5rem" }}>📋</span>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.4)" }}>No runs yet</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>Every form you fill will appear here</p>
                <button onClick={() => setPage("agent")} style={{
                  marginTop: "0.5rem", background: "white", color: "black", border: "none",
                  borderRadius: "0.625rem", padding: "0.625rem 1.25rem",
                  fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", fontFamily: S.font,
                }}>⚡ Run the agent</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 860, margin: "0 auto" }}>
                {/* Summary row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  {[
                    { label: "Total Runs",    val: totalRuns,                         color: "white"    },
                    { label: "Successful",    val: successCount,                      color: "#34d399"  },
                    { label: "Failed",        val: totalRuns - successCount,           color: "#f87171"  },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ borderRadius: "0.75rem", border: S.border, backgroundColor: "#0f0f0f", padding: "1rem 1.25rem" }}>
                      <p style={{ margin: 0, fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>{label}</p>
                      <p style={{ margin: "0.375rem 0 0", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.04em", color }}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* History cards */}
                {history.map(entry => (
                  <HistoryCard key={entry.id} entry={entry} onRerun={handleRerun} />
                ))}
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
        @media (max-width: 640px) {
          .two-col         { grid-template-columns: 1fr !important; }
          .activity-panel  { display: none !important; }
          .ai-badge        { display: none !important; }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.15); }
        textarea { color-scheme: dark; }
      `}</style>
    </div>
  );
}
