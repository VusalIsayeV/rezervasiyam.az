import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../lib/api";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await api("/auth/login", {
        method: "POST",
        body: { identifier, password },
        auth: false,
      });
      setAuth(r.access_token, r.user);
      if (r.user.role === "mentor") nav("/mentor");
      else nav("/dashboard");
      window.location.reload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Xoş gəldin 👋</h1>
        <p className="text-slate-500 mt-2">Hesabına daxil ol</p>
      </div>
      <form onSubmit={submit} className="card p-8 space-y-4">
        <div>
          <label className="label">Email və ya VOEN</label>
          <input
            className="input"
            placeholder="example@mail.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Şifrə</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {err && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{err}</div>
        )}
        <button disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Yüklənir..." : "Giriş et"}
        </button>
        <div className="text-center text-sm text-slate-500 pt-2">
          Hesabın yoxdur?{" "}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Qeydiyyatdan keç
          </Link>
        </div>
      </form>
    </div>
  );
}
