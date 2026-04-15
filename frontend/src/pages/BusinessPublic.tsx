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
  const [err, setErr] = useState("");
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
    setErr("");
    setMsg("");
    const v = validateRequired(name, "Ad", 2, 80) || validatePhone(phone);
    if (v) {
      setErr(v);
      return;
    }
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
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!biz)
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center text-slate-500">Yüklənir...</div>
    );

  const selectedService = biz.services.find((s: any) => s.name === service);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="card overflow-hidden">
        {biz.images?.[0] && (
          <div className="relative h-64 md:h-80">
            <img src={biz.images[0]} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium uppercase tracking-wide mb-2">
                {biz.category_slug}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold">{biz.name}</h1>
              <div className="mt-2 flex items-center gap-1 text-sm opacity-90">
                <span>📍</span>
                <span>{biz.location?.address}</span>
              </div>
            </div>
          </div>
        )}
        {!biz.images?.[0] && (
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-2xl sm:text-3xl font-bold">{biz.name}</h1>
            <div className="text-slate-500 mt-1">📍 {biz.location?.address}</div>
          </div>
        )}

        <div className="p-6">
          <p className="text-slate-700 leading-relaxed">{biz.about}</p>
          <div className="flex gap-4 mt-4 text-sm text-slate-500">
            <a href={`tel:${biz.contact_phone}`} className="hover:text-indigo-600">
              📞 {biz.contact_phone}
            </a>
            <a href={`mailto:${biz.contact_email}`} className="hover:text-indigo-600">
              📧 {biz.contact_email}
            </a>
          </div>
          {biz.location?.lat && (
            <div className="mt-5">
              <MapPicker lat={biz.location.lat} lng={biz.location.lng} readOnly height={260} />
            </div>
          )}
          {biz.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {biz.images.slice(1).map((src: string, i: number) => (
                <img key={i} src={src} className="w-full h-24 object-cover rounded-xl" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 mt-6">
        <h2 className="text-2xl font-bold mb-5">Rezervasiya et</h2>

        <div className="space-y-5">
          <div>
            <label className="label">1. Xidmət seç</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {biz.services.map((s: any) => (
                <button
                  key={s.name}
                  onClick={() => {
                    setService(s.name);
                    setPickedSlot("");
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition ${
                    service === s.name
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-indigo-200"
                  }`}
                >
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {s.price_min}
                    {s.price_max ? `-${s.price_max}` : ""} AZN · {s.duration_min} dəq
                  </div>
                </button>
              ))}
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
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl text-sm">
                  Bu gün üçün boş vaxt yoxdur
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setPickedSlot(s)}
                      className={`py-2.5 rounded-xl font-medium text-sm transition ${
                        pickedSlot === s
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200"
                          : "bg-slate-50 hover:bg-indigo-50 text-slate-700"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {pickedSlot && (
            <div className="space-y-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="text-sm font-semibold text-indigo-900">
                4. Məlumatlarını daxil et
              </div>
              <input className="input" placeholder="Adın və soyadın" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="input" placeholder="Telefon nömrən" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <div className="text-xs text-slate-600 bg-white/60 rounded-lg p-3">
                Seçim: <b>{selectedService?.name}</b> · {date} · <b>{pickedSlot}</b>
              </div>
              <button onClick={book} disabled={!name || !phone || loading} className="btn-primary w-full py-3">
                {loading ? "Göndərilir..." : "Təsdiq et"}
              </button>
            </div>
          )}

          {msg && (
            <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl font-medium">
              {msg}
            </div>
          )}
          {err && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{err}</div>
          )}
        </div>
      </div>
    </div>
  );
}
