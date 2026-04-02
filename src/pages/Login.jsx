import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

const FEATURES = [
  { icon: "🔍", title: "Smart Detection", desc: "Reads any form structure automatically" },
  { icon: "⚡", title: "Instant Fill",    desc: "Completes forms in under 2 seconds"    },
  { icon: "🔒", title: "Private & Safe",  desc: "Your data stays in Firestore, not shared" },
];

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Read ?mode=signup from URL
  const initialMode = new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "login";
  const [mode,  setMode]  = useState(initialMode);
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [error, setError] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [gBusy, setGBusy] = useState(false);

  /* If already logged in, redirect immediately */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) await goToCorrectPage(u);
    });
    return unsub;
  }, []);

  const clearErr = () => setError("");

  /** After login/signup, check if profile exists to decide where to go. */
  const goToCorrectPage = async (u) => {
    try {
      const snap = await getDoc(doc(db, "profiles", u.uid));
      navigate(snap.exists() ? "/home" : "/form", { replace: true });
    } catch {
      navigate("/form", { replace: true });
    }
  };

  const handleSubmit = async () => {
    if (!email || !pass) { setError("Enter your email and password."); return; }
    clearErr(); setBusy(true);
    try {
      const res = mode === "login"
        ? await signInWithEmailAndPassword(auth, email, pass)
        : await createUserWithEmailAndPassword(auth, email, pass);
      await goToCorrectPage(res.user);
    } catch (e) {
      const raw = e.code?.replace("auth/", "").replace(/-/g, " ") || "Something went wrong";
      setError(raw.charAt(0).toUpperCase() + raw.slice(1) + ".");
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    clearErr(); setGBusy(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await goToCorrectPage(res.user);
    } catch (e) {
      const raw = e.code?.replace("auth/", "").replace(/-/g, " ") || "Google sign-in failed";
      setError(raw.charAt(0).toUpperCase() + raw.slice(1) + ".");
    } finally { setGBusy(false); }
  };

  const isLoading = busy || gBusy;

  const inp = (focused = false) => ({
    width: "100%", boxSizing: "border-box",
    borderRadius: "0.6875rem",
    border: `1px solid ${focused ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.09)"}`,
    backgroundColor: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
    padding: "0.6875rem 0.875rem",
    fontSize: "0.875rem", color: "white",
    outline: "none", opacity: isLoading ? 0.4 : 1,
    transition: "border-color 0.2s, background-color 0.2s",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  });

  const [ef, setEf] = useState(false);
  const [pf, setPf] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#080808", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>

      {/* ═══ LEFT PANEL (desktop only) ═══ */}
      <div className="left-panel" style={{
        display: "none", position: "relative",
        width: "52%", flexDirection: "column",
        overflow: "hidden", borderRight: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "#0c0c0c",
      }}>
        <div style={{ pointerEvents: "none", position: "absolute", inset: 0, opacity: 0.035, backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div style={{ pointerEvents: "none", position: "absolute", bottom: "-8rem", left: "-8rem", height: 500, width: 500, borderRadius: "9999px", background: "white", opacity: 0.018, filter: "blur(96px)" }} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", height: "100%", flexDirection: "column", padding: "3rem 3.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", height: "2.25rem", width: "2.25rem", alignItems: "center", justifyContent: "center", borderRadius: "0.75rem", backgroundColor: "white", color: "black", fontSize: "1rem", fontWeight: 900 }}>⚡</div>
            <span style={{ fontSize: "1.0625rem", fontWeight: 700, letterSpacing: "-0.02em", color: "white" }}>AutoSlay</span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "4rem 0" }}>
            <div style={{ marginBottom: "1.75rem", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.1)", padding: "0.375rem 1rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", width: "fit-content" }}>
              Smart Form Autofill
            </div>
            <h1 style={{ marginBottom: "1.25rem", fontSize: "3.25rem", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.04em", color: "white" }}>
              Stop filling<br />forms <span style={{ color: "rgba(255,255,255,0.25)" }}>manually.</span>
            </h1>
            <p style={{ marginBottom: "3rem", maxWidth: 380, fontSize: "0.9375rem", lineHeight: 1.75, color: "rgba(255,255,255,0.35)" }}>
              AutoSlay reads any web form and completes it instantly using your saved profile. One click. Every form.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ display: "flex", height: "2.5rem", width: "2.5rem", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", fontSize: "1rem" }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{f.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.15)" }}>© 2025 AutoSlay · MIT License</div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile brand */}
          <div className="mobile-brand" style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", height: "2rem", width: "2rem", alignItems: "center", justifyContent: "center", borderRadius: "0.75rem", backgroundColor: "white", color: "black", fontSize: "0.875rem", fontWeight: 900 }}>⚡</div>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>AutoSlay</span>
          </div>

          {/* Mode toggle */}
          <div style={{ marginBottom: "1.75rem", display: "flex", gap: "0.25rem", borderRadius: "0.875rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", padding: "0.25rem" }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); clearErr(); }}
                style={{ flex: 1, borderRadius: "0.625rem", padding: "0.625rem 0", fontSize: "0.8125rem", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s", backgroundColor: mode === m ? "white" : "transparent", color: mode === m ? "black" : "rgba(255,255,255,0.35)", boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.3)" : "none" }}
              >{m === "login" ? "Sign In" : "Create Account"}</button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.03em", color: "white", margin: 0 }}>
              {mode === "login" ? "Welcome back" : "Get started"}
            </h2>
            <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.35)" }}>
              {mode === "login" ? "Sign in to your AutoSlay account" : "Create your free account in seconds"}
            </p>
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={isLoading}
            style={{ marginBottom: "1.25rem", display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", padding: "0.75rem 0", fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.4 : 1, transition: "all 0.2s", boxSizing: "border-box" }}
            onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "white"; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            {gBusy
              ? <span style={{ display: "block", height: "1rem", width: "1rem", borderRadius: "9999px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "white", animation: "aSpin 0.7s linear infinite" }} />
              : <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/></svg>
            }
            <span>{gBusy ? "Signing in…" : "Continue with Google"}</span>
          </button>

          {/* Divider */}
          <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ height: 1, flex: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.2)" }}>or continue with email</span>
            <div style={{ height: 1, flex: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>Email address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} disabled={isLoading}
              style={inp(ef)} onFocus={() => setEf(true)} onBlur={() => setEf(false)} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ marginBottom: "0.4rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>Password</label>
              {mode === "login" && <span style={{ cursor: "pointer", fontSize: "0.6875rem", color: "rgba(255,255,255,0.2)" }}>Forgot?</span>}
            </div>
            <input type="password" placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} disabled={isLoading}
              style={inp(pf)} onFocus={() => setPf(true)} onBlur={() => setPf(false)} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: "1rem", borderRadius: "0.625rem", border: "1px solid rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.07)", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 500, color: "rgb(248,113,113)" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={isLoading}
            style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: "0.625rem", borderRadius: "0.75rem", backgroundColor: "white", padding: "0.875rem 0", fontSize: "0.875rem", fontWeight: 700, color: "black", border: "none", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.5 : 1, transition: "background-color 0.2s", boxSizing: "border-box" }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "white"; }}
          >
            {busy && <span style={{ display: "block", height: "1rem", width: "1rem", borderRadius: "9999px", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "black", animation: "aSpin 0.7s linear infinite" }} />}
            {busy ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          {/* Switch */}
          <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); clearErr(); }}
              style={{ fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "inherit" }}
            >{mode === "login" ? "Sign up free" : "Sign in"}</button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes aSpin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.15); }
        @media (min-width: 1024px) {
          .left-panel { display: flex !important; }
          .mobile-brand { display: none !important; }
        }
      `}</style>
    </div>
  );
}
