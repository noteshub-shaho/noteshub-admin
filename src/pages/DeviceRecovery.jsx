import { useState, useEffect, useCallback } from "react";
import "./pages.css";

const API = import.meta.env.VITE_API_URL;
const getAdminHeaders = () => ({
  "Content-Type": "application/json",
  username: localStorage.getItem("admin_username") || "",
  password: localStorage.getItem("admin_password") || "",
});

const NA = "Not available";
const STATUS_TABS = ["All", "Pending", "Approved", "Rejected"];
const STATUS_VALUE = { Pending: "PENDING", Approved: "APPROVED", Rejected: "REJECTED" };
const SORT_OPTIONS = [
  { value: "createdAt", label: "Submitted" },
  { value: "status", label: "Status" },
  { value: "resolvedAt", label: "Resolved" },
];
const PAGE_SIZE = 25;

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const fmtDateTime = (value) => {
  if (!value) return NA;
  try {
    return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return NA;
  }
};

const fmtPrice = (paise) => (typeof paise === "number" ? `₹${paise / 100}` : NA);

const StatusBadge = ({ status }) => {
  const palette = {
    PENDING: { background: "#fffbeb", color: "#d97706" },
    APPROVED: { background: "#f0fdf4", color: "#16a34a" },
    REJECTED: { background: "#fef2f2", color: "#dc2626" },
  };
  const label = status === "PENDING" ? "Pending" : status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : status || NA;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "999px",
      fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
      ...(palette[status] || { background: "#f1f5f9", color: "#475569" }),
    }}>
      {label}
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const good = status === "captured";
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "999px",
      fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
      background: good ? "#f0fdf4" : "#fef2f2",
      color: good ? "#16a34a" : "#dc2626",
    }}>
      {status || NA}
    </span>
  );
};

const deviceLabel = (device) => {
  if (!device) return NA;
  const browser = device.browserName
    ? `${device.browserName}${device.browserVersion ? ` ${device.browserVersion}` : ""}`
    : null;
  const os = device.osName
    ? `${device.osName}${device.osVersion ? ` ${device.osVersion}` : ""}`
    : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || NA;
};

const sourceSuffix = (source) =>
  source === "client-hints" ? " (via Client Hints)" : source === "user-agent" ? " (via User-Agent)" : "";

const osVersionValue = (device) =>
  device?.osVersion ? `${device.osVersion}${sourceSuffix(device.osVersionSource)}` : null;

const deviceModelValue = (device) =>
  device?.deviceModel ? `${device.deviceModel}${sourceSuffix(device.deviceModelSource)}` : null;

const Field = ({ label, value, mono }) => (
  <div style={{ marginBottom: "0.7rem" }}>
    <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label}
    </p>
    <p style={{
      margin: "3px 0 0",
      fontSize: mono ? "0.8rem" : "0.875rem",
      color: "#0f172a",
      fontWeight: 500,
      wordBreak: "break-word",
      fontFamily: mono ? "monospace" : "inherit",
    }}>
      {value === null || value === undefined || value === "" ? NA : value}
    </p>
  </div>
);

const SectionCard = ({ title, children, tint = "#ffffff" }) => (
  <div style={{
    background: tint, border: "1px solid #e2e8f0", borderRadius: "14px",
    padding: "1.1rem 1.25rem", marginBottom: "1rem",
  }}>
    <p style={{
      margin: "0 0 0.9rem", fontSize: "0.8rem", fontWeight: 800, color: "#0f172a",
      textTransform: "uppercase", letterSpacing: "0.6px",
    }}>
      {title}
    </p>
    {children}
  </div>
);

const Grid2 = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 1.25rem" }}>
    {children}
  </div>
);

