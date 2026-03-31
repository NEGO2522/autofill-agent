import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { auth, db, storage } from "../firebase/firebase";
import { signOut } from "firebase/auth";

/* ══════════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════════ */
const T = {
  bg:     "#080808",
  panel:  "#0c0c0c",
  border: "rgba(255,255,255,0.07)",
  font:   "Inter, ui-sans-serif, system-ui, sans-serif",
  accent: "#34d399",
  err:    "#f87171",
};

/* ══════════════════════════════════════════════════════
   FORM SECTIONS  (hackathon / job focused)
══════════════════════════════════════════════════════ */
export const SECTIONS = [
  {
    id: "personal",
    label: "Personal Info",
    icon: "👤",
    desc: "Basic identity details",
    fields: [
      { key: "firstName", label: "First Name",     placeholder: "Arjun",               required: false },
      { key: "lastName",  label: "Last Name",       placeholder: "Sharma",              required: false },
      { key: "email",     label: "Email Address",   placeholder: "arjun@gmail.com",     required: false, type: "email" },
      { key: "phone",     label: "Contact Number",  placeholder: "+91 98765 43210",      required: false },
    ],
  },
  {
    id: "team",
    label: "Team Details",
    icon: "🏆",
    desc: "Hackathon / event team information",
    fields: [
      { key: "teamName",    label: "Team Name",     placeholder: "Team Nexus",          required: false },
      { key: "teamSize",    label: "Team Size",     placeholder: "4",                   required: false },
      { key: "teamRole",    label: "Your Role",     placeholder: "Team Lead / Backend", required: false },
      { key: "projectName", label: "Project / Idea Name", placeholder: "EcoTrack",     required: false },
      { key: "techStack", label: "Tech Stack", placeholder: "React, Firebase, Node.js", required: false, span: 2 },
    ],
  },
  {
    id: "job",
    label: "Job Details",
    icon: "💼",
    desc: "Professional & career related fields",
    fields: [
      { key: "organization",  label: "Current Company / College", placeholder: "JECRC / Infosys",   required: false, span: 2 },
      { key: "jobTitle",      label: "Current Role / Designation", placeholder: "Software Engineer", required: false },
      { key: "experience",    label: "Years of Experience",        placeholder: "2",                 required: false },
      { key: "skills",  label: "Skills",         placeholder: "React, Node.js, Python",             required: false, span: 2 },
      { key: "degreeName",    label: "Degree Name",    placeholder: "B.Tech Computer Science",        required: false, span: 2 },
      { key: "specialization", label: "Specialization", placeholder: "Artificial Intelligence",       required: false },
      { key: "year",          label: "Year",           placeholder: "3rd",                           required: false },
      { key: "expectedGraduationYear", label: "Expected Year of Graduation", placeholder: "2025", required: false },
    ],
  },
  {
    id: "social",
    label: "Social Links",
    icon: "🔗",
    desc: "Online presence and portfolios",
    fields: [
      { key: "linkedin",  label: "LinkedIn URL",       placeholder: "linkedin.com/in/username",  required: false, type: "url" },
      { key: "github",    label: "GitHub URL",         placeholder: "github.com/username",       required: false, type: "url" },
      { key: "portfolio", label: "Portfolio / Website", placeholder: "yoursite.dev",             required: false, type: "url" },
      { key: "twitter",   label: "Twitter / X",        placeholder: "@username",                 required: false },
      { key: "leetcode",  label: "LeetCode / CF",      placeholder: "leetcode.com/username",     required: false, type: "url" },
      { key: "instagram", label: "Instagram",          placeholder: "@username",                 required: false },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    icon: "📎",
    desc: "Upload your resume and college photo ID",
    fields: [], // handled separately — file uploads
  },
];

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
      {required && <span style={{ color: T.err, marginLeft: 4 }}>*</span>}
    </label>
  );
}

const inputBase = (foc) => ({
  width: "100%", boxSizing: "border-box",
  borderRadius: "0.625rem",
  border: foc ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.08)",
  backgroundColor: foc ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
  padding: "0.6875rem 0.875rem",
  fontSize: "0.8125rem",
  color: "white",
  outline: "none",
  transition: "border-color 0.2s, background-color 0.2s",
  fontFamily: T.font,
});

