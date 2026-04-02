import React from 'react';
import { useNavigate } from 'react-router-dom';

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
    .privacy-grid { flex-direction: column !important; }
    .privacy-grid > div { width: 100% !important; flex: none !important; }
  }
`;

const Privacy = () => {
  const navigate = useNavigate();

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
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Fillux</span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button
            onClick={() => navigate("/home")}
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
            Back to Home
          </button>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main style={{
        flex: 1,
        position: "relative", zIndex: 1,
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}>
        {/* Header */}
        <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", color: "white" }}>
            Privacy Policy
          </h1>
          <p style={{ color: S.muted, fontSize: "0.875rem" }}>
            Last updated: April 3, 2026
          </p>
        </div>

        {/* Side-by-side content grid */}
        <div className="privacy-grid anim-fade-up2" style={{
          display: "flex",
          gap: "2rem",
          flex: 1,
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}>
          
          {/* Left Column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{
              backgroundColor: S.surface,
              border: S.border,
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}>
              <h2 style={{ color: "white", fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
                1. Information We Collect
              </h2>
              <p style={{ color: S.muted, fontSize: "0.875rem", marginBottom: "1rem", lineHeight: 1.6 }}>
                Fillux is designed with privacy in mind. We only collect information that is necessary for the autofill functionality:
              </p>
              <ul style={{ color: S.muted, fontSize: "0.875rem", paddingLeft: "1.5rem", lineHeight: 1.6 }}>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>Profile Data:</strong> Name, email, phone number, address, and other information you voluntarily save</li>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>Local Storage Data:</strong> Your profile information is stored locally on your device using Chrome's storage API</li>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>Usage Data:</strong> Minimal technical data about how the extension functions (no personal information)</li>
              </ul>
            </div>

            <div style={{
              backgroundColor: S.surface,
              border: S.border,
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}>
              <h2 style={{ color: "white", fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
                2. How We Use Your Information
              </h2>
              <p style={{ color: S.muted, fontSize: "0.875rem", marginBottom: "1rem", lineHeight: 1.6 }}>
                We use your information solely for:
              </p>
              <ul style={{ color: S.muted, fontSize: "0.875rem", paddingLeft: "1.5rem", lineHeight: 1.6 }}>
                <li style={{ marginBottom: "0.5rem" }}>Automatically filling web forms with your saved profile data</li>
                <li style={{ marginBottom: "0.5rem" }}>Storing your profile locally for quick access</li>
                <li style={{ marginBottom: "0.5rem" }}>Improving the extension's functionality (using anonymous usage data only)</li>
              </ul>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{
              backgroundColor: "rgba(52, 211, 153, 0.08)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}>
              <h3 style={{ color: "rgb(52, 211, 153)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                🔒 Important
              </h3>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Fillux does NOT collect, store, or transmit any of your personal information to external servers. All data remains on your local device.
              </p>
            </div>

            <div style={{
              backgroundColor: S.surface,
              border: S.border,
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}>
              <h2 style={{ color: "white", fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
                3. Information We DON'T Collect
              </h2>
              <ul style={{ color: S.muted, fontSize: "0.875rem", paddingLeft: "1.5rem", lineHeight: 1.6 }}>
                <li style={{ marginBottom: "0.5rem" }}>Browsing history or websites you visit</li>
                <li style={{ marginBottom: "0.5rem" }}>Form data that you don't explicitly save to your profile</li>
                <li style={{ marginBottom: "0.5rem" }}>Personal identifiers beyond what you store in your profile</li>
                <li style={{ marginBottom: "0.5rem" }}>Location data, device information, or analytics</li>
                <li style={{ marginBottom: "0.5rem" }}>Any data transmitted to external servers</li>
              </ul>
            </div>

            <div style={{
              backgroundColor: S.surface,
              border: S.border,
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}>
              <h2 style={{ color: "white", fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
                4. Data Storage & Security
              </h2>
              <ul style={{ color: S.muted, fontSize: "0.875rem", paddingLeft: "1.5rem", lineHeight: 1.6 }}>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>Local Storage:</strong> All profile data is stored locally on your device</li>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>No Cloud Storage:</strong> We do not use cloud services or external servers</li>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>No Data Collection:</strong> We do not collect, track, or transmit your personal information</li>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>No Third-Party Sharing:</strong> We do not share your data with any third parties</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom sections */}
        <div className="anim-fade-up3" style={{
          display: "flex",
          gap: "2rem",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{
              backgroundColor: S.surface,
              border: S.border,
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}>
              <h2 style={{ color: "white", fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
                5. Your Rights & Choices
              </h2>
              <ul style={{ color: S.muted, fontSize: "0.875rem", paddingLeft: "1.5rem", lineHeight: 1.6 }}>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>Access:</strong> View and edit your profile data at any time</li>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>Deletion:</strong> Delete your profile data completely</li>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>Opt-out:</strong> Disable autofill or uninstall the extension</li>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>No Tracking:</strong> We don't track you, so there's nothing to opt-out from</li>
              </ul>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{
              backgroundColor: S.surface,
              border: S.border,
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}>
              <h2 style={{ color: "white", fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
                6. Contact Us
              </h2>
              <ul style={{ color: S.muted, fontSize: "0.875rem", paddingLeft: "1.5rem", lineHeight: 1.6 }}>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>Email:</strong> privacy@fillux.com</li>
                <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: "white" }}>Extension Support:</strong> Through the Chrome Web Store</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;