import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { signOut } from "firebase/auth";

/* ══════════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════════ */
const T = {
  bg:      "#080808",
  panel:   "#0c0c0c",
  card:    "#0f0f0f",
  border:  "rgba(255,255,255,0.07)",
  font:    "Inter, ui-sans-serif, system-ui, sans-serif",
  accent:  "#34d399",
  err:     "#f87171",
};

/* ══════════════════════════════════════════════════════
   ALL FORM SECTIONS & FIELDS
══════════════════════════════════════════════════════ */
export const SECTIONS = [
  {
    id: "personal",
    label: "Personal Info",
    icon: "👤",
    desc: "Basic identity details used in almost every form",
    fields: [
      { key: "firstName",    label: "First Name",        placeholder: "Arjun"            },
      { key: "lastName",     label: "Last Name",         placeholder: "Sharma"            },
      { key: "email",        label: "Email Address",     placeholder: "arjun@gmail.com",  type: "email" },
      { key: "phone",        label: "Phone / Mobile",    placeholder: "+91 98765 43210"   },
      { key: "altPhone",     label: "Alternate Phone",   placeholder: "+91 87654 32109"   },
      { key: "dob",          label: "Date of Birth",     placeholder: "1999-08-15",       type: "date"  },
      { key: "gender",       label: "Gender",            placeholder: "Male",             select: ["Male","Female","Non-binary","Prefer not to say"] },
      { key: "maritalStatus",label: "Marital Status",    placeholder: "Single",           select: ["Single","Married","Divorced","Widowed","Prefer not to say"] },
      { key: "nationality",  label: "Nationality",       placeholder: "Indian"            },
      { key: "religion",     label: "Religion (optional)",placeholder: "—"               },
      { key: "category",     label: "Category (Govt forms)", placeholder: "General / OBC / SC / ST", select: ["General","OBC","SC","ST","EWS","Other"] },
      { key: "disability",   label: "Person with Disability?", placeholder: "No", select: ["No","Yes"] },
    ],
  },
  {
    id: "address",
    label: "Address",
    icon: "🏠",
    desc: "Residential and permanent address details",
    fields: [
      { key: "address1",       label: "Address Line 1",       placeholder: "12, MG Road, Near City Mall", span: 2 },
      { key: "address2",       label: "Address Line 2",       placeholder: "Opposite SBI Bank",           span: 2 },
      { key: "landmark",       label: "Landmark",             placeholder: "Near AIIMS Gate"              },
      { key: "city",           label: "City / Town",          placeholder: "Jaipur"                       },
      { key: "state",          label: "State / Province",     placeholder: "Rajasthan"                    },
      { key: "pincode",        label: "PIN / ZIP Code",       placeholder: "302001"                       },
      { key: "country",        label: "Country",              placeholder: "India"                        },
      { key: "permanentAddr",  label: "Permanent Address (if different)", placeholder: "Village Rampur, Dist. Sikar…", span: 2, textarea: true },
    ],
  },
  {
    id: "identity",
    label: "Identity Docs",
    icon: "🪪",
    desc: "Government IDs required for official portals & applications",
    fields: [
      { key: "aadhaar",      label: "Aadhaar Number",          placeholder: "1234 5678 9012"  },
      { key: "pan",          label: "PAN Number",              placeholder: "ABCDE1234F"      },
      { key: "passport",     label: "Passport Number",         placeholder: "J1234567"        },
      { key: "passportExp",  label: "Passport Expiry",         placeholder: "2030-05-20",     type: "date" },
      { key: "drivingLic",   label: "Driving Licence No.",     placeholder: "RJ-1420110012345" },
      { key: "voterId",      label: "Voter ID",                placeholder: "ABC1234567"      },
      { key: "ration",       label: "Ration Card No.",         placeholder: "RJ/12/123/123456" },
      { key: "udise",        label: "UDISE / Roll No. (School/Exam)", placeholder: "123456789" },
    ],
  },
  {
    id: "education",
    label: "Education",
    icon: "🎓",
    desc: "Academic background for scholarships, jobs, and college apps",
    fields: [
      { key: "qualification",    label: "Highest Qualification",      placeholder: "B.Tech",              select: ["10th","12th","Diploma","B.Sc","B.A","B.Com","B.Tech","B.E","BCA","MCA","M.Tech","M.Sc","MBA","PhD","Other"] },
      { key: "fieldOfStudy",     label: "Branch / Field of Study",    placeholder: "Computer Science"     },
      { key: "university",       label: "University / College",       placeholder: "University of Rajasthan", span: 2 },
      { key: "graduationYear",   label: "Graduation / Pass-out Year", placeholder: "2023"                 },
      { key: "cgpa",             label: "CGPA / Percentage",          placeholder: "8.5 / 85%"            },
      { key: "tenthBoard",       label: "10th Board",                 placeholder: "CBSE / RBSE"          },
      { key: "tenthPercent",     label: "10th Percentage",            placeholder: "92%"                  },
      { key: "twelfthBoard",     label: "12th Board",                 placeholder: "CBSE"                 },
      { key: "twelfthPercent",   label: "12th Percentage",            placeholder: "88%"                  },
      { key: "twelfthStream",    label: "12th Stream",                placeholder: "Science / Commerce / Arts", select: ["Science","Commerce","Arts","Vocational","Other"] },
      { key: "entranceExam",     label: "Entrance Exam Cleared",      placeholder: "JEE / NEET / GATE / CAT" },
      { key: "entranceScore",    label: "Entrance Exam Score / Rank", placeholder: "95 percentile / AIR 1200" },
    ],
  },
  {
    id: "professional",
    label: "Professional",
    icon: "💼",
    desc: "Work experience, skills & career details for job applications",
    fields: [
      { key: "organization",  label: "Current Company / College",  placeholder: "Infosys / IIT Delhi",   span: 2 },
      { key: "jobTitle",      label: "Current Role / Designation", placeholder: "Software Engineer"      },
      { key: "experience",    label: "Total Years of Experience",  placeholder: "2"                      },
      { key: "industry",      label: "Industry / Sector",          placeholder: "IT & Software",         select: ["IT & Software","Finance","Healthcare","Education","Government","Startups","Research","Other"] },
      { key: "skills",        label: "Skills (comma-separated)",   placeholder: "React, Node.js, Python, SQL", span: 2 },
      { key: "certifications",label: "Certifications",            placeholder: "AWS Solutions Architect, Google Cloud Associate", span: 2 },
      { key: "languages",     label: "Programming Languages Known",placeholder: "JavaScript, Python, Java", span: 2 },
      { key: "tools",         label: "Tools & Frameworks",         placeholder: "Docker, Git, TensorFlow, Figma", span: 2 },
      { key: "ctc",           label: "Current CTC (if applicable)",placeholder: "8 LPA"                  },
      { key: "expectedCtc",   label: "Expected CTC",               placeholder: "12 LPA"                 },
      { key: "noticePeriod",  label: "Notice Period",              placeholder: "30 days",               select: ["Immediate","15 days","30 days","45 days","60 days","90 days","Other"] },
    ],
  },
  {
    id: "social",
    label: "Social & Links",
    icon: "🔗",
    desc: "Online presence, portfolios, and social profiles",
    fields: [
      { key: "linkedin",    label: "LinkedIn URL",             placeholder: "linkedin.com/in/arjun-sharma", type: "url" },
      { key: "github",      label: "GitHub URL",               placeholder: "github.com/arjunsharma",       type: "url" },
      { key: "portfolio",   label: "Portfolio / Website",      placeholder: "arjunsharma.dev",              type: "url" },
      { key: "twitter",     label: "Twitter / X Handle",       placeholder: "@arjunsharma"                 },
      { key: "instagram",   label: "Instagram Handle",         placeholder: "@arjun.sharma"                },
      { key: "leetcode",    label: "LeetCode / Codeforces",    placeholder: "leetcode.com/arjun",           type: "url" },
      { key: "devto",       label: "Dev.to / Medium / Blog",   placeholder: "dev.to/arjun",                type: "url" },
      { key: "youtube",     label: "YouTube Channel",          placeholder: "youtube.com/@arjun",          type: "url" },
      { key: "dribbble",    label: "Dribbble / Behance",       placeholder: "dribbble.com/arjun",          type: "url" },
    ],
  },
  {
    id: "event",
    label: "Events & Hackathons",
    icon: "🏆",
    desc: "Pre-fill team & project info for hackathons, tech events, competitions",
    fields: [
      { key: "teamName",          label: "Team Name",                placeholder: "Team Nexus"       },
      { key: "teamSize",          label: "Team Size",                placeholder: "4"                },
      { key: "teamRole",          label: "Your Role in Team",        placeholder: "Team Lead / Backend Developer" },
      { key: "projectName",       label: "Project / Idea Name",      placeholder: "EcoTrack"         },
      { key: "projectDescription",label: "Project Description",      placeholder: "An app that tracks real-time carbon footprint…", textarea: true, span: 2 },
      { key: "techStack",         label: "Tech Stack Used",          placeholder: "React, Firebase, Node.js, TensorFlow", span: 2 },
      { key: "githubRepo",        label: "Project GitHub Repo",      placeholder: "github.com/team/ecotrack", type: "url" },
      { key: "demoLink",          label: "Demo / Live URL",          placeholder: "ecotrack.vercel.app", type: "url" },
      { key: "achievements",      label: "Past Achievements / Awards", placeholder: "Smart India Hackathon 2023 finalist…", span: 2, textarea: true },
    ],
  },
  {
    id: "bio",
    label: "Bio & Extra",
    icon: "💬",
    desc: "Cover letter, SOP, bio — the finishing touch for any application",
    fields: [
      { key: "bio",         label: "Cover Letter / SOP / About Me",               placeholder: "I am a passionate full-stack developer with 2+ years of experience…", textarea: true, span: 2, rows: 5 },
      { key: "whyUs",       label: "Why do you want to join? (Why Us)",           placeholder: "I'm deeply inspired by your mission to…", textarea: true, span: 2, rows: 3 },
      { key: "strengths",   label: "Key Strengths",                               placeholder: "Problem-solving, team collaboration, fast learning", span: 2 },
      { key: "weaknesses",  label: "Areas of Improvement",                        placeholder: "Public speaking — actively working on it", span: 2 },
      { key: "hobbies",     label: "Hobbies / Interests",                         placeholder: "Open-source contributions, chess, photography" },
      { key: "message",     label: "Additional Message / Notes",                  placeholder: "I'm available for an interview any weekday after 5 PM…", textarea: true, span: 2 },
      { key: "resumeLink",  label: "Resume / CV Link (Google Drive / Notion)",    placeholder: "drive.google.com/file/d/...", type: "url", span: 2 },
      { key: "formContext", label: "Context / Purpose (helps AI adapt)",          placeholder: "Job application at a startup / Scholarship / Govt portal / Hackathon", span: 2 },
    ],
  },
];

