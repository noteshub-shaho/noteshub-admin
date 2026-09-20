import { useState } from "react";
import "./pages.css";

const UNIVERSITIES = ["msbte", "mu"];
const SEMESTERS = ["sem1", "sem2", "sem3", "sem4", "sem5", "sem6"];

const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const AdminPanel = () => {
  const [university, setUniversity] = useState("msbte");
  const [semester, setSemester] = useState("sem1");
  const [subject, setSubject] = useState("");
  const [subSubject, setSubSubject] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const buildFolder = () => {
    const parts = [university, semester, subject.trim()];
    if (subSubject.trim()) parts.push(subSubject.trim());
    return parts.join("/");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !subject.trim()) {
      setError("Subject and file are required");
      return;
    }
    setError("");
    setResult(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", buildFolder());

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/upload`, {
        method: "POST",
        headers: {
          username: localStorage.getItem("admin_username") || "",
          password: localStorage.getItem("admin_password") || "",
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setFile(null);
        e.target.reset();
        setSubject("");
        setSubSubject("");
      } else {
        setError(data.message);
      }
    } catch {
      setError("Upload failed. Check connection.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="panel-page">
      <h2 className="panel-heading">Upload Notes</h2>
      <p className="panel-subheading">Add a new PDF to Cloudinary or Supabase storage</p>

      <div className="upload-card">
        <form onSubmit={handleUpload}>
          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-label">University</label>
              <select className="form-select" value={university} onChange={(e) => setUniversity(e.target.value)}>
                {UNIVERSITIES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Semester</label>
              <select className="form-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
                {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Subject</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. microproject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Sub-Subject <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(optional)</span></label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. important-questions"
              value={subSubject}
              onChange={(e) => setSubSubject(e.target.value)}
            />
          </div>

          <label className={`file-drop-zone${file ? " file-drop-zone--active" : ""}`}>
            <div className="file-drop-inner">
              <UploadIcon />
              {file
                ? <span className="has-file">{file.name}</span>
                : <span>Click to select PDF</span>
              }
              {!file && <span style={{ fontSize: "0.76rem" }}>PDF files only</span>}
            </div>
            <input
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => { setFile(e.target.files[0]); setResult(null); }}
            />
          </label>

          <div className="upload-path-preview">
            Path: <strong>noteshub/{buildFolder()}</strong>
          </div>

          {error && <p className="form-error">{error}</p>}

          {result && (
            <div className="upload-success">
              <div className="upload-success-title">
                <CheckIcon /> Uploaded via {result.provider}
              </div>
              <a href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={uploading}>
            <UploadIcon />
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;