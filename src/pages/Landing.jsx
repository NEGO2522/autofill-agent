import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProfileIcon from "../components/ProfileIcon";
import { db } from "../firebase/firebase";
import { doc, getDoc, collection, getCountFromServer } from "firebase/firestore";

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS  — matches Home.jsx / Login.jsx exactly
   bg:#080808  surface:#0c0c0c  border:rgba(255,255,255,0.07)
   font: Inter  |  accent: white (monochrome)
───────────────────────────────────────────────────────────── */
const S = {
  bg:      "#080808",
  surface: "#0c0c0c",
  card:    "#0f0f0f",
  border:  "1px solid rgba(255,255,255,0.07)",
  border2: "1px solid rgba(255,255,255,0.09)",
  font:    "Inter, ui-sans-serif, system-ui, sans-serif",
  muted:   "rgba(255,255,255,0.25)",
  dimmed:  "rgba(255,255,255,0.08)",
};

/* ── inline keyframes (mirrors index.css) ── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes pulse-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.75)} }
  @keyframes fade-up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ticker     { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes glow-pulse { 0%,100%{opacity:.018} 50%{opacity:.032} }
  @keyframes shimmer    { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes border-flow { 0%{opacity:0;transform:translateX(-100%)} 60%{opacity:1} 100%{opacity:0;transform:translateX(100%)} }
  @keyframes float-up   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }

  .anim-spin     { animation: spin 0.8s linear infinite; }
  .anim-pulse    { animation: pulse-dot 1.4s ease-in-out infinite; }
  .anim-fade-up  { animation: fade-up 0.45s ease forwards; }
  .anim-ticker   { animation: ticker 28s linear infinite; }
  .anim-glow     { animation: glow-pulse 4s ease-in-out infinite; }

  .nav-link { color:rgba(255,255,255,.3); text-decoration:none; font-size:.8125rem; font-weight:500; transition:color .2s; }
  .nav-link:hover { color:rgba(255,255,255,.75); }

  .step-card { transition: border-color .2s, background-color .2s; }
  .step-card:hover { border-color:rgba(255,255,255,.14) !important; background-color:rgba(255,255,255,.03) !important; }

  .feat-card { transition: border-color .2s, background-color .2s; }
  .feat-card:hover { border-color:rgba(255,255,255,.14) !important; background-color:rgba(255,255,255,.03) !important; }

  /* ── NEW bento feature cards ── */
  .bento-card {
    position: relative;
    border-radius: 1.125rem;
    border: 1px solid rgba(255,255,255,0.07);
    background: #0c0c0c;
    overflow: hidden;
    transition: border-color .3s, transform .3s;
    cursor: default;
  }
  .bento-card::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.035) 0%, transparent 70%);
    opacity: 0;
    transition: opacity .4s;
    pointer-events: none;
  }
  .bento-card:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-3px); }
  .bento-card:hover::before { opacity: 1; }

  .bento-card-featured {
    position: relative;
    border-radius: 1.125rem;
    border: 1px solid rgba(255,255,255,0.1);
    background: linear-gradient(135deg, #111 0%, #0d0d0d 100%);
    overflow: hidden;
    transition: border-color .3s, transform .3s;
    cursor: default;
  }
  .bento-card-featured:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }

  .feat-icon-wrap {
    width: 44px; height: 44px;
    border-radius: 0.75rem;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.25rem;
    transition: background .3s, border-color .3s;
    flex-shrink: 0;
  }
  .bento-card:hover .feat-icon-wrap,
  .bento-card-featured:hover .feat-icon-wrap {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.18);
  }

  .feat-shimmer-tag {
    display: inline-block;
    background: linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%);
    background-size: 200% auto;
    animation: shimmer 3s linear infinite;
    border-radius: 9999px;
    padding: 3px 10px;
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    border: 1px solid rgba(255,255,255,0.1);
  }

  .feat-line-accent {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
    opacity: 0;
    transition: opacity .3s;
    pointer-events: none;
  }
  .bento-card:hover .feat-line-accent,
  .bento-card-featured:hover .feat-line-accent { opacity: 1; }

  .feat-float { animation: float-up 3.5s ease-in-out infinite; }

  .plan-card { transition: border-color .25s; }
  input::placeholder { color:rgba(255,255,255,.15); }

  @keyframes stat-shimmer {
    0%   { opacity: 0.3; }
    50%  { opacity: 0.7; }
    100% { opacity: 0.3; }
  }
  .stat-loading { animation: stat-shimmer 1.4s ease-in-out infinite; }
