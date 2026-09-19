import { useState, useEffect } from "react";
import "./pages.css";

const HEADERS = {
  username: import.meta.env.VITE_ADMIN_USERNAME,
  password: import.meta.env.VITE_ADMIN_PASSWORD,
};

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const FileIcon = ({ color }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const highlight = (text, query) => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: "#fef08a", borderRadius: "3px", padding: "0 2px" }}>{part}</mark>
      : part
  );
};

const fuzzyMatch = (fileName, query) => {
  const name = fileName.toLowerCase().replace(/_[a-z0-9]{4,}$/i, "").replace(/\.pdf$/i, "");
  const q = query.toLowerCase().trim();
  if (!q) return false;
  if (name.includes(q)) return true;
  // check if all query chars appear in order (fuzzy)
  let qi = 0;
  for (let i = 0; i < name.length && qi < q.length; i++) {
    if (name[i] === q[qi]) qi++;
  }
  return qi === q.length;
};

const cleanName = (name) =>
  name.replace(/_[a-z0-9]{4,}$/i, "").replace(/\.pdf$/i, "");

const Search = () => {
const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [preview, setPreview] = useState(null);



const fetchAllSupabase = async (folderPath) => {
    try {
      const param = folderPath ? `?folder=${encodeURIComponent(folderPath)}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/supabase/files${param}`,
        { headers: HEADERS }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const files = (data.files || []).map((f) => ({ ...f, provider: "supabase", folder: folderPath }));
      const subFolders = data.folders || [];
      const nested = await Promise.all(
        subFolders.map((sf) => fetchAllSupabase(folderPath ? `${folderPath}/${sf}` : sf))
      );
      return [...files, ...nested.flat()];
    } catch {
      return [];
    }
  };

// fetch all files once on mount
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
    const [s1, s2] = await Promise.all([
        fetchAllSupabase("msbte"),
        fetchAllSupabase("mu"),
      ]);
      setAllFiles([...s1, ...s2]);
      } catch {
        setAllFiles([]);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

const filterResults = (q, files) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const matched = files.filter((f) => fuzzyMatch(f.name, q));
    matched.sort((a, b) => {
      const an = cleanName(a.name).toLowerCase();
      const bn = cleanName(b.name).toLowerCase();
      const aExact = an.includes(q.toLowerCase());
      const bExact = bn.includes(q.toLowerCase());
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return an.localeCompare(bn);
    });
    setResults(matched);
    setSearched(true);
  };

  const handleSearch = () => {};

  const handleDownload = async (url, name) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Search Files</h2>
        <p className="page-subtitle">Search across all Cloudinary and Supabase files</p>
      </div>

      <div className="search-bar-wrap">
        <div className="search-input-wrap">
          <span className="search-input-icon"><SearchIcon /></span>
          <input
            className="search-input"
            type="text"
            placeholder="Search files... e.g. data-str, os, dbms"
            value={query}
            onChange={(e) => { setQuery(e.target.value); filterResults(e.target.value, allFiles); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
      {query && (
            <button className="search-clear-btn" onClick={() => { setQuery(""); filterResults("", allFiles); }}>✕</button>
          )}
        </div>
        <button className="search-go-btn" onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

    {loading && (
        <div className="loading-state">Loading all files, please wait...</div>
      )}

      {searched && !loading && (
        <div className="search-meta">
          {results.length > 0
            ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`
            : `No results found for "${query}"`}
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((file, i) => {
            const displayName = cleanName(file.name);
            const isCloud = file.provider === "cloudinary";
            return (
              <div key={i} className="search-result-card">
                <div className="search-result-left">
                  <FileIcon color={isCloud ? "#4f46e5" : "#0ea5e9"} />
                  <div className="search-result-info">
                    <p className="search-result-name">{highlight(displayName, query)}</p>
                    <p className="search-result-path">{file.folder || "root"}</p>
                    <span className={`search-result-badge ${isCloud ? "badge--indigo" : "badge--sky"}`}>
                      {isCloud ? "Cloudinary" : "Supabase"}
                    </span>
                  </div>
                </div>
                <div className="search-result-actions">
                  <button onClick={() => setPreview(file)} className="action-btn action-btn--preview-indigo" title="Preview">
                    <EyeIcon />
                  </button>
                  <button onClick={() => handleDownload(file.url, file.name)} className="action-btn action-btn--download" title="Download">
                    <DownloadIcon />
                  </button>
                  <button onClick={() => window.open(file.url, "_blank")} className="action-btn action-btn--preview-sky" title="Open">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="empty-state">No files matched your search</div>
      )}

      {preview && (
        <div className="preview-overlay">
          <div className="preview-card">
            <div className="preview-header">
              <p className="preview-header__name">{cleanName(preview.name)}</p>
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

export default Search;