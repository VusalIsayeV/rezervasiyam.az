import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { validatePhone, validateRequired, normalizePhone } from "../lib/validators";

const DAYS = ["Bazar ertəsi", "Çərşənbə ax.", "Çərşənbə", "Cümə ax.", "Cümə", "Şənbə", "Bazar"];

type Service = { name: string; price_min: number; price_max?: number; duration_min: number };
type Break = { start: string; end: string };
type ClosedDay = { date: string; reason?: string };

export default function OwnerDashboard() {
  const [biz, setBiz] = useState<any>(null);
  const [hours, setHours] = useState<any[]>(
    Array.from({ length: 7 }, (_, d) => ({ day: d, start: "09:00", end: "18:00", is_open: true, breaks: [] as Break[] }))
  );
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [newClosed, setNewClosed] = useState<ClosedDay>({ date: "", reason: "" });
  const [cdMsg, setCdMsg] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [newSvc, setNewSvc] = useState<Service>({ name: "", price_min: 0, duration_min: 30 });
  const [svcMsg, setSvcMsg] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/businesses/mine").then((b) => {
      setBiz(b);
      if (b?.working_hours?.length) {
        setHours(b.working_hours.map((h: any) => ({ ...h, breaks: h.breaks || [] })));
      }
      if (b?.closed_days) setClosedDays(b.closed_days);
      if (b?.services) setServices(b.services);
      if (b) api(`/bookings/business/${b.id}`).then(setBookings);
    });
  }, []);

  if (!biz) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="text-2xl font-bold mb-2">Hələ biznesin yoxdur</h2>
        <p className="text-slate-500 mb-6">İlk biznesini yarat və rezervasiya qəbul etməyə başla</p>
        <Link to="/business/new" className="btn-primary">
          Biznes yarat →
        </Link>
      </div>
    );
  }

  const saveHours = async () => {
    setMsg("");
    await api("/businesses/mine/hours", { method: "PUT", body: hours });
    setMsg("✓ Yadda saxlanıldı");
    setTimeout(() => setMsg(""), 2000);
  };

  const updH = (i: number, patch: any) => {
    setHours((h) => h.map((x, j) => (i === j ? { ...x, ...patch } : x)));
  };

  const addBreak = (i: number) => {
    setHours((h) =>
      h.map((x, j) => (i === j ? { ...x, breaks: [...(x.breaks || []), { start: "13:00", end: "14:00" }] } : x))
    );
  };

  const updBreak = (i: number, bi: number, patch: Partial<Break>) => {
    setHours((h) =>
      h.map((x, j) =>
        i === j ? { ...x, breaks: x.breaks.map((b: Break, k: number) => (k === bi ? { ...b, ...patch } : b)) } : x
      )
    );
  };

  const rmBreak = (i: number, bi: number) => {
    setHours((h) =>
      h.map((x, j) => (i === j ? { ...x, breaks: x.breaks.filter((_: Break, k: number) => k !== bi) } : x))
    );
  };

  const saveClosedDays = async (list: ClosedDay[]) => {
    setCdMsg("");
    const b = await api("/businesses/mine/closed-days", { method: "PUT", body: list });
    setBiz(b);
    setClosedDays(b.closed_days);
    setCdMsg("✓ Yadda saxlanıldı");
    setTimeout(() => setCdMsg(""), 2000);
  };

  const addClosedDay = () => {
    if (!newClosed.date) return;
    const list = [...closedDays, newClosed];
    setClosedDays(list);
    setNewClosed({ date: "", reason: "" });
    saveClosedDays(list);
  };

  const rmClosedDay = (date: string) => {
    const list = closedDays.filter((d) => d.date !== date);
    setClosedDays(list);
    saveClosedDays(list);
  };

  const saveServices = async (list: Service[]) => {
    const b = await api("/businesses/mine/services", { method: "PUT", body: list });
    setBiz(b);
    setServices(b.services);
    setSvcMsg("✓ Yadda saxlanıldı");
    setTimeout(() => setSvcMsg(""), 2000);
  };

  const addService = () => {
    if (!newSvc.name.trim()) return;
    const list = [...services, newSvc];
    setServices(list);
    setNewSvc({ name: "", price_min: 0, duration_min: 30 });
    saveServices(list);
  };

  const removeService = (name: string) => {
    const list = services.filter((s) => s.name !== name);
    setServices(list);
    saveServices(list);
  };

  const updateService = (name: string, patch: Partial<Service>) => {
    setServices((s) => s.map((x) => (x.name === name ? { ...x, ...patch } : x)));
  };

  const statusBadge =
    biz.status === "approved" ? (
      <span className="badge-approved">● Təsdiqlənib</span>
    ) : biz.status === "rejected" ? (
      <span className="badge-rejected">● Rədd edilib</span>
    ) : (
      <span className="badge-pending">● Gözləyir</span>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div className="card p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{biz.name}</h1>
              {statusBadge}
            </div>
            <div className="text-sm text-slate-500 mt-1">rezervasiyam.az/b/{biz.slug}</div>
            <div className="text-xs text-slate-400 mt-1">{biz.category_slug} · {biz.location?.address}</div>
          </div>
          {biz.status === "approved" && (
            <Link to={`/b/${biz.slug}`} className="btn-secondary text-sm">
              Açıq səhifə →
            </Link>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">İş saatları</h2>
          {msg && <span className="text-emerald-600 text-sm font-medium">{msg}</span>}
        </div>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-slate-50">
              <label className="flex items-center gap-2 sm:w-40 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-indigo-600"
                  checked={h.is_open}
                  onChange={(e) => updH(i, { is_open: e.target.checked })}
                />
                <span className="font-medium text-sm">{DAYS[h.day]}</span>
              </label>
              {h.is_open ? (
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="time"
                      className="input py-1.5 px-3 w-28 sm:w-32"
                      value={h.start}
                      onChange={(e) => updH(i, { start: e.target.value })}
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="time"
                      className="input py-1.5 px-3 w-28 sm:w-32"
                      value={h.end}
                      onChange={(e) => updH(i, { end: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => addBreak(i)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      + Fasilə
                    </button>
                  </div>
                  {(h.breaks || []).length > 0 && (
                    <div className="mt-2 ml-1 space-y-1">
                      {h.breaks.map((br: Break, bi: number) => (
                        <div key={bi} className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="text-slate-500">☕</span>
                          <input
                            type="time"
                            className="input py-1 px-2 w-24 text-xs"
                            value={br.start}
                            onChange={(e) => updBreak(i, bi, { start: e.target.value })}
                          />
                          <span>—</span>
                          <input
                            type="time"
                            className="input py-1 px-2 w-24 text-xs"
                            value={br.end}
                            onChange={(e) => updBreak(i, bi, { end: e.target.value })}
                          />
                          <button type="button" onClick={() => rmBreak(i, bi)} className="text-red-500">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 text-sm">Bağlı</span>
              )}
            </div>
          ))}
        </div>
        <button onClick={saveHours} className="btn-primary mt-4">
          Yadda saxla
        </button>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Bağlı xüsusi günlər</h2>
            <p className="text-slate-500 text-sm">Bayram, məzuniyyət və s.</p>
          </div>
          {cdMsg && <span className="text-emerald-600 text-sm font-medium">{cdMsg}</span>}
        </div>

        {closedDays.length === 0 ? (
          <div className="text-slate-400 text-sm italic mb-4">Hələ bağlı gün əlavə edilməyib</div>
        ) : (
          <div className="space-y-2 mb-4">
            {closedDays.map((d) => (
              <div key={d.date} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="flex-1">
                  <div className="font-medium">{d.date}</div>
                  {d.reason && <div className="text-xs text-slate-500">{d.reason}</div>}
                </div>
                <button onClick={() => rmClosedDay(d.date)} className="btn-danger">
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap pt-4 border-t border-slate-200">
          <input
            type="date"
            className="input py-2 w-44"
            value={newClosed.date}
            onChange={(e) => setNewClosed({ ...newClosed, date: e.target.value })}
          />
          <input
            className="input py-2 flex-1 min-w-40"
            placeholder="Səbəb (məs: Novruz bayramı)"
            value={newClosed.reason || ""}
            onChange={(e) => setNewClosed({ ...newClosed, reason: e.target.value })}
          />
          <button onClick={addClosedDay} className="btn-primary">
            Əlavə et
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Xidmətlər</h2>
          {svcMsg && <span className="text-emerald-600 text-sm font-medium">{svcMsg}</span>}
        </div>

        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.name} className="flex flex-col sm:flex-row gap-2 sm:items-center p-3 rounded-xl bg-slate-50">
              <div className="flex-1 font-medium">{s.name}</div>
              <div className="flex items-center gap-1 flex-wrap">
                <input
                  type="number"
                  className="input py-1.5 px-2 w-20 text-sm"
                  value={s.price_min}
                  onChange={(e) => updateService(s.name, { price_min: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-slate-400 text-xs">—</span>
                <input
                  type="number"
                  placeholder="max"
                  className="input py-1.5 px-2 w-20 text-sm"
                  value={s.price_max || ""}
                  onChange={(e) => updateService(s.name, { price_max: parseFloat(e.target.value) || undefined })}
                />
                <span className="text-xs text-slate-500">AZN</span>
                <input
                  type="number"
                  className="input py-1.5 px-2 w-16 text-sm"
                  value={s.duration_min}
                  onChange={(e) => updateService(s.name, { duration_min: parseInt(e.target.value) || 30 })}
                />
                <span className="text-xs text-slate-500">dəq</span>
                <button onClick={() => saveServices(services)} className="text-indigo-600 text-xs font-medium px-2">
                  Saxla
                </button>
                <button onClick={() => removeService(s.name)} className="btn-danger">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-slate-200">
          <div className="text-sm font-semibold mb-2">+ Yeni xidmət əlavə et</div>
          <div className="flex gap-2 flex-wrap">
            <input className="input py-2 flex-1 min-w-40" placeholder="Xidmətin adı" value={newSvc.name}
              onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })} />
            <input type="number" className="input py-2 w-24" placeholder="Qiymət" value={newSvc.price_min}
              onChange={(e) => setNewSvc({ ...newSvc, price_min: parseFloat(e.target.value) || 0 })} />
            <input type="number" className="input py-2 w-24" placeholder="Max" value={newSvc.price_max || ""}
              onChange={(e) => setNewSvc({ ...newSvc, price_max: parseFloat(e.target.value) || undefined })} />
            <input type="number" className="input py-2 w-20" placeholder="Dəq" value={newSvc.duration_min}
              onChange={(e) => setNewSvc({ ...newSvc, duration_min: parseInt(e.target.value) || 30 })} />
            <button onClick={addService} className="btn-primary">Əlavə et</button>
          </div>
        </div>
      </div>

      <OwnerBooking biz={biz} onBooked={() => api(`/bookings/business/${biz.id}`).then(setBookings)} />

      <div className="card p-6">
        <h2 className="text-xl font-bold mb-4">Rezervasiyalar</h2>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-2">📅</div>
            <p>Hələ rezervasiya yoxdur</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex flex-col items-center justify-center flex-shrink-0">
                  <div className="text-[10px] uppercase">{b.date.slice(5)}</div>
                  <div className="text-sm font-bold">{b.start_time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{b.service_name}</div>
                  <div className="text-sm text-slate-500 truncate">
                    {b.customer_name} · {b.customer_phone}
                  </div>
                </div>
                <div className="text-xs text-slate-400">{b.duration_min} dəq</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerBooking({ biz, onBooked }: { biz: any; onBooked: () => void }) {
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
      api(
        `/bookings/availability?business_id=${biz.id}&service_name=${encodeURIComponent(service)}&date=${date}`,
        { auth: false }
      )
        .then((r) => setSlots(r.slots))
        .catch(() => setSlots([]));
    }
  }, [service, date, biz.id]);

  const submit = async () => {
    setErr("");
    setMsg("");
    const v = validateRequired(name, "Ad", 2, 80) || validatePhone(phone);
    if (v) { setErr(v); return; }
    setLoading(true);
    try {
      await api("/bookings/owner", {
        method: "POST",
        body: {
          business_id: biz.id,
          service_name: service,
          customer_name: name.trim(),
          customer_phone: normalizePhone(phone),
          date,
          start_time: slot,
        },
      });
      setMsg("Müştəri rezervasiyası əlavə edildi");
      setSlot("");
      setName("");
      setPhone("");
      onBooked();
      const r = await api(
        `/bookings/availability?business_id=${biz.id}&service_name=${encodeURIComponent(service)}&date=${date}`,
        { auth: false }
      );
      setSlots(r.slots);
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-1">Müştəri yaz</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        Zəng və ya şəxsən müraciət edən müştəri üçün
      </p>

      <div className="space-y-4">
        <div>
          <label className="label">Xidmət</label>
          <select
            className="input"
            value={service}
            onChange={(e) => { setService(e.target.value); setSlot(""); }}
          >
            <option value="">Seç...</option>
            {(biz.services || []).map((s: any) => (
              <option key={s.name} value={s.name}>
                {s.name} — {s.duration_min} dəq
              </option>
            ))}
          </select>
        </div>

        {service && (
          <div>
            <label className="label">Tarix</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => { setDate(e.target.value); setSlot(""); }}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        )}

        {service && slots.length > 0 && (
          <div>
            <label className="label">Vaxt</label>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  style={
                    slot === s
                      ? { background: "var(--accent)", color: "var(--accent-contrast)" }
                      : { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {service && slots.length === 0 && (
          <div className="text-sm p-3 rounded-xl" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
            Bu tarix üçün boş vaxt yoxdur
          </div>
        )}

        {slot && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Müştəri adı</label>
                <input className="input" placeholder="Ad soyad" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input className="input" placeholder="+994 50 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <button onClick={submit} disabled={loading || !name || !phone} className="btn-primary">
              {loading ? "Göndərilir..." : "Rezervasiya yaz"}
            </button>
          </>
        )}

        {msg && (
          <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.1)", color: "#047857" }}>
            {msg}
          </div>
        )}
        {err && (
          <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(220,38,38,0.08)", color: "var(--danger)" }}>
            {err}
          </div>
        )}
      </div>
    </div>
  );
}
