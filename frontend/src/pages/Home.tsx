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

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (activeCat) params.set("category", activeCat);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    const qs = params.toString();
    setLoading(true);
    const t = setTimeout(() => {
      api(`/businesses${qs ? `?${qs}` : ""}`, { auth: false })
        .then(setBusinesses)
        .catch(() => setBusinesses([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, activeCat, coords]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Brauzeriniz lokasiyanı dəstəkləmir");
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => alert("Lokasiya icazəsi verilmədi")
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 overflow-x-hidden">
      <section className="text-center py-12 sm:py-20">
        <div
          className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6"
          style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          Yeni nəsil rezervasiya platforması
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-display mb-5 leading-[1.05] break-words">
          Bir kliklə rezervasiya
          <br />
          <span style={{ color: "var(--text-muted)" }}>asan və sürətli.</span>
        </h1>
        <p className="text-base sm:text-lg mb-10 max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
          Bərbər, gözəllik salonu, restoran və daha çoxu — növbə gözləmədən, online.
        </p>

        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 flex-wrap">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Biznes adı və ya ünvan axtar..."
              className="input flex-1 min-w-0"
            />
            <button
              onClick={useMyLocation}
              className="btn-secondary shrink-0"
              style={coords ? { borderColor: "var(--text)" } : undefined}
            >
              📍 Yaxınımda
            </button>
            {coords && (
              <button
                onClick={() => setCoords(null)}
                className="text-sm px-2 hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <CatChip active={activeCat === ""} onClick={() => setActiveCat("")}>
            Hamısı
          </CatChip>
          {cats.map((c) => (
            <CatChip
              key={c.slug}
              active={activeCat === c.slug}
              onClick={() => setActiveCat(activeCat === c.slug ? "" : c.slug)}
            >
              <span>{c.icon || "🏪"}</span>
              <span>{c.name}</span>
            </CatChip>
          ))}
        </div>
      </div>

      <section id="businesses" className="pb-16 sm:pb-24">
        <div className="flex items-end justify-between mb-6 gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold font-display break-words">Bizneslər</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {coords ? "Sizə ən yaxın olanlar" : "Keyfiyyətli xidmətlər"}
            </p>
          </div>
          <div className="text-xs sm:text-sm shrink-0" style={{ color: "var(--text-muted)" }}>
            {businesses.length} biznes
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Yüklənir...</div>
        ) : businesses.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p style={{ color: "var(--text-muted)" }}>Heç nə tapılmadı</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {businesses.map((b) => (
              <Link
                key={b.id}
                to={`/b/${b.slug}`}
                className="card p-4 group min-w-0 overflow-hidden hover:-translate-y-0.5 transition-transform"
              >
                <div
                  className="w-full aspect-[16/10] rounded-xl mb-4 overflow-hidden flex items-center justify-center"
                  style={{ background: "var(--bg)" }}
                >
                  {b.images?.[0] ? (
                    <img src={b.images[0]} alt={b.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl opacity-30">🏪</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-base truncate">{b.name}</div>
                  {b.distance_km !== undefined && (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full shrink-0 font-medium"
                      style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                      {b.distance_km} km
                    </span>
                  )}
                </div>
                <div className="text-[11px] uppercase tracking-wider mt-1 font-medium" style={{ color: "var(--text-muted)" }}>
                  {b.category_slug}
                </div>
                <div className="text-sm mt-2 flex items-center gap-1 min-w-0" style={{ color: "var(--text-muted)" }}>
                  <span className="shrink-0">📍</span>
                  <span className="truncate min-w-0">{b.location?.address}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1.5"
      style={
        active
          ? { background: "var(--accent)", color: "var(--accent-contrast)", border: "1px solid var(--accent)" }
          : { background: "var(--bg-elev)", color: "var(--text)", border: "1px solid var(--border)" }
      }
    >
      {children}
    </button>
  );
}