function Input({ value, onChange, type = "text", placeholder }) {
  const [foc, setFoc] = useState(false);
  return (
    <input type={type} placeholder={placeholder} value={value}
      onChange={onChange}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={inputBase(foc)}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  const [foc, setFoc] = useState(false);
  return (
    <select value={value} onChange={onChange}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{ ...inputBase(foc), appearance: "none", cursor: "pointer", color: value ? "white" : "rgba(255,255,255,0.3)" }}
    >
      <option value="" disabled style={{ backgroundColor: "#1a1a1a" }}>{placeholder || "Select…"}</option>
      {options.map(o => <option key={o} value={o} style={{ backgroundColor: "#1a1a1a" }}>{o}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  const [foc, setFoc] = useState(false);
  return (
    <textarea placeholder={placeholder} value={value}
      onChange={onChange} rows={rows}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{ ...inputBase(foc), resize: "vertical" }}
    />
  );
}

/* ── File upload card ── */
function FileUpload({ label, required, accept, file, url, progress, onFileChange, uploading }) {
  const inputRef = useRef();
  const hasFile = !!file || !!url;
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: hasFile ? `1px solid rgba(52,211,153,0.3)` : "1px dashed rgba(255,255,255,0.12)",
          borderRadius: "0.75rem",
          backgroundColor: hasFile ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.02)",
          padding: "1.25rem 1rem",
          cursor: uploading ? "wait" : "pointer",
          transition: "all 0.2s",
          textAlign: "center",
        }}
        onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = hasFile ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = hasFile ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.12)"; }}
      >
        <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }}
          onChange={e => onFileChange(e.target.files[0])} />

        {uploading ? (
          <div>
            <div style={{ height: "3px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: "0.5rem" }}>
              <div style={{ height: "100%", width: `${progress}%`, backgroundColor: T.accent, borderRadius: "9999px", transition: "width 0.3s" }} />
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>Uploading… {progress}%</p>
          </div>
        ) : url ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span style={{ color: T.accent, fontSize: "1rem" }}>✅</span>
            <a href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              style={{ fontSize: "0.75rem", color: T.accent, textDecoration: "underline" }}>
              View uploaded file
            </a>
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>· click to replace</span>
          </div>
        ) : file ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem" }}>📄</span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{file.name}</span>
          </div>
        ) : (
          <div>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.3)" }}>
              {required ? "📎 Click to upload (required)" : "📎 Click to upload (optional)"}
            </p>
            <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.15)" }}>
              {accept === "application/pdf" ? "PDF only" : "JPG, PNG, PDF accepted"}
            </p>
          </div>
        )}
      </div>
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

  /* file state */
  const [resumeFile,    setResumeFile]    = useState(null);
  const [resumeURL,     setResumeURL]     = useState("");
  const [resumeProgress,setResumeProgress]= useState(0);
  const [resumeUploading,setResumeUp]     = useState(false);

  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoURL,     setPhotoURL]     = useState("");
  const [photoProgress,setPhotoProgress]= useState(0);
  const [photoUploading,setPhotoUp]     = useState(false);

  const contentRef = useRef(null);

  /* ── load from Firestore ── */
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(prev => ({ ...prev, ...data }));
          if (data.resumeURL)  setResumeURL(data.resumeURL);
          if (data.collegePhotoURL) setPhotoURL(data.collegePhotoURL);
        }
      } catch (e) { console.error("Load error:", e); }
      finally { setLoading(false); }
    })();
  }, [user, navigate]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [active]);

  const set = (key) => (e) => {
    setProfile(p => ({ ...p, [key]: e.target.value }));
    setSaved(false); setSaveErr("");
  };

  /* ── upload helper ── */
  const uploadFile = (file, path, setProgress, setUploading, setURL) => {
    return new Promise((resolve, reject) => {
      setUploading(true);
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      task.on("state_changed",
        snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        err  => { setUploading(false); reject(err); },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setURL(url);
          setUploading(false);
          resolve(url);
        }
      );
    });
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!user) return;

    /* resume is required */
    if (!resumeURL && !resumeFile) {
      setSaveErr("⚠️ Resume is required. Please upload your resume before saving.");
      setActive("documents");
      return;
    }

    setSaving(true); setSaveErr("");
    try {
      let finalResumeURL  = resumeURL;
      let finalPhotoURL   = photoURL;

      if (resumeFile && !resumeURL) {
        finalResumeURL = await uploadFile(
          resumeFile,
          `resumes/${user.uid}/${resumeFile.name}`,
          setResumeProgress, setResumeUp, setResumeURL
        );
      }
      if (photoFile && !photoURL) {
        finalPhotoURL = await uploadFile(
          photoFile,
          `college-ids/${user.uid}/${photoFile.name}`,
          setPhotoProgress, setPhotoUp, setPhotoURL
        );
      }

      await setDoc(doc(db, "profiles", user.uid), {
        ...profile,
        resumeURL:      finalResumeURL  || "",
        collegePhotoURL: finalPhotoURL  || "",
        updatedAt: new Date().toISOString(),
        uid:   user.uid,
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
        width: "240px", display: "flex", flexDirection: "column",
        borderRight: `1px solid ${T.border}`, backgroundColor: T.panel,
        transform: navOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s",
      }}>
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem 1rem", overflowY: "auto" }}>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", height: "2rem", width: "2rem", alignItems: "center", justifyContent: "center", borderRadius: "0.625rem", backgroundColor: "white", color: "black", fontSize: "0.875rem", fontWeight: 900 }}>⚡</div>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Profile Setup</span>
          </div>

          {/* Section nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1 }}>
            {SECTIONS.map(sec => {
              const isActive = active === sec.id;
              const secFilled = sec.fields.filter(f => profile[f.key]?.trim()).length;
              return (
                <div key={sec.id} onClick={() => { setActive(sec.id); setNavOpen(false); }}
                  style={{
                    borderRadius: "0.625rem", padding: "0.625rem 0.75rem", cursor: "pointer",
                    border: isActive ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                    backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem" }}>{sec.icon}</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: isActive ? "white" : "rgba(255,255,255,0.35)", flex: 1 }}>{sec.label}</span>
                    {secFilled > 0 && (
                      <span style={{ fontSize: "0.5625rem", fontWeight: 600, color: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "9999px", padding: "1px 6px" }}>{secFilled}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>

          <div style={{ flex: 1 }} />

          {/* Go to Agent */}
          <button onClick={() => navigate("/home")}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", padding: "0.75rem", cursor: "pointer", marginBottom: "0.5rem", background: "none" }}
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
            <button onClick={async () => { await signOut(auth); navigate("/"); }}
              style={{ flexShrink: 0, borderRadius: "0.5rem", padding: "0.375rem", color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {navOpen && <div onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30, backgroundColor: "rgba(0,0,0,0.6)" }} />}

      {/* ════ MAIN ════ */}
      <div className="main-content" style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, backgroundColor: "rgba(8,8,8,0.9)", padding: "0.875rem 1.25rem", backdropFilter: "blur(12px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button className="hamburger" onClick={() => setNavOpen(true)}
              style={{ borderRadius: "0.5rem", padding: "0.375rem", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.03em", color: "white", margin: 0 }}>
                {currentSection?.icon} {currentSection?.label}
              </h1>
              <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>{currentSection?.desc}</p>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || resumeUploading || photoUploading}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              borderRadius: "0.6875rem", padding: "0.6rem 1.25rem",
              fontSize: "0.8125rem", fontWeight: 700,
              cursor: (saving || resumeUploading || photoUploading) ? "not-allowed" : "pointer",
              border: saved ? `1px solid rgba(52,211,153,0.3)` : "none",
              backgroundColor: saved ? "rgba(52,211,153,0.08)" : saving ? "rgba(255,255,255,0.07)" : "white",
              color: saved ? T.accent : saving ? "rgba(255,255,255,0.3)" : "black",
              opacity: (saving || resumeUploading || photoUploading) ? 0.7 : 1,
              transition: "all 0.2s", fontFamily: T.font,
            }}
          >
            {saving ? (
              <><span style={{ display: "block", width: "0.875rem", height: "0.875rem", borderRadius: "9999px", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.5)" }} className="spin" />Saving…</>
            ) : saved ? <>✅ Saved!</> : <>💾 Save Profile</>}
          </button>
        </header>

        {/* Error banner */}
        {saveErr && (
          <div style={{ flexShrink: 0, padding: "0.75rem 1.25rem", backgroundColor: "rgba(248,113,113,0.08)", borderBottom: "1px solid rgba(248,113,113,0.15)", fontSize: "0.8125rem", color: T.err, fontWeight: 500 }}>
            {saveErr}
          </div>
        )}

        {/* Section tabs */}
        <div style={{ display: "flex", flexShrink: 0, gap: "0.25rem", padding: "0.625rem 1.25rem", borderBottom: `1px solid ${T.border}`, overflowX: "auto" }}>
          {SECTIONS.map(sec => {
            const isActive = active === sec.id;
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
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Fields */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          <div style={{ maxWidth: "820px", margin: "0 auto" }}>

            {/* Regular field sections */}
            {active !== "documents" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignContent: "start" }} className="fields-grid">
                {currentSection?.fields.map(field => (
                  <div key={field.key} style={{ gridColumn: field.span === 2 ? "1 / -1" : "auto" }}>
                    <Label required={field.required}>{field.label}</Label>
                    {field.select ? (
                      <Select value={profile[field.key]} onChange={set(field.key)} options={field.select} placeholder={field.placeholder} />
                    ) : field.textarea ? (
                      <Textarea value={profile[field.key]} onChange={set(field.key)} placeholder={field.placeholder} rows={field.rows || 3} />
                    ) : (
                      <Input type={field.type || "text"} value={profile[field.key]} onChange={set(field.key)} placeholder={field.placeholder} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Documents section */}
            {active === "documents" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                {/* Info banner */}
                <div style={{ borderRadius: "0.75rem", border: "1px solid rgba(52,211,153,0.15)", backgroundColor: "rgba(52,211,153,0.04)", padding: "0.875rem 1rem" }}>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "rgba(52,211,153,0.8)", fontWeight: 500 }}>
                    📎 Resume is <strong>required</strong>. College Photo ID is optional.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="fields-grid">
                  {/* Resume */}
                  <FileUpload
                    label="Resume / CV"
                    required={true}
                    accept="application/pdf"
                    file={resumeFile}
                    url={resumeURL}
                    progress={resumeProgress}
                    uploading={resumeUploading}
                    onFileChange={f => { setResumeFile(f); setResumeURL(""); setSaveErr(""); }}
                  />

                  {/* College Photo ID */}
                  <FileUpload
                    label="College Photo ID"
                    required={false}
                    accept="image/jpeg,image/png,application/pdf"
                    file={photoFile}
                    url={photoURL}
                    progress={photoProgress}
                    uploading={photoUploading}
                    onFileChange={f => { setPhotoFile(f); setPhotoURL(""); }}
                  />
                </div>

                <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                  Files are securely stored and only accessible to you.
                </p>
              </div>
            )}

            {/* Prev / Next */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.75rem", gap: "0.75rem" }}>
              <button
                onClick={() => currentIdx > 0 && setActive(SECTIONS[currentIdx - 1].id)}
                disabled={currentIdx === 0}
                style={{ borderRadius: "0.625rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.625rem 1.25rem", fontSize: "0.8125rem", fontWeight: 600, color: currentIdx === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.4)", cursor: currentIdx === 0 ? "default" : "pointer", fontFamily: T.font }}
              >← Previous</button>

              {currentIdx < SECTIONS.length - 1 ? (
                <button onClick={() => setActive(SECTIONS[currentIdx + 1].id)}
                  style={{ borderRadius: "0.625rem", border: "none", backgroundColor: "white", padding: "0.625rem 1.5rem", fontSize: "0.8125rem", fontWeight: 700, color: "black", cursor: "pointer", fontFamily: T.font }}
                >Next: {SECTIONS[currentIdx + 1].icon} {SECTIONS[currentIdx + 1].label} →</button>
              ) : (
                <button onClick={handleSave} disabled={saving}
                  style={{ borderRadius: "0.625rem", border: saved ? `1px solid rgba(52,211,153,0.2)` : "none", backgroundColor: saved ? "rgba(52,211,153,0.12)" : "white", padding: "0.625rem 1.5rem", fontSize: "0.8125rem", fontWeight: 700, color: saved ? T.accent : "black", cursor: saving ? "not-allowed" : "pointer", fontFamily: T.font }}
                >
                  {saving ? "Saving…" : saved ? "✅ Saved!" : "💾 Save & Finish"}
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
          .hamburger { display: none !important; }
        }
        @media (max-width: 640px) {
          .fields-grid { grid-template-columns: 1fr !important; }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.15); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 9999px; }
      `}</style>
    </div>
  );
}