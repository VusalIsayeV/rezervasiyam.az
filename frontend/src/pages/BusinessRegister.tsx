import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import MapPicker from "../components/MapPicker";
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateSlug,
  validateVoen,
  normalizePhone,
} from "../lib/validators";

type Service = { name: string; price_min: number; price_max?: number; duration_min: number };

export default function BusinessRegister() {
  const nav = useNavigate();
  const [cats, setCats] = useState<any[]>([]);
  const [svcOptions, setSvcOptions] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    name: "",
    voen: "",
    category_slug: "",
    about: "",
    contact_email: "",
    contact_phone: "",
    slug: "",
    lat: 40.4093,
    lng: 49.8671,
    address: "",
  });
  const [services, setServices] = useState<Service[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api("/categories", { auth: false }).then((r) => {
      setCats(r.categories);
      setSvcOptions(r.services_by_category);
    });
  }, []);

  const toggleService = (name: string) => {
    setServices((s) =>
      s.find((x) => x.name === name)
        ? s.filter((x) => x.name !== name)
        : [...s, { name, price_min: 0, duration_min: 30 }]
    );
  };

  const updateService = (name: string, patch: Partial<Service>) => {
    setServices((s) => s.map((x) => (x.name === name ? { ...x, ...patch } : x)));
  };

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    const oversized = files.find((f) => f.size > 2 * 1024 * 1024);
    if (oversized) {
      setErr(`Şəkil çox böyükdür: ${oversized.name} (max 2MB)`);
      return;
    }
    const bs = await Promise.all(
      files.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(f);
          })
      )
    );
    setImages(bs);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const v =
      validateRequired(form.name, "Biznes adı", 2, 80) ||
      validateSlug(form.slug) ||
      validateVoen(form.voen) ||
      (!form.category_slug ? "Kateqoriya seçin" : null) ||
      validateRequired(form.address, "Ünvan", 3, 255) ||
      validateRequired(form.about, "Haqqında", 10, 1000) ||
      validateEmail(form.contact_email) ||
      validatePhone(form.contact_phone) ||
      (services.length === 0 ? "Ən az bir xidmət seçin" : null) ||
      (services.some((s) => s.price_min < 0) ? "Qiymət mənfi ola bilməz" : null) ||
      (services.some((s) => s.price_max != null && s.price_max < s.price_min)
        ? "Max qiymət min qiymətdən kiçik ola bilməz"
        : null) ||
      (services.some((s) => s.duration_min < 5 || s.duration_min > 600)
        ? "Xidmət müddəti 5-600 dəqiqə aralığında olmalıdır"
        : null);
    if (v) {
      setErr(v);
      return;
    }
    setLoading(true);
    try {
      await api("/businesses", {
        method: "POST",
        body: {
          name: form.name.trim(),
          voen: form.voen || null,
          category_slug: form.category_slug,
          location: { lat: form.lat, lng: form.lng, address: form.address.trim() },
          about: form.about.trim(),
          services,
          images,
          contact_email: form.contact_email.trim(),
          contact_phone: normalizePhone(form.contact_phone),
          slug: form.slug.toLowerCase(),
        },
      });
      nav("/dashboard");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Biznes Qeydiyyatı</h1>
        <p className="text-slate-500 mt-2">Müraciətin mentor tərəfindən yoxlanılacaq</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center">1</span>
            Əsas məlumatlar
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Biznes adı *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Subdomen / slug *</label>
              <input className="input" placeholder="barberNurlan" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div>
              <label className="label">VOEN</label>
              <input className="input" value={form.voen} onChange={(e) => setForm({ ...form, voen: e.target.value })} />
            </div>
            <div>
              <label className="label">Kateqoriya *</label>
              <select
                className="input"
                value={form.category_slug}
                onChange={(e) => {
                  setForm({ ...form, category_slug: e.target.value });
                  setServices([]);
                }}
                required
              >
                <option value="">Seçin...</option>
                {cats.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Haqqında *</label>
            <textarea className="input" rows={3} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} required />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center">2</span>
            Ünvan
          </h2>
          <div>
            <label className="label">Xəritədən yeri seç (klik et) *</label>
            <MapPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(lat, lng, address) =>
                setForm((f) => ({ ...f, lat, lng, address: address || f.address }))
              }
            />
          </div>
          <div>
            <label className="label">Ünvan *</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            <div className="text-xs text-slate-400 mt-1">Xəritədə klik etdikdə avtomatik doldurulur</div>
          </div>
        </div>

        {form.category_slug && (
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center">3</span>
              Xidmətlər *
            </h2>
            <div className="space-y-2">
              {(svcOptions[form.category_slug] || []).map((name) => {
                const sel = services.find((s) => s.name === name);
                return (
                  <div key={name} className={`rounded-xl border transition ${sel ? "border-indigo-300 bg-indigo-50/40" : "border-slate-200"}`}>
                    <label className="flex items-center gap-3 p-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={!!sel} onChange={() => toggleService(name)} />
                      <span className="font-medium">{name}</span>
                    </label>
                    {sel && (
                      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                        <input className="input py-2" type="number" placeholder="Min AZN" value={sel.price_min}
                          onChange={(e) => updateService(name, { price_min: parseFloat(e.target.value) || 0 })} />
                        <input className="input py-2" type="number" placeholder="Max AZN" value={sel.price_max || ""}
                          onChange={(e) => updateService(name, { price_max: parseFloat(e.target.value) || undefined })} />
                        <input className="input py-2" type="number" placeholder="Dəq" value={sel.duration_min}
                          onChange={(e) => updateService(name, { duration_min: parseInt(e.target.value) || 30 })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center">4</span>
            Məkan şəkilləri
          </h2>
          <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            <input type="file" multiple accept="image/*" onChange={onFiles} className="hidden" />
            <div className="text-4xl mb-2">📷</div>
            <div className="text-slate-600 font-medium">Şəkil seçmək üçün klik et</div>
          </label>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((src, i) => (
                <img key={i} src={src} className="w-full h-24 object-cover rounded-xl" />
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center">5</span>
            Əlaqə
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Telefon *</label>
              <input className="input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} required />
            </div>
          </div>
        </div>

        {err && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{err}</div>}
        <button disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? "Göndərilir..." : "Müraciət et"}
        </button>
      </form>
    </div>
  );
}
