import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "./lib/api";
import { applyTheme, getTheme, Theme } from "./lib/theme";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BusinessRegister from "./pages/BusinessRegister";
import OwnerDashboard from "./pages/OwnerDashboard";
import MentorPanel from "./pages/MentorPanel";
import BusinessPublic from "./pages/BusinessPublic";

export default function App() {
  const user = getUser();
  const nav = useNavigate();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = getTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  };

  const logout = () => {
    clearAuth();
    nav("/");
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <nav
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--bg) 75%, transparent)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
          <Link to="/" className="flex items-center gap-2.5 group min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base group-hover:scale-105 transition flex-shrink-0"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              R
            </div>
            <span className="text-base sm:text-lg font-bold font-display truncate">
              rezervasiyam<span style={{ color: "var(--text-muted)" }}>.az</span>
            </span>
          </Link>
          <div className="flex gap-1.5 sm:gap-2 items-center flex-shrink-0">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:scale-105"
              style={{
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
              }}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            {!user && (
              <>
                <Link to="/login" className="btn-secondary !px-3 sm:!px-5 !py-2">
                  Giriş
                </Link>
                <Link to="/register" className="btn-primary !px-3 sm:!px-5 !py-2">
                  Qeydiyyat
                </Link>
              </>
            )}
            {user?.role === "owner" && (
              <Link to="/dashboard" className="btn-secondary">
                Panelim
              </Link>
            )}
            {user?.role === "mentor" && (
              <Link to="/mentor" className="btn-secondary">
                Mentor
              </Link>
            )}
            {user && (
              <button
                onClick={logout}
                className="text-sm px-3 py-2 transition hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                Çıxış
              </button>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/business/new" element={<BusinessRegister />} />
        <Route path="/dashboard" element={<OwnerDashboard />} />
        <Route path="/mentor" element={<MentorPanel />} />
        <Route path="/b/:slug" element={<BusinessPublic />} />
      </Routes>
    </div>
  );
}
