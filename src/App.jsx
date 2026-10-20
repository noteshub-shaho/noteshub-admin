import { useState } from "react";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import CloudinaryManager from "./pages/CloudinaryManager";
import SupabaseManager from "./pages/SupabaseManager";
import Sidebar from "./components/Sidebar";
import Search from "./pages/Search";
import PaidNotesManager from "./pages/PaidNotesManager";
import DeviceRecovery from "./pages/DeviceRecovery";
import "./pages/pages.css";

export default function App() {
  const [authed, setAuthed] = useState(() => {
    return localStorage.getItem("admin_authed") === "true";
  });
const [page, setPage] = useState(() => {
    return localStorage.getItem("admin_page") || "paid-notes";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authed) {
    return (
      <Login onLogin={() => {
        localStorage.setItem("admin_authed", "true");
        setAuthed(true);
      }} />
    );
  }

const renderPage = () => {
    if (page === "cloudinary") return <CloudinaryManager />;
    if (page === "supabase") return <SupabaseManager />;
    if (page === "search") return <Search />;
    if (page === "paid-notes") return <PaidNotesManager />;
    if (page === "recovery") return <DeviceRecovery />;
    return <AdminPanel />;
  };
return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar
        activePage={page}
        isOpen={sidebarOpen}
        onNavigate={(key) => { setPage(key); localStorage.setItem("admin_page", key); setSidebarOpen(false); }}
        onLogout={() => {
          localStorage.removeItem("admin_authed");
          setAuthed(false);
        }}
      />
      <main className="main-content">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        {renderPage()}
      </main>
    </div>
  );
}