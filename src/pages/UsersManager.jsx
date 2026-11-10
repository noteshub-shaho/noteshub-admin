import { useState, useEffect, useCallback } from "react";
import "./pages.css";

const API = import.meta.env.VITE_API_URL;
const getAdminHeaders = () => ({
  "Content-Type": "application/json",
  username: localStorage.getItem("admin_username") || "",
  password: localStorage.getItem("admin_password") || "",
});

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const formatIST = (iso) => {
  if (!iso) return null;
  const d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return null;
};

const LastOnlineCell = ({ iso }) => {
  if (!iso) return <span className="users-never">Never</span>;
  const ago = timeAgo(iso);
  const full = formatIST(iso);
  if (ago) {
    return <span className="users-online-time" title={full}>{ago}</span>;
  }
  return <span className="users-time" title={full}>{full}</span>;
};

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchUsers = useCallback(async (currentPage, currentSearch) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 20 });
      if (currentSearch) params.set("search", currentSearch);
      const res = await fetch(`${API}/api/admin/users?${params}`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        setError(data.message || "Failed to load users.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, search, fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2 className="panel-heading">Users</h2>
          <p className="panel-subheading">All registered NotesHub users</p>
        </div>
      </div>

      <div className="users-toolbar">
        <form onSubmit={handleSearch} className="users-search-form">
          <div className="users-search-input-wrap">
            <svg className="users-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="users-search-input"
              placeholder="Search by name, email, or user ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="users-search-clear" type="button" onClick={handleClear} title="Clear">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button className="submit-btn users-search-btn" type="submit">Search</button>
        </form>
        <button className="icon-btn" onClick={() => fetchUsers(page, search)} title="Refresh">
          <RefreshIcon />
        </button>
      </div>

      <p className="users-meta">
        {search
          ? `${pagination.total} result${pagination.total !== 1 ? "s" : ""} for "${search}"`
          : `${pagination.total} total user${pagination.total !== 1 ? "s" : ""}`}
      </p>

      {error && <p className="form-error" style={{ marginBottom: "1rem" }}>{error}</p>}

      {loading ? (
        <div className="users-loading">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.8s linear infinite" }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <>
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="users-col-id">User ID</th>
                  <th className="users-col-provider">Provider</th>
                  <th className="users-col-status">Status</th>
                  <th className="users-col-last">Last Online</th>
                  <th className="users-col-joined">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="users-user-cell">
                        <div className="users-avatar">
                          {(u.username || "?")[0].toUpperCase()}
                        </div>
                        <div className="users-user-info">
                          <span className="users-name">{u.username}</span>
                          <span className="users-email">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="users-col-id">
                      <code className="users-id-code">{u.id}</code>
                    </td>
                    <td className="users-col-provider">
                      <span className={`users-badge users-badge--${u.authProvider === "google" ? "google" : "local"}`}>
                        {u.authProvider === "google" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        )}
                        {u.authProvider}
                      </span>
                    </td>
                    <td className="users-col-status">
                      <span className={`users-badge users-badge--status-${!u.isVerified ? "unverified" : u.isLoggedIn ? "online" : "verified"}`}>
                        <span className="users-badge-dot" />
                        {!u.isVerified ? "Unverified" : u.isLoggedIn ? "Online" : "Verified"}
                      </span>
                    </td>
                    <td className="users-col-last">
                      <LastOnlineCell iso={u.lastActiveAt} />
                    </td>
                    <td className="users-col-joined">
                      <span className="users-time">{formatIST(u.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="users-mobile-list">
            {users.map((u) => (
              <div key={u.id} className="users-card">
                <div className="users-card-top">
                  <div className="users-user-cell">
                    <div className="users-avatar">
                      {(u.username || "?")[0].toUpperCase()}
                    </div>
                    <div className="users-user-info">
                      <span className="users-name">{u.username}</span>
                      <span className="users-email">{u.email}</span>
                    </div>
                  </div>
                  <span className={`users-badge users-badge--status-${!u.isVerified ? "unverified" : u.isLoggedIn ? "online" : "verified"}`}>
                    <span className="users-badge-dot" />
                    {!u.isVerified ? "Unverified" : u.isLoggedIn ? "Online" : "Verified"}
                  </span>
                </div>
                <div className="users-card-meta">
                  <div className="users-card-row">
                    <span className="users-card-label">Provider</span>
                    <span className={`users-badge users-badge--${u.authProvider === "google" ? "google" : "local"}`}>
                      {u.authProvider}
                    </span>
                  </div>
                  <div className="users-card-row">
                    <span className="users-card-label">Last Online</span>
                    <LastOnlineCell iso={u.lastActiveAt} />
                  </div>
                  <div className="users-card-row">
                    <span className="users-card-label">Joined</span>
                    <span className="users-time">{formatIST(u.createdAt)}</span>
                  </div>
                  <div className="users-card-row">
                    <span className="users-card-label">User ID</span>
                    <code className="users-id-code">{u.id}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pagination.totalPages > 1 && (
        <div className="users-pagination">
          <button
            className="icon-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            title="Previous page"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="users-page-info">Page {page} of {pagination.totalPages}</span>
          <button
            className="icon-btn"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            title="Next page"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}