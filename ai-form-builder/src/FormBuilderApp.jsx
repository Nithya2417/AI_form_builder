import { useState, useRef, useCallback, useEffect } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);

const FIELD_TYPES = [
  { value: "text",     label: "Single-line Text" },
  { value: "textarea", label: "Multi-line Text" },
  { value: "number",   label: "Number" },
  { value: "date",     label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

const STEPS = ["Build Form", "Upload Doc", "AI Extract", "Review & Save"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #0c0c10; --surface: #13131a; --surface2: #1a1a24; --border: #2a2a38;
  --accent: #7c6eff; --accent2: #ff6eb4; --accent3: #6effc8;
  --text: #e8e8f0; --muted: #6b6b80; --danger: #ff5252; --warning: #ffb347;
  --radius: 10px; --font-head: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif; --font-mono: 'DM Mono', monospace;
}
body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; }
.app { max-width: 1100px; margin: 0 auto; padding: 24px 16px 80px; }
.header { display: flex; align-items: center; gap: 14px; margin-bottom: 36px; }
.logo { width: 38px; height: 38px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: 10px; display: grid; place-items: center; font-size: 18px; flex-shrink: 0; }
.header h1 { font-family: var(--font-head); font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
.header h1 span { background: linear-gradient(90deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stepper { display: flex; margin-bottom: 40px; border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); }
.step { flex: 1; padding: 12px 8px; text-align: center; font-size: 0.72rem; font-family: var(--font-mono); font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; cursor: default; transition: all 0.2s; border-right: 1px solid var(--border); background: var(--surface); color: var(--muted); display: flex; flex-direction: column; align-items: center; gap: 4px; }
.step:last-child { border-right: none; }
.step .step-num { width: 22px; height: 22px; border-radius: 50%; background: var(--border); display: grid; place-items: center; font-size: 0.65rem; }
.step.active { background: var(--surface2); color: var(--accent); }
.step.active .step-num { background: var(--accent); color: #fff; }
.step.done { color: var(--accent3); cursor: pointer; }
.step.done .step-num { background: var(--accent3); color: var(--bg); }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 16px; }
.card-title { font-family: var(--font-head); font-size: 1rem; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tag { font-family: var(--font-mono); font-size: 0.65rem; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.06em; }
.tag-accent { background: rgba(124,110,255,0.15); color: var(--accent); border: 1px solid rgba(124,110,255,0.3); }
.tag-success { background: rgba(110,255,200,0.12); color: var(--accent3); border: 1px solid rgba(110,255,200,0.25); }
.tag-warn { background: rgba(255,179,71,0.12); color: var(--warning); border: 1px solid rgba(255,179,71,0.25); }
.tag-danger { background: rgba(255,82,82,0.12); color: var(--danger); border: 1px solid rgba(255,82,82,0.3); }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; font-family: var(--font-body); font-size: 0.85rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.18s; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: #6a5ee0; transform: translateY(-1px); }
.btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
.btn-secondary:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-ghost { background: transparent; color: var(--muted); border: 1px solid transparent; }
.btn-ghost:hover { color: var(--danger); }
.btn-success { background: rgba(110,255,200,0.15); color: var(--accent3); border: 1px solid rgba(110,255,200,0.3); }
.btn-success:hover:not(:disabled) { background: rgba(110,255,200,0.25); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-lg { padding: 12px 28px; font-size: 0.95rem; }
.btn-sm { padding: 6px 12px; font-size: 0.78rem; }
.field-row { display: grid; grid-template-columns: 1fr 180px 110px auto; gap: 10px; align-items: start; padding: 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 10px; transition: border-color 0.2s; }
.field-row:hover { border-color: var(--accent); }
label { font-size: 0.78rem; color: var(--muted); font-family: var(--font-mono); margin-bottom: 4px; display: block; }
input[type=text], input[type=number], input[type=date], input[type=email], textarea, select {
  width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 7px;
  color: var(--text); font-family: var(--font-body); font-size: 0.875rem; padding: 8px 10px; outline: none; transition: border-color 0.2s;
}
input:focus, textarea:focus, select:focus { border-color: var(--accent); }
textarea { resize: vertical; min-height: 70px; }
select option { background: var(--surface); }
.checkbox-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; }
input[type=checkbox] { accent-color: var(--accent); width: 15px; height: 15px; flex-shrink: 0; }
.input-stack { display: flex; flex-direction: column; }
.options-area { background: var(--bg); border: 1px solid var(--border); border-radius: 7px; padding: 8px; margin-top: 6px; }
.dropzone { border: 2px dashed var(--border); border-radius: var(--radius); padding: 48px 24px; text-align: center; cursor: pointer; transition: all 0.25s; background: var(--surface2); }
.dropzone:hover, .dropzone.dragging { border-color: var(--accent); background: rgba(124,110,255,0.06); }
.dropzone h3 { font-family: var(--font-head); font-size: 1.1rem; margin-bottom: 6px; }
.dropzone p { color: var(--muted); font-size: 0.85rem; }
.drop-icon { font-size: 2.5rem; margin-bottom: 12px; }
.file-chip { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius); }
.file-chip .file-icon { font-size: 1.4rem; }
.file-chip .file-name { font-family: var(--font-mono); font-size: 0.82rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-chip .file-size { font-size: 0.75rem; color: var(--muted); white-space: nowrap; }
.ai-loader { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 16px; }
.ai-pulse { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); animation: pulse 1.5s ease-in-out infinite; display: grid; place-items: center; font-size: 1.6rem; }
@keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: 0.8; } }
.ai-label { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text); letter-spacing: 0.04em; }
.preview-split { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 700px) { .preview-split { grid-template-columns: 1fr; } .field-row { grid-template-columns: 1fr 1fr; } }
.preview-field { margin-bottom: 16px; }
.preview-field > label { font-size: 0.8rem; font-weight: 500; color: var(--text); margin-bottom: 5px; }
.required-star { color: var(--accent2); margin-left: 2px; }
.badge { font-size: 0.68rem; font-family: var(--font-mono); margin-left: 6px; }
.autofilled { border-color: var(--accent3) !important; background: rgba(110,255,200,0.04) !important; }
.missing-field { border-color: var(--warning) !important; background: rgba(255,179,71,0.04) !important; }
.summary-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.summary-stat { padding: 8px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: 0.8rem; }
.summary-stat span { font-family: var(--font-mono); font-size: 1rem; font-weight: 600; display: block; }
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 8px; font-size: 0.85rem; font-family: var(--font-mono); z-index: 999; animation: slideUp 0.3s ease; white-space: nowrap; }
.toast-success { background: var(--surface2); border: 1px solid var(--accent3); color: var(--accent3); }
.toast-warn { background: var(--surface2); border: 1px solid var(--warning); color: var(--warning); }
@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
.nav-strip { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; }
.nav-strip .gap { display: flex; gap: 10px; }
.empty { text-align: center; padding: 40px; color: var(--muted); }
.empty .em-icon { font-size: 2rem; margin-bottom: 10px; }
.empty p { font-size: 0.85rem; }
.divider { height: 1px; background: var(--border); margin: 20px 0; }
.error-msg { background: rgba(255,82,82,0.08); border: 1px solid rgba(255,82,82,0.3); border-radius: 8px; padding: 10px 14px; color: var(--danger); font-size: 0.83rem; margin-top: 10px; }
.saved-view { text-align: center; padding: 40px 20px; }
.saved-icon { font-size: 3rem; margin-bottom: 16px; }
.saved-view h2 { font-family: var(--font-head); font-size: 1.6rem; font-weight: 800; margin-bottom: 8px; }
.saved-view p { color: var(--muted); }
.schema-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.82rem; }
.schema-item:last-child { border-bottom: none; }

