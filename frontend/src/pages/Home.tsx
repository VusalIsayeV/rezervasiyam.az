import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Home() {
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    api("/businesses", { auth: false }).then(setBusinesses).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center py-12 sm:py-20">
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium mb-6">
          ✨ Yeni nəsil rezervasiya platforması
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
          Bir kliklə{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            rezervasiya
          </span>
          <br />
          asan və sürətli
        </h1>
        <p className="text-base sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Bərbər, gözəllik salonu, restoran və daha çoxu — növbə gözləmədən, online.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/register" className="btn-primary text-base px-7 py-3">
            Biznesini qeydiyyatdan keçir →
          </Link>
          <a href="#businesses" className="btn-secondary text-base px-7 py-3">
            Biznesləri gör
          </a>
        </div>
      </div>

      <div id="businesses" className="pb-12 sm:pb-20">
        <div className="flex items-end justify-between mb-6 gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-3xl font-bold break-words">Bizneslər</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1 break-words">Keyfiyyətli xidmətlər, hamı yoxlanılmış</p>
          </div>
          <div className="text-xs sm:text-sm text-slate-500 shrink-0">{businesses.length} biznes</div>
        </div>

        {businesses.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">🏪</div>
            <p className="text-slate-500">Hələ ki biznes yoxdur. İlk sən ol!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {businesses.map((b) => (
              <Link
                key={b.id}
                to={`/b/${b.slug}`}
                className="card p-5 hover:-translate-y-1 transition-all duration-300 group"
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
                <div className="font-bold text-lg group-hover:text-indigo-600 transition">
                  {b.name}
                </div>
                <div className="text-xs text-indigo-600 font-medium uppercase tracking-wide mt-1">
                  {b.category_slug}
                </div>
                <div className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                  <span>📍</span>
                  <span className="truncate">{b.location?.address}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
