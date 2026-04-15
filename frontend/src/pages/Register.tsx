import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../lib/api";
import { validateEmail, validatePassword, validateVoen } from "../lib/validators";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [voen, setVoen] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const v = validateEmail(email) || validatePassword(password) || validateVoen(voen);
    if (v) {
      setErr(v);
      return;
    }
    setLoading(true);
    try {
      const r = await api("/auth/register", {
        method: "POST",
        body: { email, password, voen: voen || null },
        auth: false,
      });
      setAuth(r.access_token, r.user);
      nav("/business/new");
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
        <h1 className="text-3xl font-bold">Hesab yarat 🚀</h1>
        <p className="text-slate-500 mt-2">Biznesini onlayn et</p>
      </div>
      <form onSubmit={submit} className="card p-8 space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Şifrə</label>
          <input
            className="input"
            type="password"
            placeholder="Ən az 6 simvol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">
            VOEN <span className="text-slate-400 font-normal">(könüllü)</span>
          </label>
          <input
            className="input"
            placeholder="1234567890"
            value={voen}
            onChange={(e) => setVoen(e.target.value)}
          />
        </div>
        {err && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{err}</div>
        )}
        <button disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Yüklənir..." : "Qeydiyyatdan keç"}
        </button>
        <div className="text-center text-sm text-slate-500 pt-2">
          Artıq hesabın var?{" "}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Giriş et
          </Link>
        </div>
      </form>
    </div>
  );
}
