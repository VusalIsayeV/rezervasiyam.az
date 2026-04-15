import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../lib/api";
import { validateEmail, validatePassword, validateVoen } from "../lib/validators";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [voen, setVoen] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; voen?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const validateField = (field: "email" | "password" | "voen", value: string) => {
    let msg: string | undefined;
    if (field === "email") msg = validateEmail(value) || undefined;
    if (field === "password") msg = validatePassword(value) || undefined;
    if (field === "voen") msg = value ? validateVoen(value) || undefined : undefined;
    setErrors((p) => ({ ...p, [field]: msg }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const eMsg = validateEmail(email);
    const pMsg = validatePassword(password);
    const vMsg = voen ? validateVoen(voen) : null;
    if (eMsg) errs.email = eMsg;
    if (pMsg) errs.password = pMsg;
    if (vMsg) errs.voen = vMsg;
    setErrors(errs);
    if (Object.keys(errs).length) return;

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
      setErrors({ form: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12 sm:py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-display">Hesab yarat</h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>Biznesini onlayn et</p>
      </div>
      <form onSubmit={submit} className="card p-7 sm:p-8 space-y-5">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => validateField("email", e.target.value)}
            autoComplete="email"
          />
          {errors.email && <div className="error-text">{errors.email}</div>}
        </div>
        <div>
          <label className="label">Şifrə</label>
          <input
            className="input"
            type="password"
            placeholder="Ən az 6 simvol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={(e) => validateField("password", e.target.value)}
            autoComplete="new-password"
          />
          {errors.password ? (
            <div className="error-text">{errors.password}</div>
          ) : (
            <div className="helper">Ən az 6 simvol olmalıdır</div>
          )}
        </div>
        <div>
          <label className="label">
            VOEN <span style={{ color: "var(--text-muted)" }} className="font-normal">(könüllü)</span>
          </label>
          <input
            className="input"
            placeholder="1234567890"
            value={voen}
            onChange={(e) => setVoen(e.target.value)}
            onBlur={(e) => validateField("voen", e.target.value)}
          />
          {errors.voen && <div className="error-text">{errors.voen}</div>}
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
          {loading ? "Yüklənir..." : "Qeydiyyatdan keç"}
        </button>
        <div className="text-center text-sm pt-1" style={{ color: "var(--text-muted)" }}>
          Artıq hesabın var?{" "}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
            Giriş et
          </Link>
        </div>
      </form>
    </div>
  );
}
