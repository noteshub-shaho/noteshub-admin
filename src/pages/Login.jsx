import { useState } from "react";
import "./pages.css";
import logo from "../assets/logo.jpg";

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const validUser = import.meta.env.VITE_ADMIN_USERNAME;
    const validPass = import.meta.env.VITE_ADMIN_PASSWORD;
    if (form.username === validUser && form.password === validPass) {
      onLogin();
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
     <div className="login-brand">
        <img src={logo} alt="NotesHub" style={{ height: "36px", width: "auto", borderRadius: "6px" }} />
        </div>
        <p className="login-tagline">Admin Panel - sign in to continue</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <input
            className="login-input"
            type="text"
            placeholder="Email address"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="username"
          />

          <div className="input-wrap">
            <input
              className="login-input login-input--password"
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
              <EyeIcon open={showPass} />
            </button>
          </div>

          <button type="submit" className="login-btn">Continue</button>
        </form>
      </div>
    </div>
  );
};

export default Login;