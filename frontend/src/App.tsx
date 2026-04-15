import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "./lib/api";
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

  const logout = () => {
    clearAuth();
    nav("/");
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 group-hover:scale-105 transition flex-shrink-0">
              R
            </div>
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
              rezervasiyam.az
            </span>
          </Link>
          <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
            {!user && (
              <>
                <Link to="/login" className="btn-secondary">
                  Giriş
                </Link>
                <Link to="/register" className="btn-primary">
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
                Mentor Panel
              </Link>
            )}
            {user && (
              <button onClick={logout} className="text-slate-500 hover:text-red-600 text-sm px-3 py-2 transition">
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