/* flat list of all keys */
export const EMPTY_PROFILE = SECTIONS.flatMap(s => s.fields).reduce((acc, f) => {
  acc[f.key] = "";
  return acc;
}, {});

/* ══════════════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════════════ */
function Label({ children, required }) {
  return (
    <label style={{
      display: "block", marginBottom: "0.4rem",
      fontSize: "0.6875rem", fontWeight: 600,
      textTransform: "uppercase", letterSpacing: "0.12em",
      color: "rgba(255,255,255,0.3)",
    }}>
      {children}
      {required && <span style={{ color: "rgba(255,255,255,0.18)", marginLeft: 2 }}>*</span>}
    </label>
  );
}

const inputBase = (foc, disabled) => ({
  width: "100%", boxSizing: "border-box",
  borderRadius: "0.625rem",
  border: foc ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.08)",
  backgroundColor: foc ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
  padding: "0.6875rem 0.875rem",
  fontSize: "0.8125rem",
  color: "white",
  outline: "none",
  opacity: disabled ? 0.4 : 1,
  transition: "border-color 0.2s, background-color 0.2s",
  fontFamily: T.font,
});

function Input({ value, onChange, type = "text", placeholder, disabled }) {
  const [foc, setFoc] = useState(false);
  return (
    <input type={type} placeholder={placeholder} value={value}
      onChange={onChange} disabled={disabled}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={inputBase(foc, disabled)}
    />
  );
}

