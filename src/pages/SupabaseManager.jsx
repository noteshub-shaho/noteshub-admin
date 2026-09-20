import { useState, useEffect } from "react";
import "./pages.css";

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const FileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const getHeaders = () => ({
  username: localStorage.getItem("admin_username") || "",
  password: localStorage.getItem("admin_password") || "",
});

const DeleteModal = ({ name, onCancel, onConfirm }) => (
  <div className="modal-overlay">
    <div className="modal-card">
      <div className="modal-icon">
        <TrashIcon />
      </div>
      <h3 className="modal-title">Delete File</h3>
      <p className="modal-body">
        This will permanently remove <strong>{name}</strong>. This action cannot be undone.
      </p>
      <div className="modal-actions">
        <button onClick={onCancel} className="modal-btn modal-btn--cancel">Cancel</button>
        <button onClick={onConfirm} className="modal-btn modal-btn--confirm">Yes, Delete</button>
      </div>
    </div>
  </div>
);

const SupabaseManager = () => {
  const [folderPath, setFolderPath] = useState("");
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [folderModal, setFolderModal] = useState(null);
  const [folderInput, setFolderInput] = useState("");
  const [folderLoading, setFolderLoading] = useState(false);
  const [folderError, setFolderError] = useState("");

  const fetchContents = async (path) => {
    setLoading(true);
    try {
      const params = path ? `?folder=${encodeURIComponent(path)}` : "";
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/supabase/files${params}`, { headers: getHeaders() });  
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders || []);
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContents(folderPath); }, [folderPath]);

  const openFolder = (name) => {
    const newPath = folderPath ? `${folderPath}/${name}` : name;
    setFolderPath(newPath);
    setBreadcrumb((prev) => [...prev, name]);
  };

  const goBack = () => {
    const newCrumb = [...breadcrumb];
    newCrumb.pop();
    setBreadcrumb(newCrumb);
    setFolderPath(newCrumb.join("/"));
  };

  const goToIndex = (index) => {
    const newCrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newCrumb);
    setFolderPath(newCrumb.join("/"));
  };

  const handleDelete = (filePath, name) => setConfirmDelete({ filePath, name });

  const confirmDeleteAction = async () => {
    const { filePath } = confirmDelete;
    setConfirmDelete(null);
    setDeleting(filePath);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/supabase/file`, {
        method: "DELETE",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath }),
      });
      const data = await res.json();
      if (data.success) setFiles((prev) => prev.filter((f) => f.path !== filePath));
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (url, name) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    if (!folderPath) { setUploadError("Navigate into a folder first before uploading"); return; }
    setUploading(true);
    setUploadError("");
    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("folder", folderPath);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/upload`, {
        method: "POST",
        headers: getHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadResult(data);
        setUploadFile(null);
        fetchContents(folderPath);
      } else {
        setUploadError(data.message);
      }
    } catch {
      setUploadError("Upload failed. Check connection.");
    } finally {
      setUploading(false);
    }
  };

  const openFolderModal = (type, name = "") => {
    setFolderInput(type === "rename" ? name : "");
    setFolderError("");
    setFolderModal({ type, name });
  };

  const handleFolderAction = async () => {
    const trimmed = folderInput.trim();
    if ((folderModal.type === "create" || folderModal.type === "rename") && !trimmed) {
      setFolderError("Folder name cannot be empty");
      return;
    }
    setFolderLoading(true);
    setFolderError("");
    try {
      if (folderModal.type === "create") {
        const newPath = folderPath ? `${folderPath}/${trimmed}` : trimmed;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/supabase/folder`, {
          method: "POST",
          headers: { ...getHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ path: newPath }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      } else if (folderModal.type === "rename") {
        const oldPath = folderPath ? `${folderPath}/${folderModal.name}` : folderModal.name;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/supabase/folder`, {
          method: "PUT",
          headers: { ...getHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ oldPath, newName: trimmed }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      } else if (folderModal.type === "delete") {
        const targetPath = folderPath ? `${folderPath}/${folderModal.name}` : folderModal.name;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/supabase/folder`, {
          method: "DELETE",
          headers: { ...getHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ path: targetPath }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      }
      setFolderModal(null);
      fetchContents(folderPath);
    } catch (e) {
      setFolderError(e.message || "Action failed");
    } finally {
      setFolderLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Supabase Files</h2>
        <p className="page-subtitle">Browse, preview, download and delete files stored in Supabase</p>
      </div>

      <div className="inline-upload-card">
        <div className="inline-upload-field">
          <p className="inline-upload-path">
            Upload to: <span className="sky">notes/{folderPath || "— navigate to a folder"}</span>
          </p>
          <label className="inline-file-label">
            <UploadIcon />
            <span className={uploadFile ? "selected" : ""}>{uploadFile ? uploadFile.name : "Select PDF to upload"}</span>
            <input type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => { setUploadFile(e.target.files[0]); setUploadResult(null); setUploadError(""); }} />
          </label>
        </div>
        <button onClick={handleUpload} disabled={uploading || !uploadFile} className="inline-upload-btn inline-upload-btn--sky">
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {uploadError && <p className="inline-upload-error">{uploadError}</p>}
        {uploadResult && <p className="inline-upload-success">Uploaded via {uploadResult.provider}</p>}
      </div>

      <div className="breadcrumb">
        <button onClick={() => { setFolderPath(""); setBreadcrumb([]); }} className={`breadcrumb__btn ${breadcrumb.length === 0 ? "breadcrumb__btn--active" : "breadcrumb__btn--sky"}`}>
          notes
        </button>
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="breadcrumb__item">
            <span className="breadcrumb__sep">/</span>
            <button onClick={() => goToIndex(i)} className={`breadcrumb__btn ${i === breadcrumb.length - 1 ? "breadcrumb__btn--active" : "breadcrumb__btn--sky"}`}>
              {crumb}
            </button>
          </span>
        ))}
      </div>

   {breadcrumb.length > 0 && (
        <button onClick={goBack} className="back-btn back-btn--sky">
          <BackIcon /> Back
        </button>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button onClick={() => openFolderModal("create")} className="create-folder-btn create-folder-btn--sky">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Folder
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : (
        <>
          {folders.length > 0 && (
            <div className="folders-section">
              <p className="section-label">Folders</p>
              <div className="folders-grid">
            {folders.map((f) => (
                  <div key={f} className="folder-btn-row">
                    <button onClick={() => openFolder(f)} className="folder-btn">
                      <span className="folder-btn__icon"><FolderIcon /></span>
                      {f}
                    </button>
                    <div className="folder-actions">
                      <button onClick={() => openFolderModal("rename", f)} className="folder-action-btn folder-action-btn--rename" title="Rename">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => openFolderModal("delete", f)} className="folder-action-btn folder-action-btn--delete" title="Delete">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="files-section">
              <p className="section-label">Files ({files.length})</p>
              <div className="files-grid">
                {files.map((file) => (
                  <div key={file.path} className="file-card">
                    <div className="file-card__info">
                      <FileIcon />
                      <div className="file-card__meta">
                        <p className="file-card__name">{file.name}</p>
                        {file.size > 0 && <p className="file-card__size">{formatSize(file.size)}</p>}
                      </div>
                    </div>
                    <div className="file-card__actions">
                      <button onClick={() => setPreview(file)} className="action-btn action-btn--preview-sky"><EyeIcon /></button>
                      <button onClick={() => handleDownload(file.url, file.name)} className="action-btn action-btn--download"><DownloadIcon /></button>
                      <button onClick={() => handleDelete(file.path, file.name)} disabled={deleting === file.path} className="action-btn action-btn--delete">
                        {deleting === file.path ? "..." : <TrashIcon />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {folders.length === 0 && files.length === 0 && (
            <div className="empty-state">No files or folders found</div>
          )}
        </>
      )}

 {folderModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            {folderModal.type === "delete" ? (
              <>
                <div className="modal-icon"><TrashIcon /></div>
                <h3 className="modal-title">Delete Folder</h3>
                <p className="modal-body">
                  This will permanently delete <strong>{folderModal.name}</strong> and all files inside it. This cannot be undone.
                </p>
              </>
            ) : (
              <>
                <h3 className="modal-title">{folderModal.type === "create" ? "New Folder" : "Rename Folder"}</h3>
                <input
                  className="folder-input"
                  placeholder="Folder name"
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFolderAction()}
                  autoFocus
                />
              </>
            )}
            {folderError && <p className="inline-upload-error" style={{ marginTop: "0.5rem" }}>{folderError}</p>}
            <div className="modal-actions">
              <button onClick={() => setFolderModal(null)} className="modal-btn modal-btn--cancel">Cancel</button>
             <button onClick={handleFolderAction} disabled={folderLoading} className={`modal-btn modal-btn--confirm${folderModal.type === "delete" ? " danger" : ""}`}>
                {folderLoading ? "..." : folderModal.type === "create" ? "Create" : folderModal.type === "rename" ? "Rename" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <DeleteModal name={confirmDelete.name} onCancel={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction} />
      )}

      {preview && (
        <div className="preview-overlay">
          <div className="preview-card">
            <div className="preview-header">
              <p className="preview-header__name">{preview.name}</p>
              <div className="preview-header__controls">
                <button onClick={() => handleDownload(preview.url, preview.name)} className="preview-download-btn">
                  <DownloadIcon /> Download
                </button>
                <button onClick={() => setPreview(null)} className="preview-close-btn">✕</button>
              </div>
            </div>
            <iframe src={preview.url} className="preview-iframe" title={preview.name} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseManager;
