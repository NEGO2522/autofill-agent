import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
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
   CLOUDINARY CONFIG
══════════════════════════════════════════════════════ */
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/* ══════════════════════════════════════════════════════
   FORM SECTIONS  (hackathon focused)
══════════════════════════════════════════════════════ */
export const SECTIONS = [
  {
    id: "profile",
    label: "Complete Profile",
    icon: "👤",
    desc: "Personal, academic, and document information",
    fields: [
      { key: "firstName", label: "First Name",     placeholder: "Arjun",               required: true },
      { key: "lastName",  label: "Last Name",       placeholder: "Sharma",              required: true },
      { key: "email",     label: "Email Address",   placeholder: "arjun@gmail.com",     required: true, type: "email" },
      { key: "phone",     label: "Contact Number",  placeholder: "+91 98765 43210",      required: true },
      { key: "collegeName",  label: "College / University Name", placeholder: "JECRC University",   required: true, span: 2 },
      { key: "degreeName",    label: "Degree / Program",    placeholder: "B.Tech Computer Science",        required: true },
      { key: "year",          label: "Current Year",           placeholder: "3rd Year",                           required: true },
      { key: "expectedGraduationYear", label: "Expected Graduation Year", placeholder: "2025", required: true },
      { key: "rollNumber",    label: "Roll Number / Student ID", placeholder: "21EJCCS001",                     required: false },
    ],
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
function FileUpload({ label, required, accept, file, url, progress, onFileChange, uploading, onViewFile }) {
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
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onViewFile();
              }}
              style={{ 
                fontSize: "0.75rem", 
                color: T.accent, 
                textDecoration: "underline", 
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: T.font,
                fontWeight: 500
              }}>
              View uploaded file
            </button>
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
   CLOUDINARY UPLOAD HELPER
══════════════════════════════════════════════════════ */
const uploadToCloudinary = async (file, setProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'autofill-agent');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        setProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          url: response.secure_url,
          publicId: response.public_id,
        });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
    xhr.send(formData);
  });
};

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function Form() {
  const navigate = useNavigate();
  const user     = auth.currentUser;

  const [profile,   setProfile]   = useState({ ...EMPTY_PROFILE });
  const [active,    setActive]    = useState("profile");
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
          
          // Load URLs from Firestore
          if (data.resumeURL) setResumeURL(data.resumeURL);
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

  /* ── View file handler ── */
  const handleViewResumeFile = () => {
    if (resumeURL) {
      window.open(resumeURL, "_blank");
    }
  };

  const handleViewPhotoFile = () => {
    if (photoURL) {
      window.open(photoURL, "_blank");
    }
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!user) return;

    /* Check if Cloudinary is configured */
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setSaveErr("⚠️ Cloudinary is not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file.");
      return;
    }

    /* resume is required */
    if (!resumeURL && !resumeFile) {
      setSaveErr("⚠️ Resume is required. Please upload your resume before saving.");
      return;
    }

    setSaving(true); setSaveErr("");
    try {
      let finalResumeURL = resumeURL;
      let finalPhotoURL = photoURL;

      // Upload resume to Cloudinary if new file selected
      if (resumeFile) {
        setResumeUp(true);
        try {
          const result = await uploadToCloudinary(resumeFile, setResumeProgress);
          finalResumeURL = result.url;
          setResumeURL(result.url);
        } catch (error) {
          setSaveErr("Failed to upload resume: " + error.message);
          setResumeUp(false);
          setSaving(false);
          return;
        }
        setResumeUp(false);
      }

      // Upload photo to Cloudinary if new file selected
      if (photoFile) {
        setPhotoUp(true);
        try {
          const result = await uploadToCloudinary(photoFile, setPhotoProgress);
          finalPhotoURL = result.url;
          setPhotoURL(result.url);
        } catch (error) {
          setSaveErr("Failed to upload photo: " + error.message);
          setPhotoUp(false);
          setSaving(false);
          return;
        }
        setPhotoUp(false);
      }

      // Save to Firestore
      await setDoc(doc(db, "profiles", user.uid), {
        ...profile,
        resumeURL: finalResumeURL || "",
        collegePhotoURL: finalPhotoURL || "",
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

        
        {/* Fields */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          <div style={{ maxWidth: "820px", margin: "0 auto" }}>

            {/* Regular field sections */}
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

            {/* Documents section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "2rem" }}>

              {/* Info banner */}
              <div style={{ borderRadius: "0.75rem", border: "1px solid rgba(52,211,153,0.15)", backgroundColor: "rgba(52,211,153,0.04)", padding: "0.875rem 1rem" }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "rgba(52,211,153,0.8)", fontWeight: 500 }}>
                  📎 Resume is <strong>required</strong>. College Photo ID is optional. Files uploaded to Cloudinary.
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
                  onViewFile={handleViewResumeFile}
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
                  onViewFile={handleViewPhotoFile}
                />
              </div>

              <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                Files are securely stored on Cloudinary and accessible only via the URL.
              </p>
            </div>

            {/* Save button */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "1.75rem" }}>
              <button onClick={handleSave} disabled={saving}
                style={{ borderRadius: "0.625rem", border: saved ? `1px solid rgba(52,211,153,0.2)` : "none", backgroundColor: saved ? "rgba(52,211,153,0.12)" : "white", padding: "0.75rem 2rem", fontSize: "0.875rem", fontWeight: 700, color: saved ? T.accent : "black", cursor: saving ? "not-allowed" : "pointer", fontFamily: T.font }}
              >
                {saving ? "Saving…" : saved ? "✅ Saved!" : "💾 Save Profile"}
              </button>
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