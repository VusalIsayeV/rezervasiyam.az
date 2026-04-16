import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import MapPicker from "../components/MapPicker";
import { validatePhone, validateRequired, normalizePhone } from "../lib/validators";

export default function BusinessPublic() {
  const { slug } = useParams();
  const [biz, setBiz] = useState<any>(null);
  const [service, setService] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<string[]>([]);
  const [pickedSlot, setPickedSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api(`/businesses/by-slug/${slug}`, { auth: false }).then(setBiz).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (biz && service && date) {
      api(
        `/bookings/availability?business_id=${biz.id}&service_name=${encodeURIComponent(service)}&date=${date}`,
        { auth: false }
      )
        .then((r) => setSlots(r.slots))
        .catch(() => setSlots([]));
    }
  }, [biz, service, date]);

  const book = async () => {
    const errs: typeof errors = {};
    const nMsg = validateRequired(name, "Ad", 2, 80);
    const pMsg = validatePhone(phone);
    if (nMsg) errs.name = nMsg;
    if (pMsg) errs.phone = pMsg;
    setErrors(errs);
    setMsg("");
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await api("/bookings", {
        method: "POST",
        auth: false,
        body: {
          business_id: biz.id,
          service_name: service,
          customer_name: name.trim(),
          customer_phone: normalizePhone(phone),
          date,
          start_time: pickedSlot,
        },
      });
      setMsg("✓ Rezervasiyan təsdiqləndi!");
      setPickedSlot("");
      setName("");
      setPhone("");
      const r = await api(
        `/bookings/availability?business_id=${biz.id}&service_name=${encodeURIComponent(service)}&date=${date}`,
        { auth: false }
      );
      setSlots(r.slots);
    } catch (e: any) {
      setErrors({ form: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!biz)
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center" style={{ color: "var(--text-muted)" }}>
        Yüklənir...
      </div>
    );

  const selectedService = biz.services.find((s: any) => s.name === service);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 overflow-x-hidden">
      <div className="card overflow-hidden">
        {biz.images?.[0] ? (
          <div className="relative h-56 sm:h-72 md:h-80">
            <img src={biz.images[0]} alt={biz.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 sm:p-7 text-white">
              <div className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-medium uppercase tracking-wider mb-3">
                {biz.category_slug}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold font-display">{biz.name}</h1>
              <div className="mt-2 flex items-center gap-1 text-sm opacity-90">
                <span>📍</span>
                <span className="truncate">{biz.location?.address}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">{biz.name}</h1>
            <div className="mt-1" style={{ color: "var(--text-muted)" }}>📍 {biz.location?.address}</div>
          </div>
        )}

        <div className="p-5 sm:p-7">
          <p className="leading-relaxed" style={{ color: "var(--text)" }}>{biz.about}</p>
          <div className="flex gap-4 mt-4 text-sm flex-wrap" style={{ color: "var(--text-muted)" }}>
            <a href={`tel:${biz.contact_phone}`} className="hover:opacity-70">📞 {biz.contact_phone}</a>
            <a href={`mailto:${biz.contact_email}`} className="hover:opacity-70">📧 {biz.contact_email}</a>
          </div>
          {biz.location?.lat && (
            <div className="mt-5 rounded-xl overflow-hidden">
              <MapPicker lat={biz.location.lat} lng={biz.location.lng} readOnly height={260} />
            </div>
          )}
          {biz.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {biz.images.slice(1).map((src: string, i: number) => (
                <img key={i} src={src} alt="" className="w-full h-20 sm:h-24 object-cover rounded-xl" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 sm:p-7 mt-6">
        <h2 className="text-2xl font-bold font-display mb-6">Rezervasiya et</h2>

        <div className="space-y-6">
          <div>
            <label className="label">1. Xidmət seç</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {biz.services.map((s: any) => {
                const active = service === s.name;
                return (
                  <button
                    key={s.name}
                    onClick={() => {
                      setService(s.name);
                      setPickedSlot("");
                    }}
                    className="text-left p-4 rounded-xl transition"
                    style={
                      active
                        ? { background: "var(--accent)", color: "var(--accent-contrast)", border: "1px solid var(--accent)" }
                        : { background: "var(--bg-elev)", border: "1px solid var(--border)" }
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{s.name}</span>
                      {s.discount && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: active ? "rgba(255,255,255,0.25)" : "rgba(220,38,38,0.1)", color: active ? "#fff" : "var(--danger)" }}>
                          {s.discount.type === "percent" ? `-${s.discount.value}%` : `-${s.discount.value}₼`}
                        </span>
                      )}
                    </div>
                    <div className="text-sm mt-1 opacity-70">
                      {s.discounted_price !== undefined ? (
                        <>
                          <s className="opacity-50">{s.price_min} ₼</s>{" "}
                          <b>{s.discounted_price} ₼</b>
                        </>
                      ) : (
                        <>{s.price_min}{s.price_max ? `-${s.price_max}` : ""} ₼</>
                      )}
                      {" · "}{s.duration_min} dəq
                    </div>
                    {s.discount?.label && <div className="text-[11px] mt-1 opacity-60">{s.discount.label}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {service && (
            <div>
              <label className="label">2. Tarix seç</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPickedSlot("");
                }}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
          )}

          {service && (
            <div>
              <label className="label">3. Vaxt seç</label>
              {slots.length === 0 ? (
                <div className="p-6 text-center text-sm rounded-xl" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                  Bu gün üçün boş vaxt yoxdur
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((s) => {
                    const active = pickedSlot === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setPickedSlot(s)}
                        className="py-2.5 rounded-xl font-medium text-sm transition"
                        style={
                          active
                            ? { background: "var(--accent)", color: "var(--accent-contrast)" }
                            : { background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {pickedSlot && (
            <div className="space-y-3 p-5 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="text-sm font-semibold">4. Məlumatlarını daxil et</div>
              <div>
                <input
                  className="input"
                  placeholder="Adın və soyadın"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>
              <div>
                <input
                  className="input"
                  placeholder="+994 50 123 45 67"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                />
                {errors.phone && <div className="error-text">{errors.phone}</div>}
              </div>
              <div className="text-xs rounded-lg p-3" style={{ background: "var(--bg-elev)", color: "var(--text-muted)" }}>
                Seçim: <b style={{ color: "var(--text)" }}>{selectedService?.name}</b> · {date} ·{" "}
                <b style={{ color: "var(--text)" }}>{pickedSlot}</b>
              </div>
              <button onClick={book} disabled={loading} className="btn-primary w-full !py-3">
                {loading ? "Göndərilir..." : "Təsdiq et"}
              </button>
            </div>
          )}

          {msg && (
            <div
              className="px-4 py-3 rounded-xl font-medium text-sm"
              style={{ background: "rgba(16,185,129,0.1)", color: "#047857" }}
            >
              {msg}
            </div>
          )}
          {errors.form && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(220,38,38,0.08)", color: "var(--danger)" }}
            >
              {errors.form}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
