import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Tab = "pending" | "all";

export default function MentorPanel() {
  const [tab, setTab] = useState<Tab>("pending");
  const [list, setList] = useState<any[]>([]);

  const load = () => {
    const url = tab === "pending" ? "/businesses/pending" : "/businesses/all";
    api(url).then(setList).catch(() => setList([]));
  };

  useEffect(() => {
    load();
  }, [tab]);

  const decide = async (id: number, approve: boolean) => {
    await api(`/businesses/${id}/approve`, { method: "POST", body: { approve } });
    load();
  };

  const setStatus = async (id: number, status: string) => {
    await api(`/businesses/${id}/status`, { method: "POST", body: { status } });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Bu biznesi tamamilə silmək istədiyinizə əminsiniz?")) return;
    await api(`/businesses/${id}`, { method: "DELETE" });
    load();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-emerald-100 text-emerald-700",
      rejected: "bg-red-100 text-red-700",
      disabled: "bg-slate-200 text-slate-600",
    };
    const labels: Record<string, string> = {
      pending: "Gözləyir",
      approved: "Aktiv",
      rejected: "Rədd edilib",
      disabled: "Deaktiv",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[s] || ""}`}>
        {labels[s] || s}
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Mentor Paneli</h1>
        <p className="text-slate-500 mt-1">Cəmi {list.length}</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("pending")}
          className={tab === "pending" ? "btn-primary" : "btn-secondary"}
        >
          Gözləyənlər
        </button>
        <button
          onClick={() => setTab("all")}
          className={tab === "all" ? "btn-primary" : "btn-secondary"}
        >
          Hamısı
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-slate-500">Heç nə yoxdur</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((b) => (
            <div key={b.id} className="card p-5 sm:p-6 min-w-0 overflow-hidden">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg sm:text-xl break-words">{b.name}</h3>
                    {statusBadge(b.status)}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      {b.category_slug}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1 break-words">/b/{b.slug}</div>
                  {b.about && <p className="mt-3 text-slate-700 break-words">{b.about}</p>}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 break-words">
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
                        <img key={i} src={src} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  {b.status === "pending" && (
                    <>
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
                    </>
                  )}
                  {b.status === "approved" && (
                    <button
                      onClick={() => setStatus(b.id, "disabled")}
                      className="inline-flex items-center justify-center bg-amber-50 text-amber-700 font-medium px-4 py-2 rounded-xl border border-amber-200 hover:bg-amber-100 transition text-sm"
                    >
                      Deaktiv et
                    </button>
                  )}
                  {(b.status === "disabled" || b.status === "rejected") && (
                    <button
                      onClick={() => setStatus(b.id, "approved")}
                      className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 font-medium px-4 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition text-sm"
                    >
                      Aktiv et
                    </button>
                  )}
                  <button
                    onClick={() => remove(b.id)}
                    className="inline-flex items-center justify-center bg-red-50 text-red-600 font-medium px-4 py-2 rounded-xl border border-red-200 hover:bg-red-100 transition text-sm"
                  >
                    Sil
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
