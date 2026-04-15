import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Cat = { slug: string; name: string; icon?: string };

export default function Home() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api("/categories", { auth: false }).then((r) => setCats(r.categories));
  }, []);

  const fetchBusinesses = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (activeCat) params.set("category", activeCat);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    const qs = params.toString();
    setLoading(true);
    api(`/businesses${qs ? `?${qs}` : ""}`, { auth: false })
      .then(setBusinesses)
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(fetchBusinesses, 250);
    return () => clearTimeout(t);
  }, [q, activeCat, coords]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Brauzeriniz lokasiyanı dəstəkləmir");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => alert("Lokasiya icazəsi verilmədi")
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 overflow-x-hidden">
      <div className="text-center py-10 sm:py-16">
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium mb-6">
          ✨ Yeni nəsil rezervasiya platforması
        </div>
        <h1 className="text-2xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight break-words">
          Bir kliklə{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            rezervasiya
          </span>
          <br />
          asan və sürətli
        </h1>
        <p className="text-base sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Bərbər, gözəllik salonu, restoran və daha çoxu — növbə gözləmədən, online.
        </p>

        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 flex-wrap">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 Biznes adı və ya ünvan axtar..."
              className="input flex-1 min-w-0"
            />
            <button
              onClick={useMyLocation}
              className={`btn-secondary shrink-0 ${coords ? "!bg-indigo-50 !text-indigo-700 !border-indigo-300" : ""}`}
            >
              📍 {coords ? "Yaxınımda" : "Yaxınımda"}
            </button>
            {coords && (
              <button
                onClick={() => setCoords(null)}
                className="text-sm text-slate-500 hover:text-red-600 px-2"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setActiveCat("")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              activeCat === "" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
            }`}
          >
            Hamısı
          </button>
          {cats.map((c) => (
            <button
              key={c.slug}
              onClick={() => setActiveCat(activeCat === c.slug ? "" : c.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
                activeCat === c.slug ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
              }`}
            >
              <span>{c.icon || "🏪"}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div id="businesses" className="pb-12 sm:pb-20">
        <div className="flex items-end justify-between mb-6 gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-3xl font-bold break-words">Bizneslər</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              {coords ? "Sizə ən yaxın olanlar" : "Keyfiyyətli xidmətlər"}
            </p>
          </div>
          <div className="text-xs sm:text-sm text-slate-500 shrink-0">{businesses.length} biznes</div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-8">Yüklənir...</div>
        ) : businesses.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-slate-500">Heç nə tapılmadı</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {businesses.map((b) => (
              <Link
                key={b.id}
                to={`/b/${b.slug}`}
                className="card p-5 hover:-translate-y-1 transition-all duration-300 group min-w-0 overflow-hidden"
              >
                <div className="w-full aspect-[16/10] rounded-xl mb-4 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  {b.images?.[0] ? (
                    <img
                      src={b.images[0]}
                      alt={b.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">🏪</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-lg group-hover:text-indigo-600 transition truncate">
                    {b.name}
                  </div>
                  {b.distance_km !== undefined && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">
                      {b.distance_km} km
                    </span>
                  )}
                </div>
                <div className="text-xs text-indigo-600 font-medium uppercase tracking-wide mt-1">
                  {b.category_slug}
                </div>
                <div className="text-sm text-slate-500 mt-2 flex items-center gap-1 min-w-0">
                  <span className="shrink-0">📍</span>
                  <span className="truncate min-w-0">{b.location?.address}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
