import { useState, useEffect } from "react";
import "./pages.css";

const API = import.meta.env.VITE_API_URL;
const getAdminHeaders = () => ({
  "Content-Type": "application/json",
  username: localStorage.getItem("admin_username") || "",
  password: localStorage.getItem("admin_password") || "",
});

const UNIVERSITIES = ["mu", "msbte"];
const SEMESTERS = ["sem1", "sem2", "sem3", "sem4", "sem5", "sem6"];

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const TABS = ["Paid Notes", "Purchases", "Device Reset"];

export default function PaidNotesManager() {
  const [tab, setTab] = useState("Paid Notes");

  return (
    <div className="panel-page panel-page--wide">
      <h2 className="panel-heading">Paid Notes Manager</h2>
      <p className="panel-subheading">Configure paid notes, view purchases, and manage device access</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "tab-btn tab-btn--active" : "tab-btn"}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Paid Notes" && <PaidNotesList />}
      {tab === "Purchases" && <PurchasesList />}
      {tab === "Device Reset" && <DeviceReset />}
    </div>
  );
}

function PaidNotesList() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/paid-notes/admin/list`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) setConfigs(data.configs);
    } catch {
      setError("Failed to load configs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleDelete = async (noteKey) => {
    if (!confirm(`Delete config for "${noteKey}"? This will remove all entitlements.`)) return;
    try {
      const res = await fetch(`${API}/api/paid-notes/admin/delete/${encodeURIComponent(noteKey)}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Deleted successfully.");
        fetchConfigs();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Delete failed.");
    }
  };

  const handleToggle = async (config) => {
    try {
      const res = await fetch(`${API}/api/paid-notes/admin/update/${encodeURIComponent(config.noteKey)}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({ isEnabled: !config.isEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`${config.isEnabled ? "Disabled" : "Enabled"} successfully.`);
        fetchConfigs();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Toggle failed.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem", gap: "8px" }}>
        <button className="icon-btn" onClick={fetchConfigs} title="Refresh"><RefreshIcon /></button>
        <button className="submit-btn" style={{ width: "auto", padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}
          onClick={() => { setEditTarget(null); setShowForm(true); setError(""); setSuccess(""); }}>
          <PlusIcon /> Add Paid Note
        </button>
      </div>

      {error && <p className="form-error" style={{ marginBottom: "1rem" }}>{error}</p>}
      {success && <p className="form-success" style={{ marginBottom: "1rem" }}>{success}</p>}

      {showForm && (
        <PaidNoteForm
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={() => { setShowForm(false); setEditTarget(null); fetchConfigs(); setSuccess("Saved successfully."); }}
          onError={(msg) => setError(msg)}
        />
      )}

      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Loading...</p>
      ) : configs.length === 0 ? (
        <div className="empty-state">No paid note configs yet. Add one above.</div>
      ) : (
        <div className="file-table-wrap">
          <table className="file-table">
            <thead>
              <tr>
                <th>Note Key</th>
                <th>Title</th>
                <th>Price</th>
                <th>Status</th>
                <th>Purchases</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.noteKey}>
                  <td><code style={{ fontSize: "0.78rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{c.noteKey}</code></td>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td>₹{c.price}</td>
                  <td>
                    <span style={{
                      padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
                      background: c.isEnabled ? "#f0fdf4" : "#fef2f2",
                      color: c.isEnabled ? "#16a34a" : "#dc2626",
                    }}>
                      {c.isEnabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ color: "#64748b" }}>{c._count?.entitlements ?? 0} buyers / {c._count?.purchaseOrders ?? 0} orders</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button className="icon-btn" title="Edit" onClick={() => { setEditTarget(c); setShowForm(true); setError(""); setSuccess(""); }}><EditIcon /></button>
                      <button className="icon-btn" title={c.isEnabled ? "Disable" : "Enable"} onClick={() => handleToggle(c)}>
                        {c.isEnabled ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                      <button className="icon-btn icon-btn--danger" title="Delete" onClick={() => handleDelete(c.noteKey)}><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaidNoteForm({ initial, onClose, onSaved, onError }) {
  const isEdit = !!initial;

  const [university, setUniversity] = useState(() => {
    if (initial?.noteKey) return initial.noteKey.split("/")[0];
    return "mu";
  });
  const [semester, setSemester] = useState(() => {
    if (initial?.noteKey) return initial.noteKey.split("/")[1] || "sem4";
    return "sem4";
  });
  const [subject, setSubject] = useState(() => {
    if (initial?.noteKey) return initial.noteKey.split("/")[2] || "";
    return "";
  });
  const [subSubject, setSubSubject] = useState(() => {
    if (initial?.noteKey) return initial.noteKey.split("/")[3] || "";
    return "";
  });
  const [title, setTitle] = useState(initial?.title || "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [isEnabled, setIsEnabled] = useState(initial?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);

  const buildNoteKey = () => {
    const parts = [university, semester, subject.trim()];
    if (subSubject.trim()) parts.push(subSubject.trim());
    return parts.join("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !title.trim() || price === "") {
      onError("Subject, title, and price are required.");
      return;
    }
    const parsedPrice = Number(price);
    if (!Number.isInteger(parsedPrice) || parsedPrice < 1) {
      onError("Price must be a positive whole number (INR).");
      return;
    }

    setSaving(true);
    try {
      const noteKey = buildNoteKey();
      const body = { title: title.trim(), price: parsedPrice, isEnabled };
      if (!isEdit) body.noteKey = noteKey;

      const url = isEdit
        ? `${API}/api/paid-notes/admin/update/${encodeURIComponent(initial.noteKey)}`
        : `${API}/api/paid-notes/admin/create`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, { method, headers: getAdminHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        onError(data.message || "Save failed.");
      }
    } catch {
      onError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="upload-card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
          {isEdit ? "Edit Paid Note" : "Add Paid Note"}
        </h3>
        <button className="icon-btn" onClick={onClose} title="Cancel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {!isEdit && (
          <>
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

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label">Subject</label>
                <input className="form-input" placeholder="e.g. important-answers" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Sub-Subject <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span></label>
                <input className="form-input" placeholder="e.g. dbms" value={subSubject} onChange={(e) => setSubSubject(e.target.value)} />
              </div>
            </div>

            <div className="upload-path-preview" style={{ marginBottom: "1rem" }}>
              Note Key: <strong>{buildNoteKey()}</strong>
            </div>
          </>
        )}

        {isEdit && (
          <div className="upload-path-preview" style={{ marginBottom: "1rem" }}>
            Note Key: <strong>{initial.noteKey}</strong> <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>(cannot change)</span>
          </div>
        )}

        <div className="form-field">
          <label className="form-label">Display Title</label>
          <input className="form-input" placeholder="e.g. MU Sem 4 Important Answers" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label">Price (₹ INR, whole number)</label>
            <input className="form-input" type="number" min="1" step="1" placeholder="e.g. 49" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-select" value={isEnabled ? "enabled" : "disabled"} onChange={(e) => setIsEnabled(e.target.value === "enabled")}>
              <option value="enabled">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={saving} style={{ marginTop: "0.5rem" }}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Paid Note"}
        </button>
      </form>
    </div>
  );
}

function PurchasesList() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterKey, setFilterKey] = useState("");
  const [error, setError] = useState("");

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const url = filterKey.trim()
        ? `${API}/api/paid-notes/admin/purchases?noteKey=${encodeURIComponent(filterKey.trim())}`
        : `${API}/api/paid-notes/admin/purchases`;
      const res = await fetch(url, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) setPurchases(data.purchases);
      else setError(data.message);
    } catch {
      setError("Failed to load purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPurchases(); }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="form-input"
          style={{ maxWidth: "320px", margin: 0 }}
          placeholder="Filter by noteKey (optional)"
          value={filterKey}
          onChange={(e) => setFilterKey(e.target.value)}
        />
        <button className="submit-btn" style={{ width: "auto", padding: "0.6rem 1.2rem", fontSize: "0.875rem" }} onClick={fetchPurchases}>
          Filter
        </button>
        <button className="icon-btn" onClick={() => { setFilterKey(""); fetchPurchases(); }} title="Clear"><RefreshIcon /></button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Loading...</p>
      ) : purchases.length === 0 ? (
        <div className="empty-state">No purchases found.</div>
      ) : (
        <div className="file-table-wrap">
          <table className="file-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Note Key</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.user?.username || "—"}</td>
                  <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{p.user?.email || "—"}</td>
                  <td><code style={{ fontSize: "0.78rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{p.noteKey}</code></td>
                  <td>₹{p.amount / 100}</td>
                  <td>
                    <span style={{
                      padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
                      background: p.status === "captured" ? "#f0fdf4" : p.status === "created" ? "#fffbeb" : "#fef2f2",
                      color: p.status === "captured" ? "#16a34a" : p.status === "created" ? "#d97706" : "#dc2626",
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.82rem" }}>{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeviceReset() {
  const [userId, setUserId] = useState("");
  const [noteKey, setNoteKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !noteKey.trim()) {
      setError("Both User ID and Note Key are required.");
      return;
    }
    if (!confirm(`Reset device for user "${userId.trim()}" on note "${noteKey.trim()}"?`)) return;

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API}/api/paid-notes/admin/reset-device`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ userId: userId.trim(), noteKey: noteKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Device reset. User can re-register on next access.");
        setUserId("");
        setNoteKey("");
      } else {
        setError(data.message || "Reset failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="upload-card" style={{ maxWidth: "500px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UsersIcon />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>Reset User Device</p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>Clears registered device so user can re-register</p>
          </div>
        </div>

        <form onSubmit={handleReset}>
          <div className="form-field">
            <label className="form-label">User ID</label>
            <input className="form-input" placeholder="cuid from database" value={userId} onChange={(e) => setUserId(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Note Key</label>
            <input className="form-input" placeholder="e.g. mu/sem4/important-answers" value={noteKey} onChange={(e) => setNoteKey(e.target.value)} />
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <button type="submit" className="submit-btn" disabled={loading} style={{ background: "#dc2626" }}>
            {loading ? "Resetting..." : "Reset Device"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: "1.5rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "1rem 1.25rem" }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#92400e", fontWeight: 600 }}>How to find User ID</p>
        <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#92400e", lineHeight: 1.6 }}>
          User ID can be found in the Purchases tab — check the browser console or ask the user to share their account email, then look up the ID from purchase records.
        </p>
      </div>
    </div>
  );
}