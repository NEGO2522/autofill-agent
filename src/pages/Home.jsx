import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useState, useEffect } from "react";

const S = {
  bg:      "#080808",
  surface: "#0c0c0c",
  card:    "#0f0f0f",
  border:  "1px solid rgba(255,255,255,0.07)",
  border2: "1px solid rgba(255,255,255,0.09)",
  font:    "Inter, ui-sans-serif, system-ui, sans-serif",
  muted:   "rgba(255,255,255,0.25)",
};

const CSS = `
  @keyframes fade-up  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes glow-pulse { 0%,100%{opacity:.018} 50%{opacity:.032} }
  @keyframes pulse-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.75)} }

  .anim-fade-up  { animation: fade-up 0.45s ease forwards; }
  .anim-fade-up2 { animation: fade-up 0.45s 0.1s ease both; }
  .anim-fade-up3 { animation: fade-up 0.45s 0.2s ease both; }
  .anim-glow     { animation: glow-pulse 4s ease-in-out infinite; }
  .anim-pulse    { animation: pulse-dot 1.4s ease-in-out infinite; }

  .action-card {
    transition: border-color .2s, background-color .2s, transform .2s;
    cursor: pointer;
  }
  .action-card:hover {
    border-color: rgba(255,255,255,0.16) !important;
    background-color: rgba(255,255,255,0.045) !important;
    transform: translateY(-2px);
  }
  .action-card:hover .card-cta {
    color: white !important;
  }
  .step-dot { animation: pulse-dot 1.4s ease-in-out infinite; }

  @media (max-width: 860px) {
    .home-grid { flex-direction: column !important; }
    .home-grid > div { width: 100% !important; flex: none !important; }
  }
`;