`;

/* ── live demo fields (matches Home.jsx STEPS theme) ── */
const DEMO_FIELDS = [
  { id:"name",    label:"Full Name",      val:"Rahul Sharma",        msg:"Filling name field…"     },
  { id:"email",   label:"Email Address",  val:"rahul@acme.io",       msg:"Mapping email field…"    },
  { id:"phone",   label:"Phone",          val:"+91 98765 43210",     msg:"Filling phone number…"   },
  { id:"company", label:"Company",        val:"Acme Technologies",   msg:"Detecting company…"      },
  { id:"url",     label:"Website",        val:"https://acme.io",     msg:"Entering website URL…"   },
];

const TICKER_ITEMS = [
  "CHECKOUT FORMS","CONTACT FORMS","JOB APPLICATIONS","VISA FORMS",
  "INSURANCE CLAIMS","BANKING KYC","GOVERNMENT PORTALS","ONBOARDING FLOWS",
  "TAX FILINGS","SURVEY FORMS","LEAD CAPTURE","SIGN-UP FLOWS",
];

const HOW = [
  {
    n:"01", icon:"👤", title:"Save your profile once",
    desc:"Enter your name, email, phone, company — whatever fields you fill repeatedly. Stored locally on your device.",
    detail:"Profile stays in your browser. Never sent to any server.",
    fields: ["Full Name", "Email", "Phone", "Company"],
  },
  {
    n:"02", icon:"🔍", title:"Agent scans the form",
    desc:"When you click \"Fill\", the extension reads every visible input — its label, placeholder, name attribute, and surrounding text — to understand what each field expects.",
    detail:"Works on inputs the page doesn't even label properly.",
    fields: ["Reads labels", "Reads placeholders", "Reads name attrs", "Reads context"],
  },
  {
    n:"03", icon:"⚡", title:"Fields filled, you submit",
    desc:"Each field gets the right value from your profile. Dropdowns are selected, checkboxes ticked, date pickers set. You review and hit Submit.",
    detail:"You stay in control — the agent fills, you confirm.",
    fields: ["Text inputs", "Dropdowns", "Date pickers", "Checkboxes"],
  },
];

const FEATURES = [
  {
    icon:"🎯", title:"Smart Field Matching",
    desc:"Matches your profile data to form fields by reading labels, placeholders, name attributes, and surrounding text — not just CSS selectors. Works even after a site redesigns its form.",
    tag:"Core", featured: true,
    detail: "Reads the DOM the same way you would: label first, then context.",
  },
  { icon:"🛡️", title:"Bot-Detection Aware",   desc:"Fills fields with human-like delays instead of instant injection. Avoids triggering rate-limits or input validation that fires only on real keystrokes.", tag:"Evasion"      },
  { icon:"🔄", title:"Multi-Step Forms",       desc:"Detects \"Next\" buttons and continues filling across paginated steps. Handles conditionally shown fields that appear after earlier inputs are filled.",      tag:"Adaptive"     },
  { icon:"💻", title:"Live Fill Log",          desc:"Each field fill is logged in the extension popup as it happens — field name, matched value, and status. You see exactly what the agent did.",             tag:"Transparent"  },
  { icon:"🔌", title:"Simple API Trigger",    desc:"Trigger a fill run via a single fetch call with your session token. Useful for automating repetitive form submissions in internal tools.",              tag:"Dev"          },
  { icon:"🔒", title:"Local-Only Storage",    desc:"Your profile is saved in browser localStorage. Nothing is synced to a backend. No account required to use the extension.",                             tag:"Private"      },
];

/* ── Helper: format numbers compactly ── */
function formatStat(value, type) {
  if (value === null || value === undefined) return "—";
  if (type === "percent") return `${parseFloat(value).toFixed(1)}%`;
  if (type === "seconds") {
    const s = parseFloat(value);
    return s < 1 ? `${(s * 1000).toFixed(0)}ms` : `${s.toFixed(1)}s`;
  }
  if (type === "count") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
    if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}k+`;
    return "100+";
  }
  return String(value);
}