export default function DeviceRecovery() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const fetchRequests = useCallback(() => {
    const params = new URLSearchParams();
    if (statusTab !== "All") params.set("status", STATUS_VALUE[statusTab]);
    if (search.trim()) params.set("q", search.trim());
    params.set("sort", sort);
    params.set("order", order);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    return fetch(`${API}/api/paid-notes/admin/recovery?${params.toString()}`, {
      headers: getAdminHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRequests(data.requests);
          setTotal(data.total);
          setError("");
        } else {
          setError(data.message || "Failed to load recovery requests.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load recovery requests.");
        setLoading(false);
      });
  }, [statusTab, search, sort, order, page]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyStatus = (tab) => { setLoading(true); setStatusTab(tab); setPage(1); };

  return (
    <div className="panel-page panel-page--wide">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 className="panel-heading">Device Recovery Requests</h2>
          <p className="panel-subheading">Review purchase and device history before approving or rejecting device recovery requests</p>
        </div>
        <button className="icon-btn" onClick={() => { setLoading(true); fetchRequests(); }} title="Refresh"><RefreshIcon /></button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => applyStatus(tab)}
            className={statusTab === tab ? "tab-btn tab-btn--active" : "tab-btn"}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="form-input"
          style={{ maxWidth: "330px", margin: 0 }}
          placeholder="Search by user, email, note or request ID"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") { setLoading(true); setSearch(searchInput); setPage(1); }
          }}
        />
        <button
          className="submit-btn"
          style={{ width: "auto", padding: "0.6rem 1.2rem", fontSize: "0.875rem" }}
          onClick={() => { setLoading(true); setSearch(searchInput); setPage(1); }}
        >
          Search
        </button>
        {search && (
          <button
            className="icon-btn"
            title="Clear search"
            onClick={() => { setLoading(true); setSearchInput(""); setSearch(""); setPage(1); }}
          >
            <XIcon />
          </button>
        )}

        <select
          className="form-select"
          style={{ maxWidth: "170px", margin: 0 }}
          value={sort}
          onChange={(event) => { setLoading(true); setSort(event.target.value); }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>Sort: {option.label}</option>
          ))}
        </select>
        <button
          className="tab-btn"
          onClick={() => { setLoading(true); setOrder(order === "asc" ? "desc" : "asc"); }}
          title="Toggle sort order"
        >
          {order === "asc" ? "Ascending" : "Descending"}
        </button>
      </div>

      {error && <p className="form-error" style={{ marginBottom: "1rem" }}>{error}</p>}

      {loading ? (
        <div className="loading-state">Loading recovery requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">No recovery requests found.</div>
      ) : (
        <div className="file-table-wrap">
          <table className="file-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>User</th>
                <th>Email</th>
                <th>Paid Note</th>
                <th>Purchase Date</th>
                <th>Payment</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Current Device</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <code style={{ fontSize: "0.72rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                      {request.id.slice(0, 10)}…
                    </code>
                  </td>
                  <td style={{ fontWeight: 600 }}>{request.user?.username || NA}</td>
                  <td style={{ color: "#64748b", fontSize: "0.82rem" }}>{request.user?.email || NA}</td>
                  <td style={{ fontWeight: 600 }}>{request.note?.title || <code style={{ fontSize: "0.72rem" }}>{request.noteKey}</code>}</td>
                  <td style={{ color: "#64748b", fontSize: "0.8rem" }}>{fmtDateTime(request.purchase?.createdAt)}</td>
                  <td><PaymentBadge status={request.purchase?.status} /></td>
                  <td style={{ color: "#64748b", fontSize: "0.8rem" }}>{fmtDateTime(request.createdAt)}</td>
                  <td><StatusBadge status={request.status} /></td>
                  <td style={{ color: "#64748b", fontSize: "0.8rem" }}>{deviceLabel(request)}</td>
                  <td>
                    <button className="icon-btn" title="View details" onClick={() => setSelectedId(request.id)}>
                      <EyeIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "1rem", justifyContent: "flex-end" }}>
          <button className="tab-btn" disabled={page <= 1} onClick={() => { setLoading(true); setPage(page - 1); }} style={{ opacity: page <= 1 ? 0.5 : 1 }}>
            Previous
          </button>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Page {page} of {totalPages}</span>
          <button className="tab-btn" disabled={page >= totalPages} onClick={() => { setLoading(true); setPage(page + 1); }} style={{ opacity: page >= totalPages ? 0.5 : 1 }}>
            Next
          </button>
        </div>
      )}

      {selectedId && (
        <RecoveryDetail
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
          onDecided={() => { fetchRequests(); }}
        />
      )}
    </div>
  );
}

