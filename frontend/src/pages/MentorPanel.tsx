import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function MentorPanel() {
  const [list, setList] = useState<any[]>([]);

  const load = () => api("/businesses/pending").then(setList);
  useEffect(() => {
    load();
  }, []);

  const decide = async (id: number, approve: boolean) => {
    await api(`/businesses/${id}/approve`, { method: "POST", body: { approve } });
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mentor Paneli</h1>
        <p className="text-slate-500 mt-1">Gözləyən biznes müraciətləri — {list.length}</p>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-slate-500">Gözləyən müraciət yoxdur</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((b) => (
            <div key={b.id} className="card p-6">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-xl">{b.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      {b.category_slug}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">/b/{b.slug}</div>
                  <p className="mt-3 text-slate-700">{b.about}</p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span>📧 {b.contact_email}</span>
                    <span>📞 {b.contact_phone}</span>
                    <span>📍 {b.location?.address}</span>
                  </div>

                  {b.services?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {b.services.map((s: any) => (
                        <span key={s.name} className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {s.name} · {s.price_min}
                          {s.price_max ? `-${s.price_max}` : ""} AZN · {s.duration_min}dq
                        </span>
                      ))}
                    </div>
                  )}

                  {b.images?.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {b.images.map((src: string, i: number) => (
                        <img key={i} src={src} className="w-20 h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => decide(b.id, true)}
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl transition"
                  >
                    ✓ Təsdiqlə
                  </button>
                  <button
                    onClick={() => decide(b.id, false)}
                    className="inline-flex items-center justify-center gap-2 bg-white text-red-600 font-medium px-5 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition"
                  >
                    ✕ Rədd et
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
