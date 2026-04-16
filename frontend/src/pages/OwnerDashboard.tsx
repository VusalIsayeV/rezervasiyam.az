import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { validatePhone, validateRequired, normalizePhone } from "../lib/validators";
import StatsPanel from "../components/StatsPanel";

const DAYS = ["Bazar ertəsi", "Çərşənbə ax.", "Çərşənbə", "Cümə ax.", "Cümə", "Şənbə", "Bazar"];

type Service = { name: string; price_min: number; price_max?: number; duration_min: number };
type Break = { start: string; end: string };
type ClosedDay = { date: string; reason?: string };

const tabs = [
  { path: "", label: "İcmal", icon: "📊" },
  { path: "stats", label: "Statistika", icon: "📈" },
  { path: "bookings", label: "Rezervasiyalar", icon: "📅" },
  { path: "add-booking", label: "Müştəri yaz", icon: "➕" },
  { path: "services", label: "Xidmətlər", icon: "🛠️" },
  { path: "hours", label: "İş saatları", icon: "🕐" },
  { path: "closed-days", label: "Bağlı günlər", icon: "🚫" },
];

export default function OwnerDashboard() {
  const [biz, setBiz] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    api("/businesses/mine").then((b) => {
      setBiz(b);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  if (!loaded)
    return <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>Yüklənir...</div>;

  if (!biz)
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="text-2xl font-bold font-display mb-2">Hələ biznesin yoxdur</h2>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>İlk biznesini yarat və rezervasiya qəbul etməyə başla</p>
        <Link to="/business/new" className="btn-primary">Biznes yarat →</Link>
      </div>
    );

  const statusBadge =
    biz.status === "approved" ? <span className="badge-approved">Aktiv</span>
    : biz.status === "rejected" ? <span className="badge-rejected">Rədd</span>
    : biz.status === "disabled" ? <span className="badge-rejected">Deaktiv</span>
    : <span className="badge-pending">Gözləyir</span>;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold font-display truncate">{biz.name}</h1>
            {statusBadge}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            /{biz.slug} · {biz.category_slug}
          </div>
        </div>
        <div className="flex gap-2">
          {biz.status === "approved" && (
            <Link to={`/b/${biz.slug}`} className="btn-secondary text-sm">Açıq səhifə →</Link>
          )}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="btn-secondary text-sm sm:hidden"
          >
            ☰ Menyu
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside
          className={`${mobileMenu ? "block" : "hidden"} sm:block w-full sm:w-52 shrink-0 ${mobileMenu ? "absolute z-30 left-0 top-0 right-0 p-4" : ""}`}
          style={mobileMenu ? { background: "var(--bg)" } : undefined}
        >
          <nav className="flex flex-col gap-1">
            {tabs.map((t) => (
              <NavLink
                key={t.path}
                to={`/dashboard/${t.path}`}
                end={t.path === ""}
                onClick={() => setMobileMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? "active-tab" : "inactive-tab"}`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: "var(--accent-soft)", color: "var(--accent)" }
                    : { color: "var(--text-muted)" }
                }
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Routes>
            <Route index element={<OverviewTab biz={biz} />} />
            <Route path="stats" element={<StatsPanel businessId={biz.id} />} />
            <Route path="bookings" element={<BookingsTab biz={biz} />} />
            <Route path="add-booking" element={<AddBookingTab biz={biz} />} />
            <Route path="services" element={<ServicesTab biz={biz} onUpdate={setBiz} />} />
            <Route path="hours" element={<HoursTab biz={biz} onUpdate={setBiz} />} />
            <Route path="closed-days" element={<ClosedDaysTab biz={biz} onUpdate={setBiz} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ===== OVERVIEW TAB ===== */
function OverviewTab({ biz }: { biz: any }) {
  const [bookings, setBookings] = useState<any[]>([]);
  useEffect(() => {
    api(`/bookings/business/${biz.id}`).then(setBookings);
  }, [biz.id]);

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => b.date === today);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard label="Ümumi rez." value={bookings.length} />
        <MiniCard label="Bugünkü" value={todayBookings.length} />
        <MiniCard label="Xidmətlər" value={biz.services?.length || 0} />
        <MiniCard label="Status" value={biz.status === "approved" ? "Aktiv" : biz.status} />
      </div>

      {todayBookings.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Bugünkü rezervasiyalar</h3>
          <div className="space-y-2">
            {todayBookings.map((b) => (
              <BookingRow key={b.id} b={b} />
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-semibold mb-3">Əlaqə</h3>
        <div className="text-sm space-y-1" style={{ color: "var(--text-muted)" }}>
          <div>📧 {biz.contact_email}</div>
          <div>📞 {biz.contact_phone}</div>
          <div>📍 {biz.location?.address}</div>
        </div>
      </div>
    </div>
  );
}

/* ===== BOOKINGS TAB ===== */
function BookingsTab({ biz }: { biz: any }) {
  const [bookings, setBookings] = useState<any[]>([]);
  useEffect(() => {
    api(`/bookings/business/${biz.id}`).then(setBookings);
  }, [biz.id]);

  return (
    <div>
      <h2 className="text-xl font-bold font-display mb-4">Rezervasiyalar</h2>
      {bookings.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-2">📅</div>
          <p style={{ color: "var(--text-muted)" }}>Hələ rezervasiya yoxdur</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <BookingRow key={b.id} b={b} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== ADD BOOKING TAB ===== */
function AddBookingTab({ biz }: { biz: any }) {
  const [service, setService] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service && date) {
      api(`/bookings/availability?business_id=${biz.id}&service_name=${encodeURIComponent(service)}&date=${date}`, { auth: false })
        .then((r) => setSlots(r.slots)).catch(() => setSlots([]));
    }
  }, [service, date, biz.id]);

  const submit = async () => {
    setErr(""); setMsg("");
    const v = validateRequired(name, "Ad", 2, 80) || validatePhone(phone);
    if (v) { setErr(v); return; }
    setLoading(true);
    try {
      await api("/bookings/owner", {
        method: "POST",
        body: { business_id: biz.id, service_name: service, customer_name: name.trim(), customer_phone: normalizePhone(phone), date, start_time: slot },
      });
      setMsg("Müştəri rezervasiyası əlavə edildi");
      setSlot(""); setName(""); setPhone("");
      const r = await api(`/bookings/availability?business_id=${biz.id}&service_name=${encodeURIComponent(service)}&date=${date}`, { auth: false });
      setSlots(r.slots);
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold font-display mb-1">Müştəri yaz</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Zəng və ya şəxsən müraciət edən müştəri üçün</p>
      <div className="space-y-4">
        <div>
          <label className="label">Xidmət</label>
          <select className="input" value={service} onChange={(e) => { setService(e.target.value); setSlot(""); }}>
            <option value="">Seç...</option>
            {(biz.services || []).map((s: any) => <option key={s.name} value={s.name}>{s.name} — {s.duration_min} dəq</option>)}
          </select>
        </div>
        {service && (
          <div>
            <label className="label">Tarix</label>
            <input type="date" className="input" value={date} onChange={(e) => { setDate(e.target.value); setSlot(""); }} min={new Date().toISOString().slice(0, 10)} />
          </div>
        )}
        {service && slots.length > 0 && (
          <div>
            <label className="label">Vaxt</label>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button key={s} onClick={() => setSlot(s)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  style={slot === s ? { background: "var(--accent)", color: "var(--accent-contrast)" } : { background: "var(--bg)", border: "1px solid var(--border)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {service && slots.length === 0 && (
          <div className="text-sm p-3 rounded-xl" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>Bu tarix üçün boş vaxt yoxdur</div>
        )}
        {slot && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Müştəri adı</label><input className="input" placeholder="Ad soyad" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className="label">Telefon</label><input className="input" placeholder="+994 50 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
            <button onClick={submit} disabled={loading || !name || !phone} className="btn-primary">{loading ? "Göndərilir..." : "Rezervasiya yaz"}</button>
          </>
        )}
        {msg && <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.1)", color: "#047857" }}>{msg}</div>}
        {err && <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(220,38,38,0.08)", color: "var(--danger)" }}>{err}</div>}
      </div>
    </div>
  );
}

/* ===== SERVICES TAB ===== */
function ServicesTab({ biz, onUpdate }: { biz: any; onUpdate: (b: any) => void }) {
  const [services, setServices] = useState<Service[]>(biz.services || []);
  const [newSvc, setNewSvc] = useState<Service>({ name: "", price_min: 0, duration_min: 30 });
  const [msg, setMsg] = useState("");

  const save = async (list: Service[]) => {
    const b = await api("/businesses/mine/services", { method: "PUT", body: list });
    onUpdate(b); setServices(b.services);
    setMsg("Yadda saxlanıldı"); setTimeout(() => setMsg(""), 2000);
  };

  const add = () => { if (!newSvc.name.trim()) return; save([...services, newSvc]); setNewSvc({ name: "", price_min: 0, duration_min: 30 }); };
  const remove = (name: string) => save(services.filter((s) => s.name !== name));
  const update = (name: string, patch: Partial<Service>) => setServices((s) => s.map((x) => (x.name === name ? { ...x, ...patch } : x)));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-display">Xidmətlər</h2>
        {msg && <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>{msg}</span>}
      </div>
      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.name} className="card p-4 flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex-1 font-medium min-w-0 truncate">{s.name}</div>
            <div className="flex items-center gap-1 flex-wrap">
              <input type="number" className="input !py-1.5 !px-2 w-20 text-sm" value={s.price_min}
                onChange={(e) => update(s.name, { price_min: parseFloat(e.target.value) || 0 })} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
              <input type="number" placeholder="max" className="input !py-1.5 !px-2 w-20 text-sm" value={s.price_max || ""}
                onChange={(e) => update(s.name, { price_max: parseFloat(e.target.value) || undefined })} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>₼</span>
              <input type="number" className="input !py-1.5 !px-2 w-16 text-sm" value={s.duration_min}
                onChange={(e) => update(s.name, { duration_min: parseInt(e.target.value) || 30 })} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>dəq</span>
              <button onClick={() => save(services)} className="text-xs font-medium px-2" style={{ color: "var(--accent)" }}>Saxla</button>
              <button onClick={() => remove(s.name)} className="btn-danger">Sil</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="text-sm font-semibold mb-2">Yeni xidmət</div>
        <div className="flex gap-2 flex-wrap">
          <input className="input !py-2 flex-1 min-w-40" placeholder="Xidmətin adı" value={newSvc.name} onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })} />
          <input type="number" className="input !py-2 w-24" placeholder="Qiymət" value={newSvc.price_min} onChange={(e) => setNewSvc({ ...newSvc, price_min: parseFloat(e.target.value) || 0 })} />
          <input type="number" className="input !py-2 w-20" placeholder="Dəq" value={newSvc.duration_min} onChange={(e) => setNewSvc({ ...newSvc, duration_min: parseInt(e.target.value) || 30 })} />
          <button onClick={add} className="btn-primary">Əlavə et</button>
        </div>
      </div>
    </div>
  );
}

/* ===== HOURS TAB ===== */
function HoursTab({ biz, onUpdate }: { biz: any; onUpdate: (b: any) => void }) {
  const [hours, setHours] = useState<any[]>(
    biz.working_hours?.length
      ? biz.working_hours.map((h: any) => ({ ...h, breaks: h.breaks || [] }))
      : Array.from({ length: 7 }, (_, d) => ({ day: d, start: "09:00", end: "18:00", is_open: true, breaks: [] }))
  );
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("");
    await api("/businesses/mine/hours", { method: "PUT", body: hours });
    setMsg("Yadda saxlanıldı"); setTimeout(() => setMsg(""), 2000);
  };

  const updH = (i: number, patch: any) => setHours((h) => h.map((x, j) => (i === j ? { ...x, ...patch } : x)));
  const addBreak = (i: number) => setHours((h) => h.map((x, j) => (i === j ? { ...x, breaks: [...(x.breaks || []), { start: "13:00", end: "14:00" }] } : x)));
  const updBreak = (i: number, bi: number, patch: Partial<Break>) =>
    setHours((h) => h.map((x, j) => (i === j ? { ...x, breaks: x.breaks.map((b: Break, k: number) => (k === bi ? { ...b, ...patch } : b)) } : x)));
  const rmBreak = (i: number, bi: number) =>
    setHours((h) => h.map((x, j) => (i === j ? { ...x, breaks: x.breaks.filter((_: Break, k: number) => k !== bi) } : x)));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-display">İş saatları</h2>
        {msg && <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>{msg}</span>}
      </div>
      <div className="space-y-2">
        {hours.map((h, i) => (
          <div key={i} className="card p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex items-center gap-2 sm:w-40 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" style={{ accentColor: "var(--accent)" }} checked={h.is_open} onChange={(e) => updH(i, { is_open: e.target.checked })} />
              <span className="font-medium text-sm">{DAYS[h.day]}</span>
            </label>
            {h.is_open ? (
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="time" className="input !py-1.5 !px-3 w-28 sm:w-32" value={h.start} onChange={(e) => updH(i, { start: e.target.value })} />
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                  <input type="time" className="input !py-1.5 !px-3 w-28 sm:w-32" value={h.end} onChange={(e) => updH(i, { end: e.target.value })} />
                  <button type="button" onClick={() => addBreak(i)} className="text-xs font-medium" style={{ color: "var(--accent)" }}>+ Fasilə</button>
                </div>
                {(h.breaks || []).length > 0 && (
                  <div className="mt-2 ml-1 space-y-1">
                    {h.breaks.map((br: Break, bi: number) => (
                      <div key={bi} className="flex items-center gap-2 text-xs flex-wrap">
                        <span>☕</span>
                        <input type="time" className="input !py-1 !px-2 w-24 text-xs" value={br.start} onChange={(e) => updBreak(i, bi, { start: e.target.value })} />
                        <span>—</span>
                        <input type="time" className="input !py-1 !px-2 w-24 text-xs" value={br.end} onChange={(e) => updBreak(i, bi, { end: e.target.value })} />
                        <button type="button" onClick={() => rmBreak(i, bi)} style={{ color: "var(--danger)" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Bağlı</span>
            )}
          </div>
        ))}
      </div>
      <button onClick={save} className="btn-primary mt-4">Yadda saxla</button>
    </div>
  );
}

/* ===== CLOSED DAYS TAB ===== */
function ClosedDaysTab({ biz, onUpdate }: { biz: any; onUpdate: (b: any) => void }) {
  const [days, setDays] = useState<ClosedDay[]>(biz.closed_days || []);
  const [newClosed, setNewClosed] = useState<ClosedDay>({ date: "", reason: "" });
  const [msg, setMsg] = useState("");

  const save = async (list: ClosedDay[]) => {
    setMsg("");
    const b = await api("/businesses/mine/closed-days", { method: "PUT", body: list });
    onUpdate(b); setDays(b.closed_days);
    setMsg("Yadda saxlanıldı"); setTimeout(() => setMsg(""), 2000);
  };

  const add = () => { if (!newClosed.date) return; save([...days, newClosed]); setNewClosed({ date: "", reason: "" }); };
  const remove = (date: string) => save(days.filter((d) => d.date !== date));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold font-display">Bağlı xüsusi günlər</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bayram, məzuniyyət və s.</p>
        </div>
        {msg && <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>{msg}</span>}
      </div>
      {days.length === 0 ? (
        <div className="text-sm italic mb-4" style={{ color: "var(--text-muted)" }}>Hələ bağlı gün əlavə edilməyib</div>
      ) : (
        <div className="space-y-2 mb-4">
          {days.map((d) => (
            <div key={d.date} className="card p-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{d.date}</div>
                {d.reason && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{d.reason}</div>}
              </div>
              <button onClick={() => remove(d.date)} className="btn-danger">Sil</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <input type="date" className="input !py-2 w-44" value={newClosed.date} onChange={(e) => setNewClosed({ ...newClosed, date: e.target.value })} />
        <input className="input !py-2 flex-1 min-w-40" placeholder="Səbəb (məs: Novruz bayramı)" value={newClosed.reason || ""} onChange={(e) => setNewClosed({ ...newClosed, reason: e.target.value })} />
        <button onClick={add} className="btn-primary">Əlavə et</button>
      </div>
    </div>
  );
}

/* ===== SHARED COMPONENTS ===== */
function BookingRow({ b }: { b: any }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
      >
        <div className="text-[10px] uppercase leading-none">{b.date.slice(5)}</div>
        <div className="text-sm font-bold leading-none mt-0.5">{b.start_time}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{b.service_name}</div>
        <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
          {b.customer_name} · {b.customer_phone}
        </div>
      </div>
      <div className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{b.duration_min} dəq</div>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="text-xl font-bold font-display">{value}</div>
    </div>
  );
}
