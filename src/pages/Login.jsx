import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase";

const FEATURES = [
  { icon: "🔍", title: "Smart Detection", desc: "Reads any form structure automatically" },
  { icon: "⚡", title: "Instant Fill",    desc: "Completes forms in under 10 seconds" },
  { icon: "🔒", title: "Private & Safe",  desc: "Your data never leaves your device" },
];

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode]               = useState("login");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGLoading]  = useState(false);

  const clearErr = () => setError("");

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    clearErr(); setLoading(true);
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      const raw = err.code?.replace("auth/", "").replace(/-/g, " ") || "Something went wrong";
      setError(raw.charAt(0).toUpperCase() + raw.slice(1) + ".");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    clearErr(); setGLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/home");
    } catch (err) {
      const raw = err.code?.replace("auth/", "").replace(/-/g, " ") || "Google sign-in failed";
      setError(raw.charAt(0).toUpperCase() + raw.slice(1) + ".");
    } finally { setGLoading(false); }
  };

  const busy = loading || googleLoading;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#080808", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>

      {/* ══════ LEFT PANEL ══════ */}
      <div style={{
        display: "none",
        position: "relative",
        width: "52%",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "#0c0c0c",
      }} className="left-panel">
        {/* grid bg */}
        <div style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          opacity: 0.035,
          backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }} />
        {/* glows */}
        <div style={{
          pointerEvents: "none",
          position: "absolute",
          bottom: "-8rem",
          left: "-8rem",
          height: "500px",
          width: "500px",
          borderRadius: "9999px",
          background: "white",
          opacity: 0.018,
          filter: "blur(96px)",
        }} />
        <div style={{
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          right: 0,
          height: "300px",
          width: "300px",
          borderRadius: "9999px",
          background: "white",
          opacity: 0.012,
          filter: "blur(96px)",
        }} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", height: "100%", flexDirection: "column", padding: "3rem 3.5rem" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              display: "flex", height: "2.25rem", width: "2.25rem",
              alignItems: "center", justifyContent: "center",
              borderRadius: "0.75rem", backgroundColor: "white",
              color: "black", fontSize: "1rem", fontWeight: 900,
            }}>⚡</div>
            <span style={{ fontSize: "1.0625rem", fontWeight: 700, letterSpacing: "-0.02em", color: "white" }}>AutoFill Agent</span>
          </div>

          {/* Hero copy */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "4rem 0" }}>
            <div style={{
              marginBottom: "1.75rem",
              width: "fit-content",
              borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "0.375rem 1rem",
              fontSize: "0.6875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.3)",
            }}>
              AI-Powered Automation
            </div>

            <h1 style={{
              marginBottom: "1.25rem",
              fontSize: "3.25rem",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              color: "white",
            }}>
              Stop filling<br />
              forms <span style={{ color: "rgba(255,255,255,0.25)" }}>manually.</span>
            </h1>

            <p style={{
              marginBottom: "3rem",
              maxWidth: "380px",
              fontSize: "0.9375rem",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.35)",
            }}>
              AutoFill Agent reads any web form and completes it instantly using your saved profile. One click. Every form.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    display: "flex", height: "2.5rem", width: "2.5rem",
                    flexShrink: 0, alignItems: "center", justifyContent: "center",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    fontSize: "1rem",
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{f.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.15)" }}>© 2025 AutoFill Agent · MIT License</div>
        </div>
      </div>

      {/* ══════ RIGHT PANEL ══════ */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>

          {/* Mobile brand */}
          <div className="mobile-brand" style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              display: "flex", height: "2rem", width: "2rem",
              alignItems: "center", justifyContent: "center",
              borderRadius: "0.75rem", backgroundColor: "white",
              color: "black", fontSize: "0.875rem", fontWeight: 900,
            }}>⚡</div>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>AutoFill Agent</span>
          </div>

          {/* Tab toggle */}
          <div style={{
            marginBottom: "1.75rem",
            display: "flex",
            gap: "0.25rem",
            borderRadius: "0.875rem",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            padding: "0.25rem",
          }}>
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); clearErr(); }}
                style={{
                  flex: 1,
                  borderRadius: "0.625rem",
                  padding: "0.625rem 0",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: mode === m ? "white" : "transparent",
                  color: mode === m ? "black" : "rgba(255,255,255,0.35)",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                }}
                onMouseEnter={(e) => { if (mode !== m) e.target.style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={(e) => { if (mode !== m) e.target.style.color = "rgba(255,255,255,0.35)"; }}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.03em", color: "white", margin: 0 }}>
              {mode === "login" ? "Welcome back" : "Get started"}
            </h2>
            <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.35)" }}>
              {mode === "login"
                ? "Sign in to your AutoFill Agent account"
                : "Create your free account in seconds"}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            style={{
              marginBottom: "1.25rem",
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.05)",
              padding: "0.75rem 0",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.4 : 1,
              transition: "all 0.2s",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => { if (!busy) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white"; }}}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            {googleLoading ? (
              <span style={{
                display: "block", height: "1rem", width: "1rem",
                borderRadius: "9999px",
                border: "2px solid rgba(255,255,255,0.2)",
                borderTopColor: "white",
              }} className="animate-spin-slow" />
            ) : (
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
            )}
            <span>{googleLoading ? "Signing in…" : "Continue with Google"}</span>
          </button>

          {/* Divider */}
          <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ height: "1px", flex: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: "rgba(255,255,255,0.2)" }}>or continue with email</span>
            <div style={{ height: "1px", flex: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{
              display: "block", marginBottom: "0.5rem",
              fontSize: "0.75rem", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.3)",
            }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={busy}
              style={{
                width: "100%",
                borderRadius: "0.6875rem",
                border: "1px solid rgba(255,255,255,0.09)",
                backgroundColor: "rgba(255,255,255,0.04)",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                color: "white",
                outline: "none",
                opacity: busy ? 0.4 : 1,
                boxSizing: "border-box",
                transition: "border-color 0.2s, background-color 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{
                fontSize: "0.75rem", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.3)",
              }}>
                Password
              </label>
              {mode === "login" && (
                <span style={{
                  cursor: "pointer", fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.25)", transition: "color 0.2s",
                }}
                  onMouseEnter={(e) => e.target.style.color = "rgba(255,255,255,0.5)"}
                  onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.25)"}
                >
                  Forgot password?
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={busy}
              style={{
                width: "100%",
                borderRadius: "0.6875rem",
                border: "1px solid rgba(255,255,255,0.09)",
                backgroundColor: "rgba(255,255,255,0.04)",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                color: "white",
                outline: "none",
                opacity: busy ? 0.4 : 1,
                boxSizing: "border-box",
                transition: "border-color 0.2s, background-color 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: "1rem",
              borderRadius: "0.625rem",
              border: "1px solid rgba(239,68,68,0.2)",
              backgroundColor: "rgba(239,68,68,0.07)",
              padding: "0.75rem 1rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "rgb(248,113,113)",
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.625rem",
              borderRadius: "0.75rem",
              backgroundColor: "white",
              padding: "0.875rem 0",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "black",
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.5 : 1,
              transition: "background-color 0.2s, transform 0.1s",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => { if (!busy) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}
            onMouseDown={(e) => { if (!busy) e.currentTarget.style.transform = "scale(0.99)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {loading && (
              <span style={{
                display: "block", height: "1rem", width: "1rem",
                borderRadius: "9999px",
                border: "2px solid rgba(0,0,0,0.2)",
                borderTopColor: "black",
              }} className="animate-spin-slow" />
            )}
            <span>
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </span>
          </button>

          {/* Switch */}
          <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); clearErr(); }}
              style={{
                fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontSize: "inherit",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.color = "white"}
              onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.6)"}
            >
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .left-panel { display: flex !important; }
          .mobile-brand { display: none !important; }
        }
      `}</style>
    </div>
  );
}
