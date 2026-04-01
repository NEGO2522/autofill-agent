import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProfileIcon from "../components/ProfileIcon";

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
  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes pulse-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.75)} }
  @keyframes fade-up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ticker     { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes glow-pulse { 0%,100%{opacity:.018} 50%{opacity:.032} }

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

  .plan-card { transition: border-color .25s; }
  input::placeholder { color:rgba(255,255,255,.15); }
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
  { n:"01", icon:"🔗", title:"Connect your profile",    desc:"Enter your name, email, phone once. The agent remembers and maps data intelligently to any form." },
  { n:"02", icon:"🧠", title:"Agent reads the form",     desc:"Our AI scans the live DOM, understands each field's intent even without labels, and plans a fill strategy." },
  { n:"03", icon:"⚡", title:"Form filled instantly",    desc:"Fields are filled, validated and submitted — including dropdowns, date pickers, and multi-step flows." },
];

const FEATURES = [
  { icon:"🎯", title:"Semantic Field Mapping",          desc:"Understands field intent from context, not just CSS selectors. Works after redesigns.",    tag:"AI Core"        },
  { icon:"🛡️", title:"CAPTCHA Handling",               desc:"Human-like timing and interaction patterns to navigate bot-detection gracefully.",           tag:"Smart Evasion"  },
  { icon:"🔄", title:"Multi-Step Forms",                desc:"Handles paginated wizards, conditional inputs, and AJAX-driven fields end-to-end.",          tag:"Adaptive"       },
  { icon:"📊", title:"Live Agent Console",              desc:"Watch every step in real time — field detection, fills, validation, submission.",             tag:"Observability"  },
  { icon:"🔌", title:"REST API + Webhooks",             desc:"Trigger runs programmatically. Receive callbacks on completion or anomaly.",                  tag:"Dev First"      },
  { icon:"🔒", title:"Privacy First",                   desc:"Your profile data never leaves your device. Zero telemetry. MIT-licensed.",                  tag:"Secure"         },
];