/* ══════════════════════════════════════════════════════════════
   CUSTOM HOOK — fetch live stats from Firestore
   Expects a doc at:  stats/global
   with fields:  fillAccuracy (number), avgFillTime (number, seconds),
                 formsFilled (number), teamsCount (number)

   Falls back gracefully to counting collections if the doc
   doesn't exist yet.
══════════════════════════════════════════════════════════════ */
function useLiveStats() {
  const [stats, setStats] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1️⃣ Try the pre-aggregated stats document first (cheapest read)
        const snap = await getDoc(doc(db, "stats", "global"));

        if (!cancelled) {
          if (snap.exists()) {
            const d = snap.data();
            setStats({
              fillAccuracy: d.fillAccuracy   ?? null,
              avgFillTime:  d.avgFillTime    ?? null,
              formsFilled:  d.formsFilled    ?? null,
              teamsCount:   d.teamsCount     ?? null,
            });
          } else {
            // 2️⃣ Fallback: count collections directly (costs more reads)
            const [formsSnap, usersSnap] = await Promise.all([
              getCountFromServer(collection(db, "forms")).catch(() => null),
              getCountFromServer(collection(db, "users")).catch(() => null),
            ]);

            if (!cancelled) {
              setStats({
                fillAccuracy: null,                          // can't compute dynamically
                avgFillTime:  null,                          // can't compute dynamically
                formsFilled:  formsSnap ? formsSnap.data().count : null,
                teamsCount:   usersSnap ? usersSnap.data().count : null,
              });
            }
          }
        }
      } catch (err) {
        console.warn("[Landing] Stats fetch failed:", err);
        if (!cancelled) setStats({});  // show fallback labels, not spinner
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return stats;
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

/* ── NAV ── */
function Nav({ onCTA, user }) {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 2rem", height:56,
      background: scrolled ? "rgba(8,8,8,0.95)" : "rgba(8,8,8,0.6)",
      backdropFilter:"blur(20px)",
      borderBottom: scrolled ? S.border : "1px solid transparent",
      transition:"background .3s, border-color .3s",
    }}>
      {/* Brand */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
        <div style={{
          display:"flex", width:28, height:28, borderRadius:"0.5rem",
          background:"white", color:"black",
          alignItems:"center", justifyContent:"center",
          fontSize:"0.8125rem", fontWeight:900,
        }}>⚡</div>
        <span style={{ fontSize:"0.9375rem", fontWeight:700, letterSpacing:"-0.02em", color:"white" }}>AutoSlay</span>
      </div>

      {/* Links */}
      <div style={{ display:"flex", gap:"2rem" }}>
        {["Features","How it works"].map(l => {
          const targetId = l.toLowerCase().replace(/ /g,"-");
          return (
            <a 
              key={l} 
              href={`#${targetId}`} 
              className="nav-link"
              onClick={(e) => handleSmoothScroll(e, targetId)}
            >
              {l}
            </a>
          );
        })}
        <a 
          href="/contact" 
          className="nav-link"
          style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}
        >
          Contact
        </a>
      </div>

      {/* CTA */}
      <div style={{ display:"flex", gap:"2.5rem", alignItems:"center" }}>
        {user ? (
          <ProfileIcon />
        ) : (
          <>
            <button onClick={() => onCTA("login")} style={{
              background:"none", border:"none", cursor:"pointer",
              fontSize:"0.8125rem", fontWeight:600,
              color:"rgba(255,255,255,0.35)", transition:"color .2s",
              fontFamily:S.font,
            }}
              onMouseEnter={e => e.target.style.color="rgba(255,255,255,.7)"}
              onMouseLeave={e => e.target.style.color="rgba(255,255,255,.35)"}
            >Sign in</button>
            <button onClick={() => onCTA("signup")} style={{
              background:"white", color:"black", border:"none",
              borderRadius:"0.625rem", padding:"0.5rem 1.125rem",
              fontSize:"0.8125rem", fontWeight:700,
              cursor:"pointer", transition:"background .2s, transform .1s",
              fontFamily:S.font,
            }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.88)"}
              onMouseLeave={e => e.currentTarget.style.background="white"}
              onMouseDown={e => e.currentTarget.style.transform="scale(.98)"}
              onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
            >Get started free</button>
          </>
        )}
      </div>
    </nav>
  );
}

