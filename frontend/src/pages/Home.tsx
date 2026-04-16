import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Cat = { slug: string; name: string; icon?: string };

export default function Home() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("");
  const [showFilters, setShowFilters] = useState(false);
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
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);
    if (sort) params.set("sort", sort);
    const qs = params.toString();
    setLoading(true);
    const t = setTimeout(() => {
      api(`/businesses${qs ? `?${qs}` : ""}`, { auth: false })
        .then(setBusinesses)
        .catch(() => setBusinesses([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q, activeCat, coords, priceMin, priceMax, sort]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Brauzeriniz lokasiyanı dəstəkləmir");
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => alert("Lokasiya icazəsi verilmədi")
    );
  };

  const activeFilterCount = [activeCat, priceMin, priceMax, sort, coords].filter(Boolean).length;

  const clearAll = () => {
    setActiveCat("");
    setPriceMin("");
    setPriceMax("");
    setSort("");
    setCoords(null);
    setQ("");
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 overflow-x-hidden">
      {/* Hero */}
      <section className="text-center py-10 sm:py-16">
        <div
          className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-5"
          style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          Yeni nəsil rezervasiya platforması
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-display mb-4 leading-[1.05] break-words">
          Bir kliklə rezervasiya
          <br />
          <span style={{ color: "var(--text-muted)" }}>asan və sürətli.</span>
        </h1>
        <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
          Bərbər, gözəllik salonu, restoran və daha çoxu — növbə gözləmədən, online.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base" style={{ color: "var(--text-muted)" }}>🔍</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Biznes, xidmət və ya ünvan axtar..."
                className="input !pl-10 flex-1"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary shrink-0 relative"
            >
              ⚙️ Filter
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={useMyLocation}
              className="btn-secondary shrink-0 hidden sm:flex"
              style={coords ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
            >
              📍 Yaxınımda
            </button>
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold font-display text-sm">Filterlər</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                Hamısını sıfırla
              </button>
            )}
          </div>

          {/* Price Range */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              Qiymət aralığı (₼)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="input !py-2 w-28"
              />
              <span style={{ color: "var(--text-muted)" }}>—</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="input !py-2 w-28"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              Sıralama
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "", label: "Standart" },
                { value: "price_asc", label: "Ucuzdan bahaya" },
                { value: "price_desc", label: "Bahadan ucuza" },
                { value: "name", label: "A-Z" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                  style={
                    sort === s.value
                      ? { background: "var(--accent)", color: "var(--accent-contrast)" }
                      : { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location (mobile) */}
          <div className="sm:hidden">
            <button
              onClick={useMyLocation}
              className="btn-secondary w-full"
              style={coords ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
            >
              📍 {coords ? "Yaxınımda (aktiv)" : "Yaxınımdakıları göstər"}
            </button>
            {coords && (
              <button
                onClick={() => setCoords(null)}
                className="text-xs mt-1 block w-full text-center"
                style={{ color: "var(--text-muted)" }}
              >
                Lokasiyanı söndür
              </button>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-6">
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

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {activeCat && (
            <FilterTag label={cats.find((c) => c.slug === activeCat)?.name || activeCat} onRemove={() => setActiveCat("")} />
          )}
          {priceMin && <FilterTag label={`Min: ${priceMin}₼`} onRemove={() => setPriceMin("")} />}
          {priceMax && <FilterTag label={`Max: ${priceMax}₼`} onRemove={() => setPriceMax("")} />}
          {sort && (
            <FilterTag
              label={sort === "price_asc" ? "Ucuzdan bahaya" : sort === "price_desc" ? "Bahadan ucuza" : "A-Z"}
              onRemove={() => setSort("")}
            />
          )}
          {coords && <FilterTag label="📍 Yaxınımda" onRemove={() => setCoords(null)} />}
        </div>
      )}

      {/* Results */}
      <section id="businesses" className="pb-16 sm:pb-24">
        <div className="flex items-end justify-between mb-5 gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold font-display break-words">Bizneslər</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {coords ? "Sizə ən yaxın olanlar" : activeFilterCount > 0 ? "Filter nəticələri" : "Keyfiyyətli xidmətlər"}
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
            <p className="mb-3" style={{ color: "var(--text-muted)" }}>Heç nə tapılmadı</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="btn-secondary text-sm">Filterləri sıfırla</button>
            )}
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
                  className="w-full aspect-[16/10] rounded-xl mb-3 overflow-hidden flex items-center justify-center"
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
                {/* Price & Service Count */}
                <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {b.min_price > 0 && (
                    <span className="font-semibold" style={{ color: "var(--text)" }}>
                      {b.min_price === b.max_price ? `${b.min_price} ₼` : `${b.min_price}–${b.max_price} ₼`}
                    </span>
                  )}
                  {b.service_count > 0 && <span>{b.service_count} xidmət</span>}
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

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
    >
      {label}
      <button onClick={onRemove} className="hover:opacity-70 text-sm leading-none">✕</button>
    </span>
  );
}