`;

function FieldEditor({ field, onChange, onRemove }) {
  const update = (k, v) => onChange({ ...field, [k]: v });
  return (
    <div className="field-row">
      <div className="input-stack">
        <label>Field Label</label>
        <input type="text" value={field.label} placeholder="e.g. Full Name"
          onChange={e => update("label", e.target.value)} />
      </div>
      <div className="input-stack">
        <label>Type</label>
        <select value={field.type} onChange={e => {
          const t = e.target.value;
          onChange({ ...field, type: t, options: t === "dropdown" ? (field.options || ["Option A","Option B"]) : field.options });
        }}>
          {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {field.type === "dropdown" && (
          <div className="options-area">
            <label>Options (one per line)</label>
            <textarea rows={3} value={(field.options||[]).join("\n")}
              onChange={e => update("options", e.target.value.split("\n"))}
              placeholder={"Option A\nOption B\nOption C"} />
          </div>
        )}
      </div>
      <div className="input-stack" style={{ paddingTop: 20 }}>
        <div className="checkbox-wrap">
          <input type="checkbox" id={`req-${field.id}`} checked={field.required}
            onChange={e => update("required", e.target.checked)} />
          <label htmlFor={`req-${field.id}`} style={{ margin: 0, color: "var(--text)", fontSize: "0.82rem" }}>Required</label>
        </div>
      </div>
      <div style={{ paddingTop: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={onRemove}>✕</button>
      </div>
    </div>
  );
}

function PreviewField({ field, value, onChange, autofilled, isMissing }) {
  const cls = autofilled ? "autofilled" : isMissing ? "missing-field" : "";
  const common = { className: cls, onChange: e => onChange(e.target.value) };
  return (
    <div className="preview-field">
      <label>
        {field.label || <em style={{ color: "var(--muted)" }}>Unnamed Field</em>}
        {field.required && <span className="required-star">*</span>}
        {isMissing && <span className="badge" style={{ color: "var(--warning)" }}>⚠ missing</span>}
        {autofilled && <span className="badge" style={{ color: "var(--accent3)" }}>✓ autofilled</span>}
      </label>
      {field.type === "text"     && <input type="text"   value={value||""} placeholder={field.label} {...common} />}
      {field.type === "textarea" && <textarea            value={value||""} placeholder={field.label} {...common} />}
      {field.type === "number"   && <input type="number" value={value||""} {...common} />}
      {field.type === "date"     && <input type="date"   value={value||""} {...common} />}
      {field.type === "dropdown" && (
        <select className={cls} value={value||""} onChange={e => onChange(e.target.value)}>
          <option value="">Select…</option>
          {(field.options||[]).map((o,i) => <option key={i} value={o}>{o}</option>)}
        </select>
      )}
      {field.type === "checkbox" && (
        <div className="checkbox-wrap" style={{ marginTop: 4 }}>
          <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />
          <span style={{ fontSize: "0.85rem" }}>Yes</span>
        </div>
      )}
    </div>
  );
}

export default function FormBuilderApp() {
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState([
    { id: uid(), label: "Full Name",     type: "text",   required: true  },
    { id: uid(), label: "Email Address", type: "text",   required: true  },
    { id: uid(), label: "Notes",         type: "textarea", required: false },
  ]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedB64, setUploadedB64]   = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState("");
  const [dragging, setDragging]         = useState(false);
  const [extracting, setExtracting]     = useState(false);
  const [extractLog, setExtractLog]     = useState("");
  const [extractError, setExtractError] = useState("");
  const [values, setValues]             = useState({});
  const [autofilled, setAutofilled]     = useState({});
  const [missingMap, setMissingMap]     = useState({});
  const [saved, setSaved]               = useState(false);
  const [toast, setToast]               = useState({ msg: "", type: "success" });
  const fileRef = useRef();

  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem("nia_api_key") || "" } catch { return "" }
  });
  const [rememberKey, setRememberKey] = useState(() => {
    try { return !!localStorage.getItem("nia_api_key") } catch { return false }
  });
  const [serverHasKey, setServerHasKey] = useState(false);
  const [showSavedRecords, setShowSavedRecords] = useState(false);
  const [savedRecords, setSavedRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  useEffect(() => {
    // Ask backend whether it already has a Nia API key configured.
    fetch("/config")
      .then(async (r) => {
        const contentType = r.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;
        const j = await r.json();
        if (j && j.nia_configured) setServerHasKey(true);
      })
      .catch(() => {});
  }, []);

  const persistFormData = (payload) => {
    try {
      localStorage.setItem("saved_form_data", JSON.stringify(payload));
    } catch (err) {
      console.warn("Failed to persist form data:", err);
    }
  };

  const saveFormToServer = async (payload) => {
    const response = await fetch("/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server response was not JSON: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data.detail || data.error || "Server save failed.");
    }

    return data;
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const loadSavedRecords = async () => {
    setShowSavedRecords(true);
    setLoadingRecords(true);
    setRecordsError("");

    try {
      const res = await fetch("/records");
      const contentType = res.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server response was not JSON: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to load saved records.");
      }

      setSavedRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecordsError(err.message || "Unable to load saved records.");
      setSavedRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const closeSavedRecords = () => {
    setShowSavedRecords(false);
    setRecordsError("");
  };

  const addField   = () => setFields(f => [...f, { id: uid(), label: "", type: "text", required: false }]);
  const updateField = (id, updated) => setFields(f => f.map(x => x.id === id ? updated : x));
  const removeField = (id) => setFields(f => f.filter(x => x.id !== id));

  const setValue = (id, v) => {
    setValues(prev => ({ ...prev, [id]: v }));
    if (v !== "" && v !== false && v !== null && v !== undefined) {
      setMissingMap(m => { const n = { ...m }; delete n[id]; return n; });
    }
  };

  const handleFile = useCallback((file) => {
    setUploadError("");
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf","png","jpg","jpeg"].includes(ext)) {
      setUploadError(`Unsupported file type ".${ext}". Please upload PDF, PNG, JPG, or JPEG.`);
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedB64(e.target.result.split(",")[1]);
      setUploadedFile(file);
      setUploading(false);
      showToast("✓ Document uploaded successfully");
    };
    reader.onerror = () => { setUploadError("Failed to read file."); setUploading(false); };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const extractWithAI = async () => {
    setExtracting(true);
    setExtractError("");
    setExtractLog("Reading document…");

    const schema = fields.map(f =>
      `- "${f.label}" (type: ${f.type}${f.required ? ", required" : ", optional"})`
    ).join("\n");

    const ext = uploadedFile.name.split(".").pop().toLowerCase();
    const mediaType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
    const isImage   = mediaType.startsWith("image/");

    const prompt = `You are an expert data extraction assistant.\n\nYour job is to read the document and extract values for the following form fields:\n\n${schema}\n\nRules:\n- Respond ONLY with a valid JSON object.\n- Keys must be the EXACT field labels listed above.\n- Values must be strings (or null if not found).\n- Do NOT include markdown, code fences, or any explanation.\n- If a value is not present in the document, set it to null.\n\nExample output format:\n{"Full Name": "John Doe", "Email Address": "john@example.com", "Notes": null}`;

    try {
      setExtractLog("Contacting extraction service…");

      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("fields", JSON.stringify(fields));
        // If user provided an API key in the UI (or saved one), include it.
        if (apiKey && apiKey.trim() !== "") formData.append("api_key", apiKey.trim());

      const res = await fetch("/extract", {
        method: "POST",
        body: formData
      });

      const contentType = res.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server response was not JSON: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.detail || data.error || JSON.stringify(data).slice(0, 200));
      }

      // Our backend returns the extracted JSON object directly
      const parsed = data;

      const newValues    = {};
      const newAutofilled = {};
      const newMissing   = {};

      fields.forEach(f => {
        let val = parsed[f.label];
        if (val === undefined) {
          const key = Object.keys(parsed).find(k => k.toLowerCase().trim() === f.label.toLowerCase().trim());
          val = key ? parsed[key] : undefined;
        }

        const hasValue = val !== null && val !== undefined && String(val).trim() !== "";
        if (hasValue) {
          newValues[f.id]     = String(val).trim();
          newAutofilled[f.id] = true;
        } else {
          newValues[f.id] = "";
          if (f.required) newMissing[f.id] = true;
        }
      });

      setValues(newValues);
      setAutofilled(newAutofilled);
      setMissingMap(newMissing);

      persistFormData({
        fields,
        values: newValues,
        autofilled: newAutofilled,
        missing: newMissing,
        fileName: uploadedFile?.name || null,
        extractedAt: new Date().toISOString(),
        rawParsed: parsed,
      });

      setExtracting(false);

      const filledN  = Object.values(newAutofilled).filter(Boolean).length;
      const missingN = Object.values(newMissing).filter(Boolean).length;
      showToast(`✓ Extracted ${filledN}/${fields.length} fields${missingN > 0 ? ` — ${missingN} need review` : ""}`);
      setStep(3);

    } catch (err) {
      setExtractError(err.message);
      setExtractLog("");
      setExtracting(false);
    }
  };

  const isFieldEmpty = (f) => {
    if (f.type === "checkbox") return false;
    const v = values[f.id];
    return v === undefined || v === null || String(v).trim() === "";
  };

  const currentMissingRequired = fields.filter(f => f.required && isFieldEmpty(f));
  const filledCount  = Object.values(autofilled).filter(Boolean).length;

  const handleSave = async () => {
    if (currentMissingRequired.length > 0) {
      const newM = {};
      currentMissingRequired.forEach(f => { newM[f.id] = true; });
      setMissingMap(prev => ({ ...prev, ...newM }));
      showToast(`⚠ ${currentMissingRequired.length} required field(s) still empty`, "warn");
      return;
    }

    const payload = {
      fields,
      values,
      autofilled,
      missing: missingMap,
      fileName: uploadedFile?.name || null,
      savedAt: new Date().toISOString(),
    };

    try {
      await saveFormToServer(payload);
      showToast("✓ Form saved to server successfully");
    } catch (err) {
      persistFormData(payload);
      showToast("⚠ Server save failed, saved locally instead.", "warn");
    }

    setSaved(true);
  };

  if (showSavedRecords) {
    return (
      <>
        <style>{CSS}</style>
        <div className="app">
          <div className="header">
            <div className="logo">⚡</div>
            <h1>Form<span>Forge</span> AI</h1>
            <button className="btn btn-secondary btn-sm" onClick={closeSavedRecords}>← Back</button>
          </div>
          <div className="card">
            <div className="card-title">📦 Saved Records</div>
            <div className="nav-strip" style={{ marginBottom: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
              <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{savedRecords.length} record{savedRecords.length === 1 ? "" : "s"}</span>
              <button className="btn btn-primary btn-sm" onClick={loadSavedRecords} disabled={loadingRecords}>{loadingRecords ? "Refreshing…" : "Refresh"}</button>
            </div>
            {recordsError && <div className="error-msg">{recordsError}</div>}
            {loadingRecords && <div className="empty"><div className="em-icon">⏳</div><p>Loading saved records…</p></div>}
            {!loadingRecords && savedRecords.length === 0 && !recordsError && (
              <div className="empty"><div className="em-icon">📭</div><p>No saved records found yet.</p></div>
            )}
            {!loadingRecords && savedRecords.length > 0 && (
              <div style={{ display: "grid", gap: 16 }}>
                {savedRecords.map((record) => (
                  <div key={record.id} className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{record.file_name || "Untitled form"}</div>
                        <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{new Date(record.saved_at).toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span className="summary-stat"><strong>{(record.fields || []).length}</strong> fields</span>
                        <span className="summary-stat"><strong>{Object.values(record.values || {}).filter(v => v !== "" && v !== null && v !== undefined).length}</strong> completed</span>
                      </div>
                    </div>
                    <div className="divider" />
                    {(record.fields || []).map((field) => (
                      <div key={field.id || field.label} className="schema-item">
                        <span style={{ color: "var(--muted)", width: 160, flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{field.label}</span>
                        <span style={{ flex: 1, wordBreak: "break-word" }}>
                          {field.type === "checkbox"
                            ? (record.values?.[field.id] ? "✓ Yes" : "No")
                            : (record.values?.[field.id] || <em style={{ color: "var(--muted)" }}>—</em>)}
                        </span>
                        {record.autofilled?.[field.id] && <span className="tag tag-success">AI</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  if (saved) {
    const totalFilled = fields.filter(f => values[f.id] !== "" && values[f.id] !== undefined).length;
    return (
      <>
        <style>{CSS}</style>
        <div className="app">
          <div className="header"><div className="logo">⚡</div><h1>Form<span>Forge</span> AI</h1></div>
          <div className="card saved-view">
            <div className="saved-icon">🎉</div>
            <h2>Form Saved Successfully!</h2>
            <p style={{ marginBottom: 24 }}>All data has been captured and saved.</p>
            <div className="summary-bar" style={{ justifyContent: "center", marginBottom: 28 }}>
              <div className="summary-stat"><span>{fields.length}</span>Fields</div>
              <div className="summary-stat"><span style={{ color: "var(--accent3)" }}>{filledCount}</span>Autofilled</div>
              <div className="summary-stat"><span style={{ color: "var(--accent)" }}>{totalFilled}</span>Completed</div>
            </div>

            <div style={{ textAlign: "left", marginBottom: 28 }}>
              {fields.map(f => (
                <div key={f.id} className="schema-item">
                  <span style={{ color: "var(--muted)", width: 160, flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{f.label}</span>
                  <span style={{ flex: 1, wordBreak: "break-word" }}>
                    {f.type === "checkbox"
                      ? (values[f.id] ? "✓ Yes" : "No")
                      : (values[f.id] || <em style={{ color: "var(--muted)" }}>—</em>)}
                  </span>
                  {autofilled[f.id] && <span className="tag tag-success">AI</span>}
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-lg" onClick={() => {
              setSaved(false); setStep(0);
              setFields([]); setUploadedFile(null); setUploadedB64(null);
              setValues({}); setAutofilled({}); setMissingMap({});
            }}>+ Build New Form</button>
            <button className="btn btn-secondary btn-lg" style={{ marginTop: 14 }} onClick={loadSavedRecords}>View Saved Records</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <div className="logo">⚡</div>
          <h1>Form<span>Forge</span> AI</h1>
          <button className="btn btn-secondary btn-sm" onClick={loadSavedRecords}>Saved Records</button>
        </div>

        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={i}
              className={`step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
              onClick={() => i < step && setStep(i)}>
              <div className="step-num">{i < step ? "✓" : i + 1}</div>
              {s}
            </div>
          ))}
        </div>

        {step === 0 && (
          <>
            <div className="preview-split">
              <div>
                <div className="card">
                  <div className="card-title">🛠 Form Builder <span className="tag tag-accent">{fields.length} fields</span></div>
                  {fields.length === 0 && <div className="empty"><div className="em-icon">📋</div><p>No fields yet. Add one below.</p></div>}
                  {fields.map(f => (
                    <FieldEditor key={f.id} field={f}
                      onChange={updated => updateField(f.id, updated)}
                      onRemove={() => removeField(f.id)} />
                  ))}
                  <button className="btn btn-secondary" onClick={addField}>+ Add Field</button>
                </div>
              </div>
              <div>
                <div className="card" style={{ position: "sticky", top: 16 }}>
                  <div className="card-title">👁 Live Preview <span className="tag tag-success">Live</span></div>
                  {fields.length === 0
                    ? <div className="empty"><div className="em-icon">📄</div><p>Preview appears here as you add fields.</p></div>
                    : fields.map(f => <PreviewField key={f.id} field={f} value="" onChange={() => {}} />)
                  }
                </div>
              </div>
            </div>
            <div className="nav-strip">
              <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{fields.filter(f=>f.required).length} required fields</span>
              <button className="btn btn-primary btn-lg"
                disabled={fields.length === 0 || fields.some(f => !f.label.trim())}
                onClick={() => setStep(1)}>Next: Upload Document →</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="card">
              <div className="card-title">📎 Upload Document</div>
              {!uploadedFile ? (
                <>
                  <div className={`dropzone ${dragging ? "dragging" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current.click()}>
                    <div className="drop-icon">📂</div>
                    <h3>Drop your document here</h3>
                    <p>or click to browse — PDF, PNG, JPG, JPEG supported</p>
                    <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg"
                      style={{ display: "none" }}
                      onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
                  </div>
                  {uploading && <p style={{ textAlign:"center", color:"var(--muted)", marginTop:12, fontSize:"0.85rem" }}>Reading file…</p>}
                  {uploadError && <div className="error-msg">⚠ {uploadError}</div>}
                </>
              ) : (
                <div className="file-chip">
                  <span className="file-icon">{uploadedFile.name.endsWith(".pdf") ? "📄" : "🖼"}</span>
                  <span className="file-name">{uploadedFile.name}</span>
                  <span className="file-size">{(uploadedFile.size/1024).toFixed(1)} KB</span>
                  <span className="tag tag-success">✓ Ready</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setUploadedFile(null); setUploadedB64(null); }}>Remove</button>
                </div>
              )}
            </div>
            <div className="nav-strip">
              <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary btn-lg" disabled={!uploadedFile} onClick={() => setStep(2)}>
                Next: Extract Data →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="card">
              <div className="card-title">🤖 AI Extraction <span className="tag tag-accent">Claude AI</span></div>
              {extracting ? (
                <div className="ai-loader">
                  <div className="ai-pulse">🤖</div>
                  <div className="ai-label">{extractLog}</div>
                  <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Analyzing your document…</p>
                </div>
              ) : (
                <>
                  <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: 20 }}>
                    Claude will read <strong style={{ color: "var(--text)" }}>{uploadedFile?.name}</strong> and autofill your {fields.length} form fields.
                  </p>
                  <div style={{ background: "var(--surface2)", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontFamily: "var(--font-mono)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fields to extract</div>
                    {fields.map(f => (
                      <div key={f.id} className="schema-item">
                        <span style={{ flex: 1 }}>{f.label || <em style={{ color: "var(--muted)" }}>Unnamed</em>}</span>
                        <span className="tag tag-accent">{f.type}</span>
                        {f.required && <span className="tag tag-danger">required</span>}
                      </div>
                    ))}
                  </div>
                              <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6 }}>
                      Extraction runs automatically on the backend. If a Nia API key is configured there, the app will use AI extraction; otherwise it falls back to local OCR.
                    </div>
                  </div>
                              {serverHasKey ? (
                                <div style={{ marginBottom: 12 }}>
                                  <div className="tag tag-success">Server-side Nia API key detected — AI extraction will use server key.</div>
                                </div>
                              ) : (
                                <div style={{ marginBottom: 12 }}>
                                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--muted)", marginBottom: 6 }}>Optional Nia API key (paste to use AI extraction)</label>
                                  <input type="password" value={apiKey} placeholder="Paste Nia API key here" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid var(--border)", marginBottom: 8 }} onChange={e => setApiKey(e.target.value)} />
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                      <input type="checkbox" checked={rememberKey} onChange={e => {
                                        const v = e.target.checked; setRememberKey(v);
                                        try {
                                          if (!v) { localStorage.removeItem("nia_api_key"); } else if (apiKey && apiKey.trim()) { localStorage.setItem("nia_api_key", apiKey.trim()); }
                                        } catch {}
                                      }} />
                                      <span style={{ color: "var(--muted)" }}>Remember key in this browser</span>
                                    </label>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { try { if (apiKey && apiKey.trim()) { localStorage.setItem("nia_api_key", apiKey.trim()); setRememberKey(true); showToast('✓ API key saved'); } } catch {} }}>Save</button>
                                  </div>
                                </div>
                              )}
                  {extractError && <div className="error-msg" style={{ marginBottom: 16 }}>❌ {extractError}<br/><small style={{ opacity: 0.7 }}>Try again or proceed to fill manually.</small></div>}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn btn-primary btn-lg" onClick={extractWithAI}>⚡ Run AI Extraction</button>
                    {extractError && (
                      <button className="btn btn-secondary" onClick={() => { setMissingMap({}); setValues({}); setAutofilled({}); setStep(3); }}>
                        Skip → Fill Manually
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            {!extracting && (
              <div className="nav-strip">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="summary-bar">
              <div className="summary-stat"><span>{fields.length}</span>Total Fields</div>
              <div className="summary-stat"><span style={{ color: "var(--accent3)" }}>{filledCount}</span>Autofilled</div>
              <div className="summary-stat"><span style={{ color: "var(--warning)" }}>{currentMissingRequired.length}</span>Required Missing</div>
              <div className="summary-stat"><span style={{ color: "var(--accent)" }}>{fields.filter(f=>f.required).length}</span>Required Total</div>
            </div>

            <div className="preview-split">
              <div>
                <div className="card">
                  <div className="card-title">
                    ✏️ Review & Edit
                    {currentMissingRequired.length > 0 && (
                      <span className="tag tag-warn">⚠ {currentMissingRequired.length} required empty</span>
                    )}
                    {currentMissingRequired.length === 0 && (
                      <span className="tag tag-success">✓ All required filled</span>
                    )}
                  </div>
                  {fields.map(f => (
                    <PreviewField
                      key={f.id}
                      field={f}
                      value={values[f.id]}
                      onChange={v => setValue(f.id, v)}
                      autofilled={autofilled[f.id]}
                      isMissing={!!missingMap[f.id]}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="card" style={{ position: "sticky", top: 16 }}>
                  <div className="card-title">📊 Extraction Report</div>
                  {fields.map(f => (
                    <div key={f.id} className="schema-item">
                      <span style={{ flex: 1, fontSize: "0.82rem" }}>{f.label}</span>
                      {autofilled[f.id]
                        ? <span className="tag tag-success">✓ filled</span>
                        : (f.required
                          ? <span className="tag tag-warn">⚠ empty</span>
                          : <span className="tag" style={{ background: "var(--surface2)", color: "var(--muted)", border: "1px solid var(--border)" }}>optional</span>)
                      }
                    </div>
                  ))}
                  <div className="divider"/>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.6 }}>
                    <span style={{ color: "var(--accent3)" }}>Green</span> = AI autofilled · <span style={{ color: "var(--warning)" }}>Yellow</span> = needs input
                  </p>
                </div>
              </div>
            </div>

            <div className="nav-strip">
              <button className="btn btn-secondary" onClick={() => setStep(0)}>← Rebuild Form</button>
              <button
                className="btn btn-success btn-lg"
                onClick={handleSave}
              >
                💾 Save Form {currentMissingRequired.length > 0 ? `(${currentMissingRequired.length} missing)` : ""}
              </button>
            </div>
          </>
        )}

        {toast.msg && (
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        )}
      </div>
    </>
  );
}