export default function Home() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const firstName = user?.displayName?.split(" ")[0] || null;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: S.bg,
      fontFamily: S.font,
      color: "white",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{CSS}</style>

      {/* ── Grid background ── */}
      <div style={{
        pointerEvents: "none",
        position: "fixed", inset: 0, zIndex: 0,
        opacity: 0.03,
        backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
        backgroundSize: "44px 44px",
      }} />

      {/* ── Ambient glow ── */}
      <div className="anim-glow" style={{
        pointerEvents: "none",
        position: "fixed",
        width: 700, height: 700,
        borderRadius: "50%",
        background: "white",
        top: "50%", left: "50%",
        transform: "translate(-50%, -60%)",
        filter: "blur(140px)",
        opacity: 0.018,
        zIndex: 0,
      }} />

      {/* ════ TOPBAR ════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 56,
        backgroundColor: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: S.border,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{
            display: "flex", width: 28, height: 28,
            borderRadius: "0.5rem",
            backgroundColor: "white", color: "black",
            alignItems: "center", justifyContent: "center",
            fontSize: "0.8125rem", fontWeight: 900,
          }}>⚡</div>
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.02em" }}>AutoSlay</span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {firstName && (
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.3)" }}>
              Hey, <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{firstName}</span>
            </span>
          )}
          <button
            onClick={() => navigate("/form")}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: S.border2,
              borderRadius: "0.625rem",
              padding: "0.4rem 0.875rem",
              fontSize: "0.8125rem", fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer", fontFamily: S.font,
              transition: "all .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            My Profile
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "none", border: "none",
              fontSize: "0.8125rem", fontWeight: 500,
              color: "rgba(255,255,255,0.2)",
              cursor: "pointer", fontFamily: S.font,
              transition: "color .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
        overflow: "hidden",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "5rem 2rem",
      }}>
        <div style={{ width: "100%", maxWidth: 1020 }}>

          {/* ── Hero label ── */}
          <div className="anim-fade-up" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            borderRadius: "9999px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            padding: "0.35rem 1rem",
            fontSize: "0.625rem", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "2rem",
          }}>
            <span className="anim-pulse" style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "rgba(255,255,255,0.4)", display: "inline-block",
            }} />
            Chrome Extension
          </div>

          {/* ── Two-column grid ── */}
          <div className="home-grid" style={{
            display: "flex",
            alignItems: "stretch",
            gap: "1.5rem",
          }}>

            {/* ── LEFT — Welcome copy ── */}
            <div className="anim-fade-up2" style={{
              flex: "1 1 0",
              display: "flex", flexDirection: "column",
              justifyContent: "center",
              gap: "1.5rem",
              borderRadius: "1rem",
              border: S.border,
              background: S.surface,
              padding: "2.5rem",
            }}>
              {/* Heading */}
              <div>
                <h1 style={{
                  margin: 0,
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.05em",
                  lineHeight: 1.05,
                  color: "white",
                }}>
                  Welcome to<br />
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>AutoSlay.</span>
                </h1>
                <p style={{
                  marginTop: "1rem", marginBottom: 0,
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.75,
                  maxWidth: 360,
                }}>
                  Fill any form in one click — job applications, hackathons, events, registrations, and more. Save your details once, AutoSlay handles the rest.
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />

              {/* How it works steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { n: "01", title: "Save your profile details",    desc: "Name, email, resume, skills — once and done." },
                  { n: "02", title: "Enable extension on browser",  desc: "Download & enable AutoSlay on Chrome." },
                  { n: "03", title: "Open any form → one-click fill", desc: "Jobs, events, hackathons — AutoSlay fills it all." },
                ].map(({ n, title, desc }) => (
                  <div key={n} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{
                      flexShrink: 0,
                      fontSize: "0.625rem", fontWeight: 700,
                      letterSpacing: "0.05em",
                      color: "rgba(255,255,255,0.2)",
                      marginTop: 2,
                      width: 20,
                    }}>{n}</div>
                    <div>
                      <p style={{ margin: "0 0 0.125rem", fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{title}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>


            </div>

            {/* ── RIGHT — Two action cards ── */}
            <div className="anim-fade-up3" style={{
              flex: "1 1 0",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}>

              {/* Card 1 — Fill Profile */}
              <div
                className="action-card"
                onClick={() => navigate("/form")}
                style={{
                  flex: 1,
                  display: "flex", flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: "1rem",
                  border: S.border,
                  background: S.card,
                  padding: "2rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Big ghost number */}
                <div style={{
                  position: "absolute", top: -8, right: 16,
                  fontSize: "5rem", fontWeight: 800,
                  letterSpacing: "-4px", lineHeight: 1,
                  color: "rgba(255,255,255,0.03)",
                  userSelect: "none", pointerEvents: "none",
                }}>01</div>

                <div>
                  <div style={{
                    width: 40, height: 40, borderRadius: "0.75rem",
                    border: S.border2,
                    background: "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.125rem", marginBottom: "1.125rem",
                  }}>📝</div>

                  <h3 style={{
                    margin: "0 0 0.4rem",
                    fontSize: "1rem", fontWeight: 700,
                    letterSpacing: "-0.025em", color: "white",
                  }}>Fill Your Details</h3>
                  <p style={{
                    margin: 0, fontSize: "0.8125rem",
                    color: S.muted, lineHeight: 1.7,
                    maxWidth: 260,
                  }}>
                    Name, email, resume, skills — save once, autofill on any form anywhere.
                  </p>
                </div>

                <div style={{
                  marginTop: "1.5rem",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span className="card-cta" style={{
                    fontSize: "0.75rem", fontWeight: 600,
                    color: "rgba(255,255,255,0.35)",
                    transition: "color .2s",
                  }}>Get started →</span>
                  <div style={{
                    background: "white", color: "black",
                    borderRadius: "0.625rem",
                    padding: "0.45rem 1rem",
                    fontSize: "0.75rem", fontWeight: 700,
                    border: "none", cursor: "pointer",
                    fontFamily: S.font,
                  }}>Fill Now</div>
                </div>
              </div>

              {/* Card 2 — Download Extension */}
              <div
                className="action-card"
                onClick={() => window.open("https://chrome.google.com/webstore", "_blank")}
                style={{
                  flex: 1,
                  display: "flex", flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: "1rem",
                  border: S.border,
                  background: S.card,
                  padding: "2rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Big ghost number */}
                <div style={{
                  position: "absolute", top: -8, right: 16,
                  fontSize: "5rem", fontWeight: 800,
                  letterSpacing: "-4px", lineHeight: 1,
                  color: "rgba(255,255,255,0.03)",
                  userSelect: "none", pointerEvents: "none",
                }}>02</div>

                <div>
                  <div style={{
                    width: 40, height: 40, borderRadius: "0.75rem",
                    border: S.border2,
                    background: "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.125rem", marginBottom: "1.125rem",
                  }}>🧩</div>

                  <h3 style={{
                    margin: "0 0 0.4rem",
                    fontSize: "1rem", fontWeight: 700,
                    letterSpacing: "-0.025em", color: "white",
                  }}>Enable Extension</h3>
                  <p style={{
                    margin: 0, fontSize: "0.8125rem",
                    color: S.muted, lineHeight: 1.7,
                    maxWidth: 260,
                  }}>
                    Download AutoSlay for Chrome and start autofilling job applications, events, hackathons, and more.
                  </p>
                </div>

                <div style={{
                  marginTop: "1.5rem",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span className="card-cta" style={{
                    fontSize: "0.75rem", fontWeight: 600,
                    color: "rgba(255,255,255,0.35)",
                    transition: "color .2s",
                  }}>Free to download →</span>
                  <div style={{
                    background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)",
                    borderRadius: "0.625rem",
                    padding: "0.45rem 1rem",
                    fontSize: "0.75rem", fontWeight: 700,
                    border: S.border2, cursor: "pointer",
                    fontFamily: S.font,
                  }}>Download</div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Platform chips ── */}
          <div className="anim-fade-up3" style={{
            marginTop: "2.5rem",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
          }}>
            <p style={{
              margin: 0,
              fontSize: "0.5625rem", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.15)",
            }}>Works on</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", justifyContent: "center" }}>
              {["Unstop","Devpost","Devfolio","DoraHacks","HackerEarth","HackerRank","MLH","Kaggle","AICrowd","Townscript","Google Forms"].map(p => (
                <span key={p} style={{
                  fontSize: "0.5625rem", fontWeight: 600,
                  padding: "0.2rem 0.55rem",
                  borderRadius: "0.375rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.18)",
                  letterSpacing: "0.04em",
                }}>{p}</span>
              ))}
            </div>
            <p style={{
              marginTop: "0.5rem",
              fontSize: "0.5625rem", fontWeight: 600,
              color: "rgba(255,255,255,0.12)",
              fontStyle: "italic",
            }}>& many more platforms</p>
          </div>

        </div>
      </main>
    </div>
  );
}
