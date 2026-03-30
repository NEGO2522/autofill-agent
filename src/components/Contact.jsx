import { useState } from "react";

/* ══════════════════════════════════════════════════════
   DESIGN TOKENS — matches Landing / Home / Login / Form
══════════════════════════════════════════════════════ */
const S = {
  bg:     "#080808",
  panel:  "#0c0c0c",
  card:   "#0f0f0f",
  border: "1px solid rgba(255,255,255,0.07)",
  font:   "Inter, ui-sans-serif, system-ui, sans-serif",
  muted:  "rgba(255,255,255,0.25)",
  accent: "#34d399",
};

const CONTACT_ITEMS = [
  {
    icon: "✉️",
    label: "Email",
    value: "support@autofill-agent.dev",
    href: "mailto:2024btechaimlkshitij18489@poornima.edu.in",
    desc: "We reply within 24 hours",
  },
  {
    icon: "🐙",
    label: "GitHub",
    value: "github.com/autofill-agent",
    href: "https://github.com/NEGO2522/autofill-agent",
    desc: "Open an issue or PR",
  },
];

/* ── shared input primitive ── */
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{
        display: "block", marginBottom: "0.4rem",
        fontSize: "0.6875rem", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.28)",
      }}>
        {label}
        {required && <span style={{ color: "rgba(255,255,255,0.18)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, disabled }) {
  const [foc, setFoc] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      onFocus={() => setFoc(true)}
      onBlur={() => setFoc(false)}
      style={{
        width: "100%", boxSizing: "border-box",
        borderRadius: "0.625rem",
        border: foc ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.08)",
        backgroundColor: foc ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        padding: "0.6875rem 0.875rem",
        fontSize: "0.8125rem", color: "white",
        outline: "none", opacity: disabled ? 0.45 : 1,
        transition: "border-color 0.2s, background-color 0.2s",
        fontFamily: S.font,
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, disabled, rows = 4 }) {
  const [foc, setFoc] = useState(false);
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      rows={rows}
      onFocus={() => setFoc(true)}
      onBlur={() => setFoc(false)}
      style={{
        width: "100%", boxSizing: "border-box",
        borderRadius: "0.625rem",
        border: foc ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.08)",
        backgroundColor: foc ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        padding: "0.6875rem 0.875rem",
        fontSize: "0.8125rem", color: "white",
        outline: "none", resize: "vertical",
        opacity: disabled ? 0.45 : 1,
        fontFamily: S.font,
        transition: "border-color 0.2s, background-color 0.2s",
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function Contact({ onClose }) {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus]   = useState("idle"); // idle | sending | sent | error
  const [errMsg, setErrMsg]   = useState("");

  const set = (key) => (e) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    if (status === "error") { setStatus("idle"); setErrMsg(""); }
  };

  const handleSubmit = async () => {
    if (!form.name.trim())    { setStatus("error"); setErrMsg("Please enter your name."); return; }
    if (!form.email.trim())   { setStatus("error"); setErrMsg("Please enter your email."); return; }
    if (!form.message.trim()) { setStatus("error"); setErrMsg("Please enter a message."); return; }

    setStatus("sending");
    // Simulate send — swap with your real API / EmailJS / etc.
    await new Promise(r => setTimeout(r, 1400));
    setStatus("sent");
  };

  const busy = status === "sending";
  const sent = status === "sent";

  return (
    <div style={{
      height: "100vh",
      overflow: "hidden",
      backgroundColor: S.bg,
      fontFamily: S.font,
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "4rem 1.5rem",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }}>

      {/* grid bg */}
      <div style={{
        pointerEvents: "none", position: "absolute", inset: 0,
        opacity: 0.025,
        backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
        backgroundSize: "44px 44px",
      }} />

      {/* ambient glow */}
      <div style={{
        pointerEvents: "none", position: "absolute",
        width: 600, height: 600, borderRadius: "50%", background: "white",
        top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        filter: "blur(140px)", opacity: 0.016,
      }} />

      {/* close button — only shown when used as overlay */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "fixed", top: "1.25rem", right: "1.25rem", zIndex: 50,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0.5rem", padding: "0.375rem 0.75rem",
            color: "rgba(255,255,255,0.4)", cursor: "pointer",
            fontSize: "0.75rem", fontWeight: 600, fontFamily: S.font,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >
          ✕ Close
        </button>
      )}

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 900, height: "100%", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "3rem", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            borderRadius: "9999px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            padding: "0.375rem 1rem",
            fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)",
            marginBottom: "1.5rem",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: S.accent, display: "inline-block" }} />
            Get in touch
          </div>
          <h1 style={{
            fontSize: "clamp(2rem,5vw,3.25rem)", fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 1.05, color: "white",
            marginBottom: "0.75rem",
          }}>
            We'd love to hear<br />
            <span style={{ color: "rgba(255,255,255,0.2)" }}>from you.</span>
          </h1>
          <p style={{
            fontSize: "0.9375rem", color: S.muted, lineHeight: 1.75,
            maxWidth: 460, margin: "0 auto",
          }}>
            Have a question, found a bug, or just want to say hi? Drop us a message and we'll get back to you.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: "1.5rem",
          alignItems: "start",
        }} className="contact-grid">

          {/* LEFT — contact info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

            {/* Quick links */}
            {CONTACT_ITEMS.map(item => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  borderRadius: "0.875rem",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: S.card,
                  padding: "1rem 1.125rem",
                  textDecoration: "none",
                  transition: "border-color 0.2s, background-color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.backgroundColor = S.card; }}
              >
                <div style={{
                  width: "2.5rem", height: "2.5rem", flexShrink: 0,
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.125rem",
                }}>
                  {item.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.5625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.22)" }}>{item.label}</p>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</p>
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>{item.desc}</p>
                </div>
                <svg style={{ flexShrink: 0, marginLeft: "auto" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.2" strokeLinecap="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
              </a>
            ))}

            {/* Response time note */}
            <div style={{
              borderRadius: "0.875rem",
              border: "1px solid rgba(52,211,153,0.15)",
              backgroundColor: "rgba(52,211,153,0.04)",
              padding: "0.875rem 1.125rem",
              display: "flex", alignItems: "center", gap: "0.625rem",
            }}>
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚡</span>
              <div>
                <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "rgba(52,211,153,0.85)" }}>Usually fast</p>
                <p style={{ margin: "0.1rem 0 0", fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>Average response time is under 6 hours on weekdays.</p>
              </div>
            </div>
          </div>

          {/* RIGHT — contact form */}
          <div style={{
            borderRadius: "1rem",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: S.panel,
            padding: "1.75rem",
            overflow: "hidden",
          }}>
            {sent ? (
              /* ── Success state ── */
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "1rem",
                minHeight: 320, textAlign: "center",
              }}>
                <div style={{
                  width: "3.5rem", height: "3.5rem", borderRadius: "9999px",
                  border: "1px solid rgba(52,211,153,0.25)",
                  backgroundColor: "rgba(52,211,153,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem",
                }}>
                  ✅
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>Message sent!</p>
                  <p style={{ margin: "0.375rem 0 0", fontSize: "0.875rem", color: S.muted, lineHeight: 1.6 }}>
                    Thanks for reaching out. We'll get<br />back to you within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setStatus("idle"); }}
                  style={{
                    marginTop: "0.5rem",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.625rem", padding: "0.5rem 1.25rem",
                    fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.45)",
                    cursor: "pointer", fontFamily: S.font, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                >
                  Send another →
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.9375rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.02em" }}>Send a message</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.28)" }}>Fill out the form and we'll be in touch.</p>
                </div>

                {/* Name + Email row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }} className="form-row">
                  <Field label="Your Name" required>
                    <Input value={form.name} onChange={set("name")} placeholder="Arjun Sharma" disabled={busy} />
                  </Field>
                  <Field label="Email" required>
                    <Input type="email" value={form.email} onChange={set("email")} placeholder="arjun@gmail.com" disabled={busy} />
                  </Field>
                </div>

                <Field label="Subject">
                  <Input value={form.subject} onChange={set("subject")} placeholder="Bug report / Feature request / Just saying hi…" disabled={busy} />
                </Field>

                <Field label="Message" required>
                  <Textarea value={form.message} onChange={set("message")} placeholder="Describe your issue or idea in detail…" disabled={busy} rows={5} />
                </Field>

                {/* Error */}
                {status === "error" && errMsg && (
                  <div style={{
                    borderRadius: "0.625rem",
                    border: "1px solid rgba(248,113,113,0.2)",
                    backgroundColor: "rgba(248,113,113,0.06)",
                    padding: "0.625rem 0.875rem",
                    fontSize: "0.8125rem", fontWeight: 500, color: "#f87171",
                  }}>
                    {errMsg}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={busy}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
                    width: "100%", borderRadius: "0.75rem", padding: "0.8125rem 0",
                    fontSize: "0.875rem", fontWeight: 700,
                    border: "none",
                    backgroundColor: busy ? "rgba(255,255,255,0.07)" : "white",
                    color: busy ? "rgba(255,255,255,0.3)" : "black",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.6 : 1,
                    transition: "all 0.15s", fontFamily: S.font,
                  }}
                  onMouseEnter={e => { if (!busy) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)"; }}
                  onMouseLeave={e => { if (!busy) e.currentTarget.style.backgroundColor = "white"; }}
                  onMouseDown={e => { if (!busy) e.currentTarget.style.transform = "scale(0.99)"; }}
                  onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {busy ? (
                    <>
                      <span style={{
                        display: "block", width: "1rem", height: "1rem", borderRadius: "9999px",
                        border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "rgba(255,255,255,0.7)",
                        animation: "spin 0.8s linear infinite",
                      }} />
                      Sending…
                    </>
                  ) : (
                    <span>✉️ Send Message</span>
                  )}
                </button>

                <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.18)", textAlign: "center" }}>
                  Your info is never shared with third parties.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.15); }
        textarea { color-scheme: dark; }
        ::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar-thumb { display: none; }
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        html, body { overflow: hidden; }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