function Select({ value, onChange, options, placeholder, disabled }) {
  const [foc, setFoc] = useState(false);
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{ ...inputBase(foc, disabled), appearance: "none", cursor: "pointer", color: value ? "white" : "rgba(255,255,255,0.3)" }}
    >
      <option value="" disabled style={{ backgroundColor: "#1a1a1a" }}>{placeholder || "Select…"}</option>
      {options.map(o => <option key={o} value={o} style={{ backgroundColor: "#1a1a1a" }}>{o}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, disabled, rows = 3 }) {
  const [foc, setFoc] = useState(false);
  return (
    <textarea placeholder={placeholder} value={value}
      onChange={onChange} disabled={disabled} rows={rows}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{ ...inputBase(foc, disabled), resize: "vertical" }}
    />
  );
}

/* progress bar for a section */
function SectionProgress({ section, profile }) {
  const required = section.fields.filter(f => f.required);
  const optional = section.fields.filter(f => !f.required);
  const reqFilled = required.filter(f => profile[f.key]?.trim()).length;
  const optFilled = optional.filter(f => profile[f.key]?.trim()).length;
  const total     = section.fields.length;
  const filled    = reqFilled + optFilled;
  const pct       = total ? Math.round((filled / total) * 100) : 0;
  const color     = pct === 100 ? T.accent : pct > 50 ? "#fbbf24" : "rgba(255,255,255,0.25)";
  return (
    <div>
      <div style={{ height: "2px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: "0.375rem" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "9999px", transition: "width 0.4s" }} />
      </div>
      <p style={{ margin: "0.25rem 0 0", fontSize: "0.5625rem", color: "rgba(255,255,255,0.18)", fontWeight: 500 }}>
        {filled}/{total} filled {required.length > 0 && `· ${reqFilled}/${required.length} required`}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function Form() {
  const navigate = useNavigate();
  const user     = auth.currentUser;

  const [profile,   setProfile]   = useState({ ...EMPTY_PROFILE });
  const [active,    setActive]    = useState("personal");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [navOpen,   setNavOpen]   = useState(false);
  const [saveErr,   setSaveErr]   = useState("");
  const contentRef = useRef(null);

  /* ── load from Firestore on mount ── */
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        if (snap.exists()) setProfile(prev => ({ ...prev, ...snap.data() }));
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, navigate]);

  /* ── scroll to top on section change ── */
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [active]);

  const set = (key) => (e) => {
    setProfile(p => ({ ...p, [key]: e.target.value }));
    setSaved(false);
    setSaveErr("");
  };

  /* ── save to Firestore ── */
  const handleSave = async () => {
    if (!user) return;
    setSaving(true); setSaveErr("");
    try {
      await setDoc(doc(db, "profiles", user.uid), {
        ...profile,
        updatedAt: new Date().toISOString(),
        uid: user.uid,
        email: user.email,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveErr("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── global stats ── */
  const totalFields  = Object.keys(EMPTY_PROFILE).length;
  const filledFields = Object.values(profile).filter(v => v?.trim()).length;
  const fillPct      = Math.round((filledFields / totalFields) * 100);

  const currentSection = SECTIONS.find(s => s.id === active);
  const currentIdx     = SECTIONS.findIndex(s => s.id === active);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: T.bg, fontFamily: T.font }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "2rem", height: "2rem", borderRadius: "9999px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "white" }} className="spin" />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem", margin: 0 }}>Loading your profile…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: T.bg, fontFamily: T.font, color: "white" }}>

      {/* ════ SIDEBAR ════ */}
      <aside className="sidebar" style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40,
        width: "260px", display: "flex", flexDirection: "column",
        borderRight: `1px solid ${T.border}`, backgroundColor: T.panel,
        transform: navOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s",
      }}>
        {/* grid bg */}
        <div style={{ pointerEvents: "none", position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "36px 36px" }} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem 1rem", overflowY: "auto" }}>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", height: "2rem", width: "2rem", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "0.625rem", backgroundColor: "white", color: "black", fontSize: "0.875rem", fontWeight: 900 }}>⚡</div>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Profile Setup</span>
          </div>

          {/* Global progress */}
          <div style={{ borderRadius: "0.75rem", border: `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.03)", padding: "0.875rem 1rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>Profile Completion</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.04em", color: fillPct === 100 ? T.accent : "white" }}>{fillPct}%</span>
            </div>
            <div style={{ height: "3px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: "9999px", width: `${fillPct}%`, transition: "width 0.4s", backgroundColor: fillPct === 100 ? T.accent : fillPct > 50 ? "#fbbf24" : "rgba(255,255,255,0.3)" }} />
            </div>
            <p style={{ margin: "0.375rem 0 0", fontSize: "0.5625rem", color: "rgba(255,255,255,0.18)" }}>{filledFields} of {totalFields} fields filled</p>
          </div>

          {/* Section nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1 }}>
            {SECTIONS.map(sec => {
              const isActive = active === sec.id;
              const secFilled = sec.fields.filter(f => profile[f.key]?.trim()).length;
              const secReqFilled = sec.fields.filter(f => f.required && profile[f.key]?.trim()).length;
              const secReq = sec.fields.filter(f => f.required).length;
              const allReqDone = secReqFilled === secReq;
              return (
                <div key={sec.id} onClick={() => { setActive(sec.id); setNavOpen(false); }}
                  style={{
                    borderRadius: "0.625rem", padding: "0.625rem 0.75rem", cursor: "pointer",
                    border: isActive ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                    backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem" }}>{sec.icon}</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: isActive ? "white" : "rgba(255,255,255,0.35)", flex: 1 }}>{sec.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      {allReqDone && secReq > 0 && (
                        <span style={{ fontSize: "0.5rem", color: T.accent }}>✓</span>
                      )}
                      <span style={{ fontSize: "0.5625rem", fontWeight: 600, color: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "9999px", padding: "1px 6px" }}>{secFilled}/{sec.fields.length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div style={{ flex: 1 }} />

          {/* Go to Agent */}
          <button onClick={() => navigate("/home")} style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", padding: "0.75rem", cursor: "pointer", marginBottom: "0.5rem", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
          >
            <span style={{ fontSize: "1rem" }}>🤖</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Go to Agent</span>
          </button>

          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: "0.75rem", border: `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.03)", padding: "0.75rem" }}>
            <div style={{ display: "flex", height: "2rem", width: "2rem", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.1)", fontSize: "0.875rem" }}>
              {user?.photoURL ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "9999px", objectFit: "cover" }} /> : "👤"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.displayName || "User"}</p>
              <p style={{ margin: 0, fontSize: "0.625rem", color: "rgba(255,255,255,0.25)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
            </div>
            <button onClick={async () => { await signOut(auth); navigate("/"); }} style={{ flexShrink: 0, borderRadius: "0.5rem", padding: "0.375rem", color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {navOpen && <div onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30, backgroundColor: "rgba(0,0,0,0.6)" }} className="sidebar-overlay" />}

      {/* ════ MAIN ════ */}
      <div className="main-content" style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, backgroundColor: "rgba(8,8,8,0.9)", padding: "0.875rem 1.25rem", backdropFilter: "blur(12px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button className="hamburger" onClick={() => setNavOpen(true)} style={{ marginRight: "0.25rem", borderRadius: "0.5rem", padding: "0.375rem", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.03em", color: "white", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {currentSection?.icon} {currentSection?.label}
              </h1>
              <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>{currentSection?.desc}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Progress pill */}
            <div className="progress-pill" style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "9999px", border: `1px solid rgba(255,255,255,0.07)`, backgroundColor: "rgba(255,255,255,0.03)", padding: "0.375rem 0.75rem" }}>
              <div style={{ height: "28px", width: "28px", position: "relative", flexShrink: 0 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
                  <circle cx="14" cy="14" r="11" fill="none" stroke={fillPct === 100 ? T.accent : fillPct > 50 ? "#fbbf24" : "rgba(255,255,255,0.3)"} strokeWidth="2.5" strokeDasharray={`${2 * Math.PI * 11}`} strokeDashoffset={`${2 * Math.PI * 11 * (1 - fillPct / 100)}`} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.4s" }} />
                </svg>
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.4375rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{fillPct}%</span>
              </div>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>{filledFields}/{totalFields}</span>
            </div>

            {/* Save button */}
            <button onClick={handleSave} disabled={saving}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                borderRadius: "0.6875rem", padding: "0.6rem 1.25rem",
                fontSize: "0.8125rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                border: saved ? `1px solid rgba(52,211,153,0.3)` : "none",
                backgroundColor: saved ? "rgba(52,211,153,0.08)" : saving ? "rgba(255,255,255,0.07)" : "white",
                color: saved ? T.accent : saving ? "rgba(255,255,255,0.3)" : "black",
                opacity: saving ? 0.7 : 1,
                transition: "all 0.2s", fontFamily: T.font,
              }}
              onMouseEnter={e => { if (!saving && !saved) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.88)"; }}
              onMouseLeave={e => { if (!saving && !saved) e.currentTarget.style.backgroundColor = "white"; }}
            >
              {saving ? (
                <><span style={{ display: "block", width: "0.875rem", height: "0.875rem", borderRadius: "9999px", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.5)" }} className="spin" />Saving…</>
              ) : saved ? (
                <>✅ Saved!</>
              ) : (
                <>💾 Save Profile</>
              )}
            </button>
          </div>
        </header>

        {/* Error banner */}
        {saveErr && (
          <div style={{ flexShrink: 0, padding: "0.75rem 1.25rem", backgroundColor: "rgba(248,113,113,0.08)", borderBottom: "1px solid rgba(248,113,113,0.15)", fontSize: "0.8125rem", color: T.err, fontWeight: 500 }}>
            ⚠️ {saveErr}
          </div>
        )}

        {/* Section tabs — mobile horizontal scroll */}
        <div style={{ display: "flex", flexShrink: 0, gap: "0.25rem", padding: "0.625rem 1.25rem", borderBottom: `1px solid ${T.border}`, overflowX: "auto" }} className="section-tabs">
          {SECTIONS.map(sec => {
            const isActive = active === sec.id;
            const secFilled = sec.fields.filter(f => profile[f.key]?.trim()).length;
            return (
              <button key={sec.id} onClick={() => setActive(sec.id)} style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: "0.3rem",
                borderRadius: "0.5rem", padding: "0.375rem 0.625rem",
                border: isActive ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.06)",
                backgroundColor: isActive ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.02)",
                fontSize: "0.625rem", fontWeight: 600,
                color: isActive ? "white" : "rgba(255,255,255,0.3)",
                cursor: "pointer", fontFamily: T.font, transition: "all 0.15s",
              }}>
                <span style={{ fontSize: "0.75rem" }}>{sec.icon}</span>
                <span className="tab-label">{sec.label}</span>
                {secFilled > 0 && <span style={{ fontSize: "0.4375rem", fontWeight: 700, color: T.accent, backgroundColor: "rgba(52,211,153,0.1)", borderRadius: "9999px", padding: "1px 5px" }}>{secFilled}</span>}
              </button>
            );
          })}
        </div>

        {/* Fields */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>

            {/* Section progress */}
            <div style={{ marginBottom: "1.25rem", borderRadius: "0.75rem", border: `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.02)", padding: "0.875rem 1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{currentSection?.icon} {currentSection?.label}</p>
                <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>{currentSection?.desc}</p>
              </div>
              <SectionProgress section={currentSection} profile={profile} />
            </div>

            {/* Fields grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignContent: "start" }} className="fields-grid">
              {currentSection?.fields.map(field => (
                <div key={field.key} style={{ gridColumn: field.span === 2 ? "1 / -1" : "auto" }}>
                  <Label required={field.required}>{field.label}</Label>
                  {field.select ? (
                    <Select
                      value={profile[field.key]}
                      onChange={set(field.key)}
                      options={field.select}
                      placeholder={field.placeholder}
                    />
                  ) : field.textarea ? (
                    <Textarea
                      value={profile[field.key]}
                      onChange={set(field.key)}
                      placeholder={field.placeholder}
                      rows={field.rows || 3}
                    />
                  ) : (
                    <Input
                      type={field.type || "text"}
                      value={profile[field.key]}
                      onChange={set(field.key)}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Section prev/next */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", gap: "0.75rem" }}>
              <button onClick={() => currentIdx > 0 && setActive(SECTIONS[currentIdx - 1].id)}
                disabled={currentIdx === 0}
                style={{ borderRadius: "0.625rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.625rem 1.25rem", fontSize: "0.8125rem", fontWeight: 600, color: currentIdx === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.4)", cursor: currentIdx === 0 ? "default" : "pointer", fontFamily: T.font }}
              >← Previous</button>

              {currentIdx < SECTIONS.length - 1 ? (
                <button onClick={() => setActive(SECTIONS[currentIdx + 1].id)}
                  style={{ borderRadius: "0.625rem", border: "none", backgroundColor: "white", padding: "0.625rem 1.5rem", fontSize: "0.8125rem", fontWeight: 700, color: "black", cursor: "pointer", fontFamily: T.font, transition: "background-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.88)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}
                >Next: {SECTIONS[currentIdx + 1].icon} {SECTIONS[currentIdx + 1].label} →</button>
              ) : (
                <button onClick={handleSave} disabled={saving}
                  style={{ borderRadius: "0.625rem", border: "none", backgroundColor: saved ? "rgba(52,211,153,0.12)" : "white", padding: "0.625rem 1.5rem", fontSize: "0.8125rem", fontWeight: 700, color: saved ? T.accent : "black", cursor: saving ? "not-allowed" : "pointer", fontFamily: T.font, border: saved ? `1px solid rgba(52,211,153,0.2)` : "none" }}
                >
                  {saving ? "Saving…" : saved ? "✅ Profile Saved!" : "💾 Save & Finish"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @media (min-width: 1024px) {
          .sidebar { transform: translateX(0) !important; position: relative !important; }
          .sidebar-overlay { display: none !important; }
          .hamburger { display: none !important; }
        }
        @media (max-width: 640px) {
          .fields-grid { grid-template-columns: 1fr !important; }
          .progress-pill { display: none !important; }
          .tab-label { display: none; }
        }
        input::placeholder, textarea::placeholder, select::placeholder { color: rgba(255,255,255,0.15); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        textarea { color-scheme: dark; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 9999px; }
      `}</style>
    </div>
  );
}