function RecoveryDetail({ requestId, onClose, onDecided }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchDetail = useCallback(() => {
    return fetch(`${API}/api/paid-notes/admin/recovery/${requestId}`, { headers: getAdminHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDetail(data);
          setError("");
        } else {
          setError(data.message || "Failed to load request.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load request.");
        setLoading(false);
      });
  }, [requestId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleApprove = async () => {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch(`${API}/api/paid-notes/admin/recovery/${requestId}/approve`, {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setNotice(
          data.emailSent
            ? "Approved. The current device was reauthorized and the user was notified by email."
            : "Approved and the current device was reauthorized. The notification email failed and can be retried below."
        );
        setShowApprove(false);
        await fetchDetail();
        onDecided();
      } else {
        setNotice(data.message || "Approval failed.");
        setShowApprove(false);
        await fetchDetail();
      }
    } catch {
      setNotice("Network error while approving.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (reason) => {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch(`${API}/api/paid-notes/admin/recovery/${requestId}/reject`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice(
          data.emailSent
            ? "Rejected and the user was notified by email."
            : "Rejected and the decision was saved. The notification email failed and can be retried below."
        );
        setShowReject(false);
        await fetchDetail();
        onDecided();
      } else {
        setNotice(data.message || "Rejection failed.");
      }
    } catch {
      setNotice("Network error while rejecting.");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch(`${API}/api/paid-notes/admin/recovery/${requestId}/resend-notification`, {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      setNotice(data.emailSent ? "Notification email sent." : data.message || "Email delivery failed again.");
      await fetchDetail();
    } catch {
      setNotice("Network error while resending.");
    } finally {
      setBusy(false);
    }
  };

  const request = detail?.request;
  const isPending = request?.status === "PENDING";

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div
        className="recovery-detail-card"
        style={{
          background: "#fff", borderRadius: "18px", width: "100%", maxWidth: "880px",
          maxHeight: "90vh", overflowY: "auto", padding: "1.5rem 1.75rem",
          boxShadow: "0 24px 64px rgba(15,23,42,0.2)", textAlign: "left",
          animation: "modalIn 0.2s ease",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>Recovery Request</p>
            <code style={{ fontSize: "0.75rem", color: "#4f46e5", wordBreak: "break-all" }}>{requestId}</code>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {request && <StatusBadge status={request.status} />}
            <button className="icon-btn" onClick={onClose} title="Close"><XIcon /></button>
          </div>
        </div>

        {loading && <div className="loading-state">Loading request details...</div>}
        {error && <p className="form-error">{error}</p>}
        {notice && <p className="form-success" style={{ marginBottom: "1rem" }}>{notice}</p>}

        {!loading && detail && request && (
          <>
            <SectionCard title="User's Explanation">
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {request.description}
              </p>
              <div style={{ display: "flex", gap: "2rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Submitted</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.85rem", color: "#0f172a" }}>{fmtDateTime(request.createdAt)}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Resolved</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.85rem", color: "#0f172a" }}>
                    {request.resolvedAt ? `${fmtDateTime(request.resolvedAt)} by ${request.resolvedBy || NA}` : "Not resolved yet"}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Email notification</p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.85rem", color: request.emailLastError ? "#dc2626" : "#0f172a" }}>
                    {request.status === "PENDING"
                      ? "Sent after decision"
                      : request.emailSentAt
                        ? `Sent ${fmtDateTime(request.emailSentAt)}`
                        : `Not sent${request.emailLastError ? ` — ${request.emailLastError}` : ""}`}
                  </p>
                </div>
              </div>
              {request.status === "REJECTED" && (
                <div style={{ marginTop: "1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                  <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>Rejection reason</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#991b1b" }}>{request.rejectionReason || NA}</p>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Current Request Signals" tint="#f8fafc">
              <p style={{ margin: "0 0 0.8rem", fontSize: "0.78rem", color: "#64748b" }}>
                Values captured from this recovery submission. Unavailable values are shown as "{NA}" rather than guessed.
              </p>
              <Grid2>
                <Field label="Browser" value={request.browserName ? `${request.browserName}${request.browserVersion ? ` ${request.browserVersion}` : ""}` : null} />
                <Field label="Operating System" value={request.osName} />
              </Grid2>
              <Grid2>
                <Field label="OS Version" value={osVersionValue(request)} />
                <Field label="Device Model (reported)" value={deviceModelValue(request)} />
              </Grid2>
              <Field label="User-Agent at submission" value={request.userAgent} />
              <Field label="Fingerprint presented" value={request.deviceFingerprint} mono />
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "0.7rem 0.9rem" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#92400e", lineHeight: 1.6 }}>
                  Browser fingerprints, User-Agent strings, and reported OS version / device model (including Client Hints) are
                  <b> self-reported supporting signals only</b>. They cannot prove the identity of a physical device and must not
                  be treated as hardware verification.
                </p>
              </div>
            </SectionCard>

            <SectionCard title="User and Purchase Details">
              <Grid2>
                <Field label="Name" value={detail.user?.username} />
                <Field label="Registered email" value={detail.user?.email} />
              </Grid2>
              <Grid2>
                <Field label="Paid note" value={detail.note?.title} />
                <Field label="Note key" value={detail.note?.noteKey} mono />
              </Grid2>
              <Grid2>
                <Field label="Purchase ID" value={detail.purchase?.id} mono />
                <Field label="Payment reference" value={detail.purchase?.razorpayOrderId} mono />
              </Grid2>
              <Grid2>
                <Field label="Purchase date and time" value={detail.purchase ? fmtDateTime(detail.purchase.createdAt) : null} />
                <Field label="Payment status" value={detail.purchase?.status} />
              </Grid2>
              <Grid2>
                <Field label="Purchase price" value={detail.purchase ? fmtPrice(detail.purchase.amount) : null} />
                <Field label="Discount" value="Not recorded" />
                <Field label="Entitlement status" value={detail.entitlement?.exists ? "Active" : "No entitlement"} />
                <Field label="Note currently enabled" value={detail.note?.isEnabled === undefined ? null : detail.note.isEnabled ? "Yes" : "No"} />
              </Grid2>
              {detail.purchaseHistory?.length > 1 && (
                <div style={{ marginTop: "0.4rem" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                    Purchase history
                  </p>
                  {detail.purchaseHistory.map((purchase) => (
                    <p key={purchase.id} style={{ margin: "0 0 3px", fontSize: "0.8rem", color: "#475569" }}>
                      {fmtDateTime(purchase.createdAt)} · {purchase.status} · {fmtPrice(purchase.amount)} · <code>{purchase.razorpayOrderId}</code>
                    </p>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Registered Device (Historical Records)" tint="#f8fafc">
              {detail.registeredDevice?.registered ? (
                <>
                  <Grid2>
                    <Field label="Registered at" value={fmtDateTime(detail.registeredDevice.registeredAt)} />
                    <Field label="Last seen" value={fmtDateTime(detail.registeredDevice.lastSeenAt)} />
                    <Field label="Last reset" value={detail.registeredDevice.resetAt ? fmtDateTime(detail.registeredDevice.resetAt) : "Never reset"} />
                    <Field label="Device token status" value={detail.registeredDevice.deviceTokenStatus} />
                  </Grid2>
                  <Field label="Stored fingerprint" value={detail.registeredDevice.fingerprint} mono />
                </>
              ) : (
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>Not available — no registered device is recorded for this entitlement.</p>
              )}
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
                Raw device tokens are never shown in this panel.
              </p>
            </SectionCard>

            <SectionCard title="Device and Authorization History">
              {detail.events?.length ? (
                <div className="file-table-wrap">
                  <table className="file-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Actor</th>
                        <th>When</th>
                        <th>Recorded User-Agent</th>
                        <th>Recorded Fingerprint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.events.map((event) => (
                        <tr key={event.id}>
                          <td style={{ fontWeight: 600 }}>{event.eventType}</td>
                          <td style={{ color: "#64748b" }}>{event.actor}</td>
                          <td style={{ color: "#64748b", fontSize: "0.8rem" }}>{fmtDateTime(event.createdAt)}</td>
                          <td style={{ color: "#64748b", fontSize: "0.78rem", maxWidth: "220px", wordBreak: "break-all" }}>
                            {event.userAgent || NA}
                          </td>
                          <td>
                            <code style={{ fontSize: "0.72rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", wordBreak: "break-all" }}>
                              {event.fingerprint || NA}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                  Not available — no historical device events were recorded for this note.
                </p>
              )}
            </SectionCard>

            <SectionCard title="Purchase-Time vs Current Device" tint="#f8fafc">
              <p style={{ margin: "0 0 0.9rem", fontSize: "0.78rem", color: "#64748b" }}>
                Left column shows <b>historical values recorded at purchase/registration time</b> exactly as captured then
                (never re-inferred or overwritten). Right column shows values from <b>this recovery submission</b>.
              </p>
              <Grid2>
                <div>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase" }}>
                    At device registration (historical)
                  </p>
                  <Field label="Browser" value={detail.comparison?.purchaseTime?.browserName ? `${detail.comparison.purchaseTime.browserName}${detail.comparison.purchaseTime.browserVersion ? ` ${detail.comparison.purchaseTime.browserVersion}` : ""}` : null} />
                  <Field label="Operating System" value={detail.comparison?.purchaseTime?.osName} />
                  <Field label="OS Version" value={osVersionValue(detail.comparison?.purchaseTime)} />
                  <Field label="Device Model (reported)" value={deviceModelValue(detail.comparison?.purchaseTime)} />
                  <Field label="Recorded at" value={detail.comparison?.purchaseTime?.recordedAt ? fmtDateTime(detail.comparison.purchaseTime.recordedAt) : null} />
                  <Field label="User-Agent" value={detail.comparison?.purchaseTime?.userAgent} />
                </div>
                <div>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 800, color: "#0ea5e9", textTransform: "uppercase" }}>
                    Current request (this submission)
                  </p>
                  <Field label="Browser" value={request.browserName ? `${request.browserName}${request.browserVersion ? ` ${request.browserVersion}` : ""}` : null} />
                  <Field label="Operating System" value={request.osName} />
                  <Field label="OS Version" value={osVersionValue(detail.comparison?.currentTime || request)} />
                  <Field label="Device Model (reported)" value={deviceModelValue(detail.comparison?.currentTime || request)} />
                  <Field label="Recorded at" value={fmtDateTime(request.createdAt)} />
                  <Field label="User-Agent" value={request.userAgent} />
                </div>
              </Grid2>
              <div style={{
                background: detail.comparison?.fingerprintMatch ? "#f0fdf4" : "#f8fafc",
                border: `1px solid ${detail.comparison?.fingerprintMatch ? "#bbf7d0" : "#e2e8f0"}`,
                borderRadius: "10px", padding: "0.7rem 0.9rem", marginTop: "0.3rem",
              }}>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#334155" }}>
                  <b>Fingerprint comparison:</b>{" "}
                  {detail.comparison?.fingerprintMatch === true
                    ? "The current request fingerprint matches the registered device fingerprint."
                    : detail.comparison?.fingerprintMatch === false
                      ? "The current request fingerprint does not match the registered device fingerprint."
                      : NA}
                </p>
              </div>
            </SectionCard>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {isPending ? (
                <>
                  <button
                    className="modal-btn modal-btn--confirm"
                    style={{ flex: 1, minWidth: "160px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    onClick={() => setShowApprove(true)}
                    disabled={busy}
                  >
                    <CheckIcon /> Approve
                  </button>
                  <button
                    className="modal-btn modal-btn--confirm danger"
                    style={{ flex: 1, minWidth: "160px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    onClick={() => setShowReject(true)}
                    disabled={busy}
                  >
                    <XIcon /> Reject
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", alignSelf: "center" }}>
                    Decision recorded: <b>{request.status === "APPROVED" ? "Approved" : "Rejected"}</b> by {request.resolvedBy || NA} on {fmtDateTime(request.resolvedAt)}
                  </span>
                  {!request.emailSentAt && (
                    <button
                      className="tab-btn"
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      onClick={handleResend}
                      disabled={busy}
                    >
                      <MailIcon /> Resend notification
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {showApprove && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: "430px", textAlign: "left" }}>
            <p className="modal-title">Approve this recovery request?</p>
            <p className="modal-body">
              The current browser will be reauthorized for <strong>{detail?.note?.title || "this note"}</strong>,
              a new device token will be issued, and <strong>{detail?.user?.email}</strong> will be emailed.
              The previously registered device will lose access.
            </p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--cancel" onClick={() => setShowApprove(false)} disabled={busy}>Cancel</button>
              <button className="modal-btn modal-btn--confirm" onClick={handleApprove} disabled={busy}>
                {busy ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReject && (
        <RejectModal
          busy={busy}
          noteTitle={detail?.note?.title}
          onCancel={() => setShowReject(false)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}

function RejectModal({ busy, noteTitle, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const value = reason.trim();
    if (value.length < 5) {
      setError("A rejection reason is required.");
      return;
    }
    setError("");
    onConfirm(value);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: "460px", textAlign: "left" }}>
        <p className="modal-title">Reject this recovery request?</p>
        <p className="modal-body">
          The rejection reason is required and will be emailed to the user along with the
          reference for <strong>{noteTitle || "this note"}</strong>.
        </p>
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
          Rejection reason <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <textarea
          className="form-input"
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why this recovery request cannot be approved"
          style={{ resize: "vertical", marginBottom: "0.75rem" }}
        />
        {error && <p className="form-error" style={{ marginBottom: "0.75rem" }}>{error}</p>}
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="modal-btn modal-btn--confirm danger" onClick={submit} disabled={busy}>
            {busy ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}