/* ── LIVE DEMO FORM ── */
function DemoForm() {
  const [vals, setVals]       = useState(Object.fromEntries(DEMO_FIELDS.map(f=>[f.id,""])));
  const [active, setActive]   = useState({});
  const [msg, setMsg]         = useState("AutoSlay is scanning this form");
  const [done, setDone]       = useState(false);
  const stepRef               = useRef(0);
  const timerRef              = useRef(null);

  useEffect(() => {
    let live = true;
    function run() {
      if (!live) return;
      const idx = stepRef.current;
      if (idx >= DEMO_FIELDS.length) {
        setMsg("✅ All fields filled successfully");
        setDone(true);
        timerRef.current = setTimeout(() => {
          if (!live) return;
          setVals(Object.fromEntries(DEMO_FIELDS.map(f=>[f.id,""])));
          setActive({});
          setDone(false);
          setMsg("AutoSlay is scanning this form");
          stepRef.current = 0;
          timerRef.current = setTimeout(run, 1200);
        }, 2600);
        return;
      }
      const { id, val, msg: m } = DEMO_FIELDS[idx];
      setMsg(m);
      let i = 0;
      function type() {
        if (!live) return;
        i++;
        setVals(p => ({ ...p, [id]: val.slice(0,i) }));
        if (i < val.length) timerRef.current = setTimeout(type, 40);
        else {
          setActive(p => ({ ...p, [id]: true }));
          stepRef.current++;
          timerRef.current = setTimeout(run, 360);
        }
      }
      timerRef.current = setTimeout(type, 60);
    }
    timerRef.current = setTimeout(run, 1000);
    return () => { live=false; clearTimeout(timerRef.current); };
  }, []);

  const inputStyle = id => ({
    width:"100%",
    borderRadius:"0.6875rem",
    border: active[id]
      ? "1px solid rgba(255,255,255,0.22)"
      : "1px solid rgba(255,255,255,0.09)",
    background: active[id] ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
    padding:"0.625rem 0.875rem",
    fontSize:"0.8125rem", color:"white",
    outline:"none", boxSizing:"border-box",
    fontFamily:S.font,
    transition:"border-color .2s, background .2s",
  });

  return (
    <div style={{
      borderRadius:"1rem", border:S.border,
      background:S.surface, overflow:"hidden",
      maxWidth:540, width:"100%",
    }}>
      {/* Browser chrome */}
      <div style={{
        display:"flex", alignItems:"center", gap:6,
        padding:"10px 16px", borderBottom:S.border,
        background:"rgba(255,255,255,0.03)",
      }}>
        {["#ff5f57","#ffbd2e","#28ca41"].map((c,i)=>(
          <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c }} />
        ))}
        <div style={{
          flex:1, marginLeft:8, borderRadius:"0.5rem",
          border:"1px solid rgba(255,255,255,0.07)",
          background:"rgba(255,255,255,0.04)",
          padding:"4px 10px", fontSize:11, color:"rgba(255,255,255,0.25)",
        }}>checkout.acme.com/shipping</div>
        <span style={{
          fontSize:9, letterSpacing:"0.12em", color:"rgba(255,255,255,0.3)",
          border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:"0.375rem", padding:"2px 8px",
        }}>LIVE</span>
      </div>

      {/* Form */}
      <div style={{ padding:"1.5rem" }}>
        <p style={{ fontSize:"0.875rem", fontWeight:700, color:"rgba(255,255,255,0.8)", marginBottom:"0.25rem" }}>Shipping Details</p>
        <p style={{ fontSize:"0.75rem", color:S.muted, marginBottom:"1.25rem" }}>Fill in your information to continue</p>

        <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
            {["name","email"].map(id => {
              const f = DEMO_FIELDS.find(x=>x.id===id);
              return (
                <div key={id}>
                  <label style={{ display:"block", fontSize:"0.625rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.25)", marginBottom:"0.375rem" }}>{f.label}</label>
                  <input readOnly value={vals[id]} style={inputStyle(id)} placeholder="—" />
                </div>
              );
            })}
          </div>
          {["phone","company","url"].map(id => {
            const f = DEMO_FIELDS.find(x=>x.id===id);
            return (
              <div key={id}>
                <label style={{ display:"block", fontSize:"0.625rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.25)", marginBottom:"0.375rem" }}>{f.label}</label>
                <input readOnly value={vals[id]} style={inputStyle(id)} placeholder="—" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent status bar */}
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"0.75rem 1.25rem",
        borderTop:"1px solid rgba(255,255,255,0.07)",
        background:"rgba(255,255,255,0.03)",
        fontSize:"0.75rem",
      }}>
        <div style={{
          width:28, height:28, borderRadius:"0.5rem",
          background:"rgba(255,255,255,0.07)",
          border:"1px solid rgba(255,255,255,0.1)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"0.875rem", flexShrink:0,
        }}>⚡</div>
        <span style={{ color:"rgba(255,255,255,0.45)", flex:1 }}>{msg}</span>
        {!done && (
          <span style={{ display:"flex", gap:2 }}>
            {[0,1,2].map(i => (
              <span key={i} className="anim-pulse" style={{ width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,0.3)", display:"inline-block", animationDelay:`${i*0.2}s` }} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── TICKER ── */
function Ticker() {
  const items = [...TICKER_ITEMS,...TICKER_ITEMS];
  return (
    <div style={{ overflow:"hidden", whiteSpace:"nowrap", borderTop:S.border, borderBottom:S.border, background:S.bg, padding:"10px 0" }}>
      <span className="anim-ticker" style={{ display:"inline-block", fontSize:"0.6875rem", fontWeight:600, letterSpacing:"0.15em", color:"rgba(255,255,255,0.2)" }}>
        {items.map((t,i)=>(
          <span key={i}>{t}<span style={{ margin:"0 20px", opacity:.4 }}>✦</span></span>
        ))}
      </span>
    </div>
  );
}

/* ── SECTION WRAPPER ── */
function Section({ id, children }) {
  return (
    <section id={id} style={{ maxWidth:1080, margin:"0 auto", padding:"6rem 2rem" }}>
      {children}
    </section>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize:"0.625rem", fontWeight:600, textTransform:"uppercase",
      letterSpacing:"0.18em", color:"rgba(255,255,255,0.25)", marginBottom:"1rem",
    }}>{children}</p>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily:S.font, fontSize:"clamp(1.875rem,4vw,2.75rem)",
      fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.05,
      color:"white", margin:0, marginBottom:"3.5rem",
    }}>{children}</h2>
  );
}

/* ── STATS (live data) ── */
function Stats() {
  const liveStats = useLiveStats();
  const loading = liveStats === null;

  // Build display array from live data
  const STATS = [
    {
      n: loading ? null : formatStat(liveStats?.fillAccuracy, "percent"),
      l: "Fill Accuracy",
      fallback: "99%+",
    },
    {
      n: loading ? null : formatStat(liveStats?.avgFillTime, "seconds"),
      l: "Avg. Fill Time",
      fallback: "<1s",
    },
    {
      n: loading ? null : formatStat(liveStats?.formsFilled, "count"),
      l: "Forms Filled",
      fallback: "—",
    },
    {
      n: loading ? null : formatStat(liveStats?.teamsCount, "count"),
      l: "Teams Using AutoSlay",
      fallback: "—",
    },
  ];

  return (
    <div style={{ borderTop:S.border, borderBottom:S.border, background:S.bg }}>
      <div style={{
        maxWidth:1080, margin:"0 auto", padding:"0 2rem",
        display:"grid", gridTemplateColumns:"repeat(4,1fr)",
      }}>
        {STATS.map((s, i) => {
          const display = loading ? "—" : (s.n === "—" ? s.fallback : s.n);
          return (
            <div key={i} style={{
              padding:"2.5rem 0",
              borderRight: i < 3 ? S.border : "none",
              textAlign:"center",
            }}>
              <div
                className={loading ? "stat-loading" : ""}
                style={{
                  fontSize:"clamp(1.875rem,3.5vw,2.5rem)",
                  fontWeight:800, letterSpacing:"-0.05em", color:"white",
                  minHeight:"2.5rem",
                }}
              >
                {display}
              </div>
              <div style={{ marginTop:"0.375rem", fontSize:"0.75rem", fontWeight:500, color:S.muted, letterSpacing:"0.05em" }}>{s.l}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const liveStats = useLiveStats();
  const handleCTA = (mode="signup") => navigate(`/login?mode=${mode}`);

  // Social proof numbers (live)
  const teamsLabel  = liveStats?.teamsCount  ? formatStat(liveStats.teamsCount,  "count") + " teams"       : "teams";
  const formsLabel  = liveStats?.formsFilled  ? formatStat(liveStats.formsFilled,  "count") + " forms filled" : "forms filled";

  return (
    <div style={{ minHeight:"100vh", background:S.bg, color:"white", fontFamily:S.font, overflowX:"hidden" }}>
      <style>{CSS}</style>

      <Nav onCTA={handleCTA} user={user} />

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", padding:"120px 2rem 80px", position:"relative", overflow:"hidden" }}>
        {/* grid bg */}
        <div style={{
          pointerEvents:"none", position:"absolute", inset:0,
          opacity:0.03,
          backgroundImage:"linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
          backgroundSize:"44px 44px",
        }} />
        {/* ambient glow */}
        <div className="anim-glow" style={{
          pointerEvents:"none", position:"absolute",
          width:800, height:800,
          borderRadius:"50%", background:"white",
          top:"50%", left:"50%", transform:"translate(-50%,-60%)",
          filter:"blur(140px)", opacity:.018,
        }} />

        <div style={{
          position:"relative", zIndex:1,
          maxWidth:1080, width:"100%", margin:"0 auto",
          display:"flex", alignItems:"center",
          gap:"4rem", flexWrap:"wrap",
        }}>

          {/* LEFT — copy */}
          <div style={{ flex:"1 1 400px", minWidth:280 }}>
            {/* Badge */}
            <div className="anim-fade-up" style={{
              display:"inline-flex", alignItems:"center", gap:8,
              borderRadius:"9999px",
              border:"1px solid rgba(255,255,255,0.1)",
              background:"rgba(255,255,255,0.05)",
              padding:"0.375rem 1rem",
              fontSize:"0.625rem", fontWeight:600, textTransform:"uppercase",
              letterSpacing:"0.15em", color:"rgba(255,255,255,0.35)",
              marginBottom:"2rem",
            }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.4)", display:"inline-block" }} className="anim-pulse" />
              AI-Powered Form Automation
            </div>

            {/* H1 */}
            <h1 style={{
              fontSize:"clamp(2.5rem,5vw,5rem)", fontWeight:800,
              letterSpacing:"-0.05em", lineHeight:1.0,
              color:"white", marginBottom:"1.5rem",
            }}>
              Stop filling<br />
              forms <span style={{ color:"rgba(255,255,255,0.2)" }}>manually.</span>
            </h1>

            <p style={{
              fontSize:"clamp(0.9375rem,1.5vw,1.125rem)", lineHeight:1.75,
              color:"rgba(255,255,255,0.35)", maxWidth:480, marginBottom:"2.5rem",
            }}>
              AutoSlay reads any web form and completes it instantly using your saved profile.
              One click. Every form.
            </p>

            {/* CTAs */}
            <div style={{ display:"flex", gap:"0.875rem", flexWrap:"wrap", marginBottom:"3rem" }}>
              {user ? (
                <button onClick={() => navigate('/home')} style={{
                  background:"white", color:"black", border:"none",
                  borderRadius:"0.75rem", padding:"0.875rem 2rem",
                  fontSize:"0.9375rem", fontWeight:700,
                  cursor:"pointer", transition:"all .2s",
                  fontFamily:S.font,
                }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.88)"}
                  onMouseLeave={e=>e.currentTarget.style.background="white"}
                  onMouseDown={e=>e.currentTarget.style.transform="scale(.98)"}
                  onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
                >
                  ⚡ Go to Dashboard
                </button>
              ) : (
                <>
                  <button onClick={()=>handleCTA("signup")} style={{
                    background:"white", color:"black", border:"none",
                    borderRadius:"0.75rem", padding:"0.875rem 2rem",
                    fontSize:"0.9375rem", fontWeight:700,
                    cursor:"pointer", transition:"all .2s",
                    fontFamily:S.font,
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.88)"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}
                    onMouseDown={e=>e.currentTarget.style.transform="scale(.98)"}
                    onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
                  >
                    ⚡ Launch Agent free
                  </button>
                  <button onClick={()=>handleCTA("login")} style={{
                    background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.6)",
                    border:S.border2, borderRadius:"0.75rem", padding:"0.875rem 2rem",
                    fontSize:"0.9375rem", fontWeight:600,
                    cursor:"pointer", transition:"all .2s",
                    fontFamily:S.font,
                  }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,.2)"; e.currentTarget.style.color="white"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,.09)"; e.currentTarget.style.color="rgba(255,255,255,.6)"; }}
                  >
                    Sign in →
                  </button>
                </>
              )}
            </div>

            {/* Social proof — live numbers */}
            <div style={{
              display:"flex", alignItems:"center", gap:"1rem",
              fontSize:"0.75rem", color:"rgba(255,255,255,0.2)",
            }}>
              <span>{teamsLabel}</span>
              <span style={{ opacity:.3 }}>·</span>
              <span>{formsLabel}</span>
              <span style={{ opacity:.3 }}>·</span>
              <span>MIT licensed</span>
            </div>
          </div>

          {/* RIGHT — live demo */}
          <div style={{ flex:"1 1 460px", minWidth:280, display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
            <p style={{ fontSize:"0.625rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.18em", color:"rgba(255,255,255,0.2)", marginBottom:"1.25rem" }}>
              // Watch it work
            </p>
            <DemoForm />
          </div>

        </div>
      </section>

      <Ticker />

      {/* ── STATS (live) ── */}
      <Stats />

      {/* ── HOW IT WORKS ── */}
      <Section id="how-it-works">
        <SectionLabel>// How it works</SectionLabel>
        <SectionTitle>Three steps.<br />Zero friction.</SectionTitle>

        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {HOW.map((h, i) => (
            <div key={h.n} style={{ display:"flex", gap:"0", alignItems:"stretch" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:56, flexShrink:0 }}>
                <div style={{
                  width:36, height:36, borderRadius:"50%",
                  border:"1px solid rgba(255,255,255,0.12)",
                  background:"rgba(255,255,255,0.06)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"0.625rem", fontWeight:800, letterSpacing:"0.05em",
                  color:"rgba(255,255,255,0.5)",
                  flexShrink:0, zIndex:1,
                }}>{h.n}</div>
                {i < HOW.length - 1 && (
                  <div style={{
                    width:1, flex:1, marginTop:4,
                    background:"linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
                  }} />
                )}
              </div>

              <div className="step-card" style={{
                flex:1, marginLeft:"1.5rem", marginBottom: i < HOW.length-1 ? "0.5rem" : 0,
                background:S.card, border:S.border,
                borderRadius:"1rem", padding:"1.75rem 2rem",
                display:"flex", gap:"2.5rem", alignItems:"flex-start",
                flexWrap:"wrap",
              }}>
                <div style={{ flex:"1 1 300px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.875rem" }}>
                    <span style={{ fontSize:"1.375rem" }}>{h.icon}</span>
                    <h3 style={{ fontSize:"1rem", fontWeight:700, color:"white", margin:0, letterSpacing:"-0.025em" }}>{h.title}</h3>
                  </div>
                  <p style={{ fontSize:"0.8375rem", color:"rgba(255,255,255,0.32)", lineHeight:1.8, margin:"0 0 1rem", maxWidth:480 }}>{h.desc}</p>
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap:"0.5rem",
                    fontSize:"0.6875rem", color:"rgba(255,255,255,0.22)",
                    fontFamily:"'DM Mono', monospace",
                  }}>
                    <span style={{ color:"rgba(255,255,255,0.15)" }}>→</span>
                    {h.detail}
                  </div>
                </div>

                <div style={{ flex:"0 0 auto", display:"flex", flexWrap:"wrap", gap:"0.5rem", alignContent:"flex-start", maxWidth:220, paddingTop:"0.25rem" }}>
                  {h.fields.map(tag => (
                    <span key={tag} style={{
                      fontSize:"0.625rem", fontWeight:600,
                      letterSpacing:"0.08em", textTransform:"uppercase",
                      color:"rgba(255,255,255,0.3)",
                      border:"1px solid rgba(255,255,255,0.08)",
                      background:"rgba(255,255,255,0.03)",
                      borderRadius:"0.375rem",
                      padding:"4px 10px",
                      whiteSpace:"nowrap",
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <div style={{ borderTop:S.border, borderBottom:S.border, background:S.bg }}>
        <Section id="features">
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem", marginBottom:"3.5rem" }}>
            <div>
              <SectionLabel>// Features</SectionLabel>
              <h2 style={{
                fontFamily:S.font, fontSize:"clamp(1.875rem,4vw,2.75rem)",
                fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.05,
                color:"white", margin:0,
              }}>Built for the<br />real web.</h2>
            </div>
            <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.25)", maxWidth:320, lineHeight:1.7, margin:0 }}>
              Every feature ships because we hit the wall ourselves and built the fix.
            </p>
          </div>

          {/* ── BENTO GRID ── */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(12, 1fr)",
            gridTemplateRows:"auto",
            gap:"0.75rem",
          }}>
            {/* Featured large card */}
            <div className="bento-card-featured" style={{ gridColumn:"1 / 9", gridRow:"1", padding:"2.5rem" }}>
              <div className="feat-line-accent" />
              <div style={{
                pointerEvents:"none", position:"absolute", inset:0, opacity:0.025,
                backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
                backgroundSize:"32px 32px",
              }} />
              <div style={{
                pointerEvents:"none", position:"absolute",
                width:260, height:260, borderRadius:"50%",
                background:"white", opacity:0.028, filter:"blur(60px)",
                top:"-40px", right:"60px",
              }} />
              <div style={{ position:"relative", zIndex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.75rem" }}>
                  <div className="feat-icon-wrap feat-float" style={{ width:52, height:52, fontSize:"1.5rem" }}>
                    {FEATURES[0].icon}
                  </div>
                  <span className="feat-shimmer-tag">{FEATURES[0].tag}</span>
                </div>
                <h3 style={{
                  fontSize:"clamp(1.375rem,2.5vw,1.875rem)", fontWeight:800,
                  letterSpacing:"-0.04em", color:"white",
                  margin:"0 0 0.75rem", lineHeight:1.1,
                }}>{FEATURES[0].title}</h3>
                <p style={{ fontSize:"0.9375rem", color:"rgba(255,255,255,0.38)", lineHeight:1.8, maxWidth:480, margin:"0 0 1.5rem" }}>
                  {FEATURES[0].desc}
                </p>
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:"0.625rem",
                  borderRadius:"0.75rem",
                  border:"1px solid rgba(255,255,255,0.08)",
                  background:"rgba(255,255,255,0.04)",
                  padding:"0.625rem 1rem",
                  fontSize:"0.75rem", color:"rgba(255,255,255,0.3)",
                  fontFamily: "'DM Mono', monospace",
                }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.3)", display:"inline-block", flexShrink:0 }} className="anim-pulse" />
                  {FEATURES[0].detail}
                </div>
              </div>
            </div>

            {/* Privacy card */}
            <div className="bento-card" style={{ gridColumn:"9 / 13", gridRow:"1", padding:"2rem" }}>
              <div className="feat-line-accent" />
              <div style={{
                pointerEvents:"none", position:"absolute",
                bottom:0, left:0, right:0, height:"60%",
                background:"linear-gradient(to top, rgba(255,255,255,0.025), transparent)",
              }} />
              <div style={{ position:"relative", zIndex:1, height:"100%", display:"flex", flexDirection:"column" }}>
                <div className="feat-icon-wrap" style={{ marginBottom:"auto" }}>
                  {FEATURES[5].icon}
                </div>
                <div style={{ marginTop:"4rem" }}>
                  <span className="feat-shimmer-tag" style={{ marginBottom:"0.875rem", display:"inline-block" }}>{FEATURES[5].tag}</span>
                  <h3 style={{ fontSize:"1.125rem", fontWeight:800, color:"white", margin:"0 0 0.5rem", letterSpacing:"-0.03em" }}>{FEATURES[5].title}</h3>
                  <p style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.3)", lineHeight:1.75, margin:0 }}>{FEATURES[5].desc}</p>
                </div>
              </div>
            </div>

            {/* Bottom row: 4 equal cards */}
            {FEATURES.slice(1,5).map((f, i) => (
              <div key={f.title} className="bento-card" style={{
                gridColumn: `${1 + i*3} / ${4 + i*3}`,
                gridRow:"2",
                padding:"1.625rem",
              }}>
                <div className="feat-line-accent" />
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.25rem" }}>
                  <div className="feat-icon-wrap">{f.icon}</div>
                  <span className="feat-shimmer-tag">{f.tag}</span>
                </div>
                <h3 style={{
                  fontSize:"0.9375rem", fontWeight:700, color:"white",
                  margin:"0 0 0.5rem", letterSpacing:"-0.025em",
                }}>{f.title}</h3>
                <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.28)", lineHeight:1.75, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── CTA BANNER ── */}
      <div style={{ borderTop:S.border, background:S.bg }}>
        <section style={{ maxWidth:1080, margin:"0 auto", padding:"5rem 2rem" }}>
          <div style={{
            borderRadius:"1.25rem",
            border:"1px solid rgba(255,255,255,0.09)",
            background:S.card,
            padding:"3.5rem 3rem",
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            gap:"2.5rem",
            flexWrap:"wrap",
            position:"relative",
            overflow:"hidden",
          }}>
            <div style={{
              pointerEvents:"none",
              position:"absolute", top:"-60px", right:"-60px",
              width:300, height:300, borderRadius:"50%",
              background:"white", opacity:0.022, filter:"blur(80px)",
            }} />

            <div style={{ flex:"1 1 320px", position:"relative", zIndex:1 }}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:7,
                borderRadius:"9999px",
                border:"1px solid rgba(255,255,255,0.1)",
                background:"rgba(255,255,255,0.05)",
                padding:"0.3rem 0.875rem",
                fontSize:"0.5625rem", fontWeight:600,
                textTransform:"uppercase", letterSpacing:"0.15em",
                color:"rgba(255,255,255,0.3)",
                marginBottom:"1.25rem",
              }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"rgba(255,255,255,0.4)", display:"inline-block" }} />
                {user ? "You're all set" : "Get started free"}
              </div>
              <h2 style={{
                fontSize:"clamp(1.625rem,3vw,2.5rem)",
                fontWeight:800, letterSpacing:"-0.045em",
                lineHeight:1.08, color:"white", margin:"0 0 0.875rem",
              }}>
                {user
                  ? <>Ready to automate<br /><span style={{ color:"rgba(255,255,255,0.22)" }}>more forms?</span></>
                  : <>Stop filling forms<br /><span style={{ color:"rgba(255,255,255,0.22)" }}>manually.</span></>}
              </h2>
              <p style={{ fontSize:"0.9rem", color:"rgba(255,255,255,0.35)", lineHeight:1.75, margin:0, maxWidth:400 }}>
                {user
                  ? "Head to your dashboard, keep your profile updated, and let AutoSlay handle every form you encounter."
                  : "Save your details once. AutoSlay fills job applications, events, hackathons, and registrations instantly."}
              </p>
            </div>

            <div style={{
              flex:"0 0 auto",
              display:"flex", flexDirection:"column",
              alignItems:"flex-start", gap:"0.875rem",
              position:"relative", zIndex:1,
            }}>
              <button
                onClick={() => user ? navigate('/home') : handleCTA("signup")}
                style={{
                  background:"white", color:"black", border:"none",
                  borderRadius:"0.75rem", padding:"0.9rem 2rem",
                  fontSize:"0.9375rem", fontWeight:700,
                  cursor:"pointer", transition:"all .2s",
                  fontFamily:S.font, whiteSpace:"nowrap",
                  letterSpacing:"-0.01em",
                }}
                onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,.88)"; e.currentTarget.style.transform="scale(1.02)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="white"; e.currentTarget.style.transform="scale(1)"; }}
                onMouseDown={e=>e.currentTarget.style.transform="scale(.98)"}
                onMouseUp={e=>e.currentTarget.style.transform="scale(1.02)"}
              >
                {user ? "⚡ Go to Dashboard" : "⚡ Launch AutoSlay — free"}
              </button>
              {!user && (
                <button
                  onClick={() => handleCTA("login")}
                  style={{
                    background:"transparent", color:"rgba(255,255,255,0.3)",
                    border:"none", padding:"0 0.25rem",
                    fontSize:"0.8125rem", fontWeight:500,
                    cursor:"pointer", transition:"color .2s",
                    fontFamily:S.font,
                  }}
                  onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.65)"}
                  onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.3)"}
                >
                  Already have an account? Sign in →
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        background: S.bg,
        borderTop: S.border,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"1.25rem 2rem", flexWrap:"wrap", gap:"1rem",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
          <div style={{
            width:24, height:24, borderRadius:"0.4375rem",
            background:"white", color:"black",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"0.75rem", fontWeight:900,
          }}>⚡</div>
          <span style={{ fontSize:"0.875rem", fontWeight:700, color:"white", letterSpacing:"-0.02em" }}>AutoSlay</span>
        </div>

        <div style={{ display:"flex", gap:"1.5rem" }}>
          {["Privacy","Terms","GitHub"].map(l=>(
            <a key={l} href="#" className="nav-link">{l}</a>
          ))}
        </div>

        <div style={{ fontSize:"0.6875rem", color:"rgba(255,255,255,0.15)" }}>
          © {new Date().getFullYear()} AutoSlay · MIT License
        </div>
      </footer>
    </div>
  );
}
