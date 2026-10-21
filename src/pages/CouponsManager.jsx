import { useState, useEffect, useCallback } from "react";
import "./pages.css";

const API = import.meta.env.VITE_API_URL;
const getAdminHeaders = () => ({
  "Content-Type": "application/json",
  username: localStorage.getItem("admin_username") || "",
  password: localStorage.getItem("admin_password") || "",
});

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const BanIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
);

const TicketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const STATUS_STYLES = {
  active: { background: "#f0fdf4", color: "#16a34a", label: "Active" },
  expired: { background: "#fef2f2", color: "#dc2626", label: "Expired" },
  redeemed: { background: "#eef2ff", color: "#4f46e5", label: "Redeemed" },
  revoked: { background: "#fffbeb", color: "#d97706", label: "Revoked" },
};

const StatusPill = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.active;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "999px",
      fontSize: "0.75rem", fontWeight: 700, background: s.background, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

const formatDateFull = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
};

const formatRupees = (paise) => {
  if (paise === null || paise === undefined) return "—";
  const rupees = paise / 100;
  return `₹${Number.isInteger(rupees) ? rupees : rupees.toFixed(2)}`;
};

export default function CouponsManager() {
  const [notes, setNotes] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [created, setCreated] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCoupons = useCallback(async (overrides = {}) => {
    const nextSearch = overrides.search !== undefined ? overrides.search : search;
    const nextStatus = overrides.status !== undefined ? overrides.status : statusFilter;
    try {
      const params = new URLSearchParams();
      if (nextSearch.trim()) params.set("search", nextSearch.trim());
      if (nextStatus) params.set("status", nextStatus);
      const qs = params.toString();
      const res = await fetch(`${API}/api/paid-notes/admin/coupons${qs ? `?${qs}` : ""}`, {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) setCoupons(data.coupons || []);
      else setError(data.message || "Failed to load coupons.");
    } catch {
      setError("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/paid-notes/admin/list`, { headers: getAdminHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setNotes(data.configs || []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load paid notes.");
      });
    fetch(`${API}/api/paid-notes/admin/coupons`, { headers: getAdminHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) setCoupons(data.coupons || []);
        else setError(data.message || "Failed to load coupons.");
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load coupons.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRevoke = async (coupon) => {
    if (!confirm(`Revoke coupon "${coupon.code}" for ${coupon.recipientName}?`)) return;
    try {
      const res = await fetch(`${API}/api/paid-notes/admin/coupons/${coupon.id}/revoke`, {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Coupon revoked.");
        fetchCoupons();
      } else {
        setError(data.message || "Revoke failed.");
      }
    } catch {
      setError("Revoke failed.");
    }
  };

  const copyText = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("Copy failed. Please copy manually.");
    }
  };

  const buildCouponDetails = (coupon) =>
    [
      "NotesHub Coupon",
      "",
      `Code: ${coupon.code}`,
      `Recipient: ${coupon.recipientName} (${coupon.recipientEmail})${coupon.recipientPhone ? ` | Phone: ${coupon.recipientPhone}` : ""}`,
      `Note: ${coupon.noteTitle || coupon.noteKey}`,
      `Original price: ${formatRupees(coupon.currentPricePaise)}`,
      `Discount: ${coupon.discountPercent}% (${formatRupees(coupon.discountAmountPaise)} off)`,
      `Final price: ${formatRupees(coupon.finalPricePaise)}`,
      `Valid until: ${formatDateFull(coupon.expiresAt)}`,
    ].join("\n");

  return (
    <div className="panel-page panel-page--wide">
      <h2 className="panel-heading">Coupons</h2>
      <p className="panel-subheading">Create discount coupons for paid notes and manage their lifecycle</p>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem", gap: "8px" }}>
        <button className="icon-btn" onClick={fetchCoupons} title="Refresh"><RefreshIcon /></button>
        <button
          className="submit-btn"
          style={{ width: "auto", padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}
          onClick={() => { setShowForm((v) => !v); setCreated(null); setError(""); setSuccess(""); }}
        >
          <PlusIcon /> {showForm ? "Hide Form" : "Create Coupon"}
        </button>
      </div>

      {error && <p className="form-error" style={{ marginBottom: "1rem" }}>{error}</p>}
      {success && <p className="form-success" style={{ marginBottom: "1rem" }}>{success}</p>}

      {created && (
        <div className="upload-card" style={{ marginBottom: "1.5rem", border: "1px solid #bbf7d0", background: "#f0fdf4" }}>
          <p style={{ margin: "0 0 0.75rem", fontWeight: 800, color: "#15803d", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <TicketIcon /> Coupon created successfully
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <code style={{
              fontSize: "1.3rem", fontWeight: 800, letterSpacing: "2px", color: "#0f172a",
              background: "white", border: "1px dashed #86efac", padding: "0.5rem 1rem", borderRadius: "10px",
            }}>
              {created.coupon.code}
            </code>
            <button
              className="icon-btn"
              title="Copy code"
              onClick={() => copyText(created.coupon.code, `code-${created.coupon.id}`)}
            >
              <CopyIcon />
            </button>
            {copiedId === `code-${created.coupon.id}` && (
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#16a34a" }}>Copied!</span>
            )}
          </div>
          <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "#166534", lineHeight: 1.6 }}>
            {created.coupon.recipientName} · {created.coupon.recipientEmail} · {created.coupon.noteTitle} ·{" "}
            {formatRupees(created.preview.originalPricePaise)} − {created.preview.discountPercent}% = <strong>{formatRupees(created.preview.finalPricePaise)}</strong>
            {created.boundToAccount
              ? " · Linked to the registered account with this email."
              : " · No registered account found for this email - the code works for any signed-in user who has it."}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="submit-btn"
              style={{ width: "auto", padding: "0.55rem 1rem", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => copyText(buildCouponDetails(created.coupon), `details-${created.coupon.id}`)}
            >
              <CopyIcon /> {copiedId === `details-${created.coupon.id}` ? "Details Copied!" : "Copy Coupon Details"}
            </button>
            <button
              className="submit-btn"
              style={{ width: "auto", padding: "0.55rem 1rem", fontSize: "0.82rem", background: "#64748b" }}
              onClick={() => { setCreated(null); setShowForm(true); }}
            >
              Create Another
            </button>
          </div>
        </div>
      )}

      {showForm && !created && (
        <CouponForm
          notes={notes}
          onClose={() => setShowForm(false)}
          onCreated={(data) => { setCreated(data); setShowForm(false); setSuccess(""); fetchCoupons(); }}
          onError={(msg) => setError(msg)}
        />
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="form-input"
          style={{ maxWidth: "320px", margin: 0 }}
          placeholder="Search by code, name, email, or note"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchInput.trim() !== search) {
              setLoading(true);
              setSearch(searchInput);
              fetchCoupons({ search: searchInput });
            }
          }}
        />
        <select
          className="form-select"
          style={{ maxWidth: "180px", margin: 0 }}
          value={statusFilter}
          onChange={(e) => {
            setLoading(true);
            setStatusFilter(e.target.value);
            fetchCoupons({ status: e.target.value });
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="redeemed">Redeemed</option>
          <option value="revoked">Revoked</option>
        </select>
        <button
          className="submit-btn"
          style={{ width: "auto", padding: "0.6rem 1.2rem", fontSize: "0.875rem" }}
          onClick={() => {
            if (searchInput.trim() !== search) {
              setLoading(true);
              setSearch(searchInput);
              fetchCoupons({ search: searchInput });
            }
          }}
        >
          Search
        </button>
        <button
          className="icon-btn"
          title="Clear filters"
          onClick={() => {
            if (searchInput || search || statusFilter) {
              setLoading(true);
              setSearchInput("");
              setSearch("");
              setStatusFilter("");
              fetchCoupons({ search: "", status: "" });
            }
          }}
        >
          <RefreshIcon />
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Loading...</p>
      ) : coupons.length === 0 ? (
        <div className="empty-state">No coupons found. Create one above.</div>
      ) : (
        <div className="file-table-wrap">
          <table className="file-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Recipient</th>
                <th>Note</th>
                <th>Original</th>
                <th>Discount</th>
                <th>Final</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <code style={{ fontSize: "0.78rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                        {c.code}
                      </code>
                      <button className="icon-btn" title="Copy code" onClick={() => copyText(c.code, `row-${c.id}`)}>
                        <CopyIcon />
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {c.recipientName}
                    <div style={{ fontWeight: 400, color: "#64748b", fontSize: "0.78rem" }}>
                      {c.recipientEmail}
                      {c.boundToAccount && <span style={{ color: "#4f46e5", fontWeight: 700 }}> · linked</span>}
                    </div>
                    {c.recipientPhone && (
                      <div style={{ fontWeight: 400, color: "#64748b", fontSize: "0.78rem" }}>{c.recipientPhone}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{c.noteTitle || "-"}</div>
                    <code style={{ fontSize: "0.72rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{c.noteKey}</code>
                  </td>
                  <td>{formatRupees(c.currentPricePaise)}</td>
                  <td style={{ color: "#16a34a", fontWeight: 700 }}>
                    {c.discountPercent}% <span style={{ color: "#64748b", fontWeight: 400 }}>(−{formatRupees(c.discountAmountPaise)})</span>
                  </td>
                  <td style={{ fontWeight: 800 }}>{formatRupees(c.finalPricePaise)}</td>
                  <td style={{ color: "#64748b", fontSize: "0.82rem" }}>{formatDateFull(c.createdAt)}</td>
                  <td style={{ color: "#64748b", fontSize: "0.82rem" }}>{formatDateFull(c.expiresAt)}</td>
                  <td><StatusPill status={c.status} /></td>
                  <td>
                    {(c.status === "active" || c.status === "expired") && (
                      <button className="icon-btn icon-btn--danger" title="Revoke coupon" onClick={() => handleRevoke(c)}>
                        <BanIcon />
                      </button>
                    )}
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

function CouponForm({ notes, onClose, onCreated, onError }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [noteKey, setNoteKey] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [expiry, setExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  const enabledNotes = notes.filter((n) => n.isEnabled);
  const selectedNote = enabledNotes.find((n) => n.noteKey === noteKey) || null;

  const percent = Number(discountPercent);
  const validPercent = Number.isInteger(percent) && percent >= 1 && percent <= 50;
  const originalPricePaise = selectedNote ? selectedNote.price * 100 : null;
  const discountAmountPaise = validPercent && originalPricePaise != null ? Math.round((originalPricePaise * percent) / 100) : null;
  const finalPricePaise = validPercent && originalPricePaise != null ? Math.max(100, originalPricePaise - discountAmountPaise) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !noteKey) {
      onError("Recipient name, email, and a paid note are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      onError("Recipient email is not valid.");
      return;
    }
    if (!validPercent) {
      onError("Discount percentage must be a whole number between 1 and 50.");
      return;
    }
    const expiryDate = new Date(expiry);
    if (!expiry || Number.isNaN(expiryDate.getTime())) {
      onError("Please choose a valid expiry date and time.");
      return;
    }
    if (expiryDate.getTime() <= Date.now()) {
      onError("Expiry date and time must be in the future.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/paid-notes/admin/coupons`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          noteKey,
          discountPercent: percent,
          expiresAt: expiryDate.toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onCreated(data);
      } else {
        onError(data.message || "Failed to create coupon.");
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
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Create Coupon</h3>
        <button className="icon-btn" onClick={onClose} title="Cancel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          User Information
        </p>
        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label">User Name *</label>
            <input className="form-input" placeholder="Recipient's full name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">User Email *</label>
            <input className="form-input" type="email" placeholder="recipient@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Phone Number <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span></label>
          <input className="form-input" placeholder="e.g. +91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <p style={{ margin: "1rem 0 0.5rem", fontSize: "0.8rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Paid Note &amp; Discount
        </p>
        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label">Select Paid Note *</label>
            <select className="form-select" value={noteKey} onChange={(e) => setNoteKey(e.target.value)}>
              <option value="">-- Select a paid note --</option>
              {enabledNotes.map((n) => (
                <option key={n.noteKey} value={n.noteKey}>
                  {n.title} - ₹{n.price}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Discount Percentage * (1–50%)</label>
            <input
              className="form-input"
              type="number" min="1" max="50" step="1"
              placeholder="e.g. 25"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>
        </div>

        {selectedNote && validPercent && (
          <div className="upload-path-preview" style={{ marginBottom: "1rem", lineHeight: 1.8 }}>
            Original price: <strong>{formatRupees(originalPricePaise)}</strong>
            <br />
            Discount: <strong>{percent}%</strong> ({formatRupees(discountAmountPaise)})
            <br />
            Final price: <strong style={{ color: "#16a34a" }}>{formatRupees(finalPricePaise)}</strong>
          </div>
        )}
        {selectedNote && !validPercent && discountPercent !== "" && (
          <p className="form-error" style={{ marginBottom: "1rem" }}>Discount must be a whole number between 1 and 50.</p>
        )}

        <div className="form-field">
          <label className="form-label">Expiry Date &amp; Time *</label>
          <input
            className="form-input"
            type="datetime-local"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={saving} style={{ marginTop: "0.5rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <PlusIcon /> {saving ? "Generating..." : "Generate Coupon"}
          </span>
        </button>
      </form>
    </div>
  );
}
