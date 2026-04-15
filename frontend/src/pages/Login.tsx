import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../lib/api";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!identifier.trim()) errs.identifier = "Email və ya VOEN tələb olunur";
    if (!password) errs.password = "Şifrə tələb olunur";
    setErrors(errs);
    if (Object.keys(errs).length) return;

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
      setErrors({ form: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12 sm:py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-display">Xoş gəldin</h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>Hesabına daxil ol</p>
      </div>
      <form onSubmit={submit} className="card p-7 sm:p-8 space-y-5">
        <div>
          <label className="label">Email və ya VOEN</label>
          <input
            className="input"
            placeholder="example@mail.com"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) setErrors({ ...errors, identifier: undefined });
            }}
            autoComplete="username"
          />
          {errors.identifier && <div className="error-text">{errors.identifier}</div>}
        </div>
        <div>
          <label className="label">Şifrə</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            autoComplete="current-password"
          />
          {errors.password && <div className="error-text">{errors.password}</div>}
        </div>
        {errors.form && (
          <div
            className="text-sm px-4 py-3 rounded-xl"
            style={{ background: "rgba(220,38,38,0.08)", color: "var(--danger)" }}
          >
            {errors.form}
          </div>
        )}
        <button disabled={loading} className="btn-primary w-full !py-3">
          {loading ? "Yüklənir..." : "Giriş et"}
        </button>
        <div className="text-center text-sm pt-1" style={{ color: "var(--text-muted)" }}>
          Hesabın yoxdur?{" "}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: "var(--text)" }}>
            Qeydiyyatdan keç
          </Link>
        </div>
      </form>
    </div>
  );
}