const PLANS = [
  { name:"Free",       price:"$0",   period:"/mo", desc:"Perfect to get started",  featured:false,
    items:["500 form fills / month","Basic field mapping","Community support"]               },
  { name:"Pro",        price:"$29",  period:"/mo", desc:"For teams moving fast",   featured:true,
    items:["10,000 fills / month","API access + Webhooks","CAPTCHA handling","Multi-step forms","Priority support"] },
  { name:"Enterprise", price:"Custom",period:"",   desc:"Built for scale",         featured:false,
    items:["Unlimited fills","Dedicated infra","SOC 2 compliance","SLA guarantee","Onboarding engineer"]       },
];

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
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 2rem", height:56,
      background: scrolled ? "rgba(8,8,8,0.92)" : "rgba(8,8,8,0.5)",
      backdropFilter:"blur(16px)",
      borderBottom: scrolled ? S.border : "1px solid transparent",
      transition:"all .3s",
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
        {["Features","How it works","Pricing"].map(l => {
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

      {/* CTA - Show different content based on auth state */}
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
          {/* Row 1 – name + email */}
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
          {/* Remaining fields */}
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

      {/* Agent status bar — mirrors Home.jsx console style */}
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
    <div style={{ overflow:"hidden", whiteSpace:"nowrap", borderTop:S.border, borderBottom:S.border, background:"rgba(255,255,255,0.02)", padding:"10px 0" }}>
      <span className="anim-ticker" style={{ display:"inline-block", fontSize:"0.6875rem", fontWeight:600, letterSpacing:"0.15em", color:"rgba(255,255,255,0.2)" }}>
        {items.map((t,i)=>(
          <span key={i}>{t}<span style={{ margin:"0 20px", opacity:.4 }}>✦</span></span>
        ))}
      </span>
    </div>
  );
}

/* ── SECTION WRAPPER ── */
function Section({ id, children, center=false }) {
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

/* ── STATS ── */
const STATS = [
  { n:"99.1%", l:"Fill Accuracy"        },
  { n:"0.8s",  l:"Avg. Fill Time"       },
  { n:"4M+",   l:"Forms Filled"         },
  { n:"3k+",   l:"Teams Using AutoFill" },
];

function Stats() {
  return (
    <div style={{
      borderTop:S.border, borderBottom:S.border,
      background:"rgba(255,255,255,0.02)",
    }}>
      <div style={{
        maxWidth:1080, margin:"0 auto", padding:"0 2rem",
        display:"grid", gridTemplateColumns:"repeat(4,1fr)",
      }}>
        {STATS.map((s,i)=>(
          <div key={i} style={{
            padding:"2.5rem 0",
            borderRight: i<3 ? S.border : "none",
            textAlign:"center",
          }}>
            <div style={{ fontSize:"clamp(1.875rem,3.5vw,2.5rem)", fontWeight:800, letterSpacing:"-0.05em", color:"white" }}>{s.n}</div>
            <div style={{ marginTop:"0.375rem", fontSize:"0.75rem", fontWeight:500, color:S.muted, letterSpacing:"0.05em" }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── PRICING ── */
function PlanCard({ plan, onCTA }) {
  return (
    <div className="plan-card" style={{
      borderRadius:"1rem",
      border: plan.featured ? "1px solid rgba(255,255,255,0.22)" : S.border,
      background: plan.featured ? "rgba(255,255,255,0.05)" : S.card,
      padding:"2rem 1.75rem",
      position:"relative",
      boxShadow: plan.featured ? "0 0 40px rgba(255,255,255,0.04)" : "none",
    }}>
      {plan.featured && (
        <div style={{
          position:"absolute", top:-1, left:"50%", transform:"translateX(-50%)",
          background:"white", color:"black",
          fontSize:"0.5625rem", fontWeight:700, letterSpacing:"0.15em",
          padding:"4px 14px", borderRadius:"0 0 0.5rem 0.5rem",
          whiteSpace:"nowrap",
        }}>MOST POPULAR</div>
      )}
      <div style={{ fontSize:"0.625rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.15em", color:S.muted, marginBottom:"1rem" }}>{plan.name}</div>
      <div style={{ fontSize:"clamp(2rem,4vw,2.75rem)", fontWeight:800, letterSpacing:"-0.05em", lineHeight:1, color:"white" }}>
        {plan.price}<span style={{ fontSize:"1rem", fontWeight:400, color:S.muted, letterSpacing:0 }}>{plan.period}</span>
      </div>
      <div style={{ fontSize:"0.75rem", color:S.muted, marginTop:"0.375rem", marginBottom:"1.75rem" }}>{plan.desc}</div>
      <ul style={{ listStyle:"none", padding:0, margin:0, marginBottom:"1.75rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {plan.items.map(f=>(
          <li key={f} style={{ display:"flex", gap:"0.625rem", fontSize:"0.8125rem", color:"rgba(255,255,255,0.55)", alignItems:"flex-start" }}>
            <span style={{ color:"rgba(255,255,255,0.3)", marginTop:1, flexShrink:0 }}>✓</span>{f}
          </li>
        ))}
      </ul>
      <button onClick={()=>onCTA("signup")} style={{
        width:"100%", padding:"0.75rem",
        borderRadius:"0.75rem",
        border: plan.featured ? "none" : S.border2,
        background: plan.featured ? "white" : "rgba(255,255,255,0.05)",
        color: plan.featured ? "black" : "rgba(255,255,255,0.55)",
        fontSize:"0.875rem", fontWeight:700,
        cursor:"pointer", transition:"all .2s",
        fontFamily:S.font,
      }}
        onMouseEnter={e=>{ e.currentTarget.style.opacity=".85"; }}
        onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}
        onMouseDown={e=>{ e.currentTarget.style.transform="scale(.98)"; }}
        onMouseUp={e=>{ e.currentTarget.style.transform="scale(1)"; }}
      >
        {plan.price==="Custom" ? "Contact sales" : "Get started"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleCTA = (mode="signup") => navigate(`/login?mode=${mode}`);

  return (
    <div style={{ minHeight:"100vh", background:S.bg, color:"white", fontFamily:S.font, overflowX:"hidden" }}>
      <style>{CSS}</style>

      <Nav onCTA={handleCTA} user={user} />

      {/* ── HERO (side-by-side on laptop) ── */}
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

        {/* ── Two-column wrapper ── */}
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
                <button onClick={() => navigate('/form')} style={{
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

            {/* Social proof */}
            <div style={{
              display:"flex", alignItems:"center", gap:"1rem",
              fontSize:"0.75rem", color:"rgba(255,255,255,0.2)",
            }}>
              <span>3,000+ teams</span>
              <span style={{ opacity:.3 }}>·</span>
              <span>4M+ forms filled</span>
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

      <Stats />

      {/* ── HOW IT WORKS ── */}
      <Section id="how-it-works">
        <SectionLabel>// How it works</SectionLabel>
        <SectionTitle>Three steps.<br />Zero friction.</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:"0.125rem" }}>
          {HOW.map(h=>(
            <div key={h.n} className="step-card" style={{
              background:S.card, border:S.border,
              borderRadius:"0.875rem", padding:"2rem 1.75rem",
            }}>
              <div style={{ fontSize:"3.5rem", fontWeight:800, color:"rgba(255,255,255,0.04)", letterSpacing:"-3px", lineHeight:1, marginBottom:"1.5rem" }}>{h.n}</div>
              <span style={{ fontSize:"1.625rem", display:"block", marginBottom:"0.875rem" }}>{h.icon}</span>
              <h3 style={{ fontSize:"0.9375rem", fontWeight:700, color:"white", marginBottom:"0.5rem", letterSpacing:"-0.02em" }}>{h.title}</h3>
              <p style={{ fontSize:"0.8125rem", color:S.muted, lineHeight:1.75 }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <div style={{ borderTop:S.border, borderBottom:S.border, background:"rgba(255,255,255,0.015)" }}>
        <Section id="features">
          <SectionLabel>// Features</SectionLabel>
          <SectionTitle>Built for the<br />real web.</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"0.125rem" }}>
            {FEATURES.map(f=>(
              <div key={f.title} className="feat-card" style={{
                background:S.card, border:S.border,
                borderRadius:"0.875rem", padding:"1.75rem",
              }}>
                <span style={{ fontSize:"1.625rem", display:"block", marginBottom:"1rem" }}>{f.icon}</span>
                <div style={{ display:"flex", alignItems:"center", gap:"0.625rem", marginBottom:"0.5rem" }}>
                  <h3 style={{ fontSize:"0.9375rem", fontWeight:700, color:"white", margin:0, letterSpacing:"-0.02em" }}>{f.title}</h3>
                  <span style={{
                    fontSize:"0.5625rem", fontWeight:600, textTransform:"uppercase",
                    letterSpacing:"0.12em", color:"rgba(255,255,255,0.25)",
                    border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:"0.375rem", padding:"2px 8px", whiteSpace:"nowrap",
                  }}>{f.tag}</span>
                </div>
                <p style={{ fontSize:"0.8125rem", color:S.muted, lineHeight:1.75, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── PRICING ── */}
      <Section id="pricing">
        <SectionLabel>// Pricing</SectionLabel>
        <SectionTitle>Simple pricing.<br />No surprises.</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"1rem" }}>
          {PLANS.map(p=><PlanCard key={p.name} plan={p} onCTA={handleCTA} />)}
        </div>
      </Section>

      {/* ── CTA BANNER ── */}
      <div style={{ borderTop:S.border }}>
        <section style={{ maxWidth:760, margin:"0 auto", padding:"7rem 2rem", textAlign:"center" }}>
          <h2 style={{ fontSize:"clamp(2.25rem,5vw,3.75rem)", fontWeight:800, letterSpacing:"-0.05em", lineHeight:1, color:"white", marginBottom:"1rem" }}>
            {user ? "Ready to automate more forms?" : "Ready to stop filling<br />forms manually?"}
          </h2>
          <p style={{ fontSize:"0.9375rem", color:S.muted, marginBottom:"2.5rem" }}>
            {user ? "Continue to your dashboard to manage your form automation." : "Join 3,000+ teams who automated the tedious stuff."}
          </p>
          <button onClick={() => user ? navigate('/form') : handleCTA("signup")} style={{
            background:"white", color:"black", border:"none",
            borderRadius:"0.75rem", padding:"1rem 2.5rem",
            fontSize:"1rem", fontWeight:700,
            cursor:"pointer", transition:"all .2s",
            fontFamily:S.font,
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.88)"}
            onMouseLeave={e=>e.currentTarget.style.background="white"}
            onMouseDown={e=>e.currentTarget.style.transform="scale(.98)"}
            onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
          >
            {user ? "⚡ Go to Dashboard" : "⚡ Launch Agent — it's free"}
          </button>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop:S.border,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"1.5rem 2rem", flexWrap:"wrap", gap:"1rem",
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
          {["Privacy","Terms","Docs","GitHub"].map(l=>(
            <a key={l} href="#" className="nav-link">{l}</a>
          ))}
        </div>

        <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.15)" }}>
          © 2026 AutoSlay · MIT License
        </div>
      </footer>
    </div>
  );
}