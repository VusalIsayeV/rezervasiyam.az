import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Stats = {
  today: { count: number; revenue: number };
  week: { count: number; revenue: number };
  month: { count: number; revenue: number };
  total: { count: number; revenue: number };
  weekday_revenue: number;
  weekend_revenue: number;
  daily: { date: string; count: number; revenue: number }[];
  by_service: { name: string; count: number; revenue: number }[];
  by_hour: { hour: number; count: number }[];
};

export default function StatsPanel({ businessId }: { businessId: number }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api(`/bookings/stats/${businessId}`)
      .then(setStats)
      .catch((e) => setErr(e.message));
  }, [businessId]);

  if (err)
    return (
      <div className="card p-6 text-center" style={{ color: "var(--danger)" }}>
        {err}
      </div>
    );
  if (!stats)
    return (
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Yüklənir...
      </div>
    );

  const maxDaily = Math.max(...stats.daily.map((d) => d.revenue), 1);
  const maxHour = Math.max(...stats.by_hour.map((h) => h.count), 1);
  const maxSvc = Math.max(...stats.by_service.map((s) => s.revenue), 1);
  const totalWeekParts = (stats.weekday_revenue || 0) + (stats.weekend_revenue || 0) || 1;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Bu gün" count={stats.today.count} revenue={stats.today.revenue} />
        <SummaryCard label="Bu həftə" count={stats.week.count} revenue={stats.week.revenue} />
        <SummaryCard label="Bu ay" count={stats.month.count} revenue={stats.month.revenue} />
        <SummaryCard label="Ümumi" count={stats.total.count} revenue={stats.total.revenue} accent />
      </div>

      {/* Weekday vs Weekend */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4">Həftə içi vs Həftə sonu (bu ay)</h3>
        <div className="flex gap-3 items-end h-28">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="text-sm font-semibold">{stats.weekday_revenue} ₼</div>
            <div
              className="w-full rounded-lg transition-all"
              style={{
                height: `${(stats.weekday_revenue / totalWeekParts) * 100}%`,
                minHeight: 8,
                background: "var(--accent)",
                opacity: 0.8,
              }}
            />
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Həftə içi
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="text-sm font-semibold">{stats.weekend_revenue} ₼</div>
            <div
              className="w-full rounded-lg transition-all"
              style={{
                height: `${(stats.weekend_revenue / totalWeekParts) * 100}%`,
                minHeight: 8,
                background: "var(--accent)",
                opacity: 0.4,
              }}
            />
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Həftə sonu
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart (last 30 days) */}
      {stats.daily.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Günlük gəlir (son 30 gün)</h3>
          <div className="flex items-end gap-[2px] h-32 overflow-x-auto scrollbar-hide">
            {stats.daily.map((d) => (
              <div key={d.date} className="flex-1 min-w-[8px] flex flex-col items-center justify-end group relative">
                <div
                  className="w-full rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${(d.revenue / maxDaily) * 100}%`,
                    minHeight: d.revenue > 0 ? 4 : 1,
                    background: d.revenue > 0 ? "var(--accent)" : "var(--border)",
                  }}
                />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                  {d.date.slice(5)}: {d.revenue} ₼ · {d.count} rez.
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span>{stats.daily[0]?.date.slice(5)}</span>
            <span>{stats.daily[stats.daily.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* By Service */}
      {stats.by_service.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Xidmətlərə görə</h3>
          <div className="space-y-3">
            {stats.by_service.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate">{s.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {s.count} rez. · {s.revenue} ₼
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(s.revenue / maxSvc) * 100}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Hour */}
      {stats.by_hour.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Saatlara görə yük</h3>
          <div className="flex items-end gap-1 h-24">
            {Array.from({ length: 24 }, (_, h) => {
              const found = stats.by_hour.find((x) => x.hour === h);
              const count = found?.count || 0;
              return (
                <div key={h} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${(count / maxHour) * 100}%`,
                      minHeight: count > 0 ? 3 : 1,
                      background: count > 0 ? "var(--accent)" : "var(--border)",
                      opacity: count > 0 ? 0.8 : 0.3,
                    }}
                  />
                  {count > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-black text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                      {h}:00 — {count} rez.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  revenue,
  accent,
}: {
  label: string;
  count: number;
  revenue: number;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={
        accent
          ? { background: "var(--accent)", color: "var(--accent-contrast)" }
          : { background: "var(--bg-elev)", border: "1px solid var(--border)" }
      }
    >
      <div className="text-[11px] uppercase tracking-wider font-medium mb-2" style={accent ? { opacity: 0.75 } : { color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-2xl font-bold font-display">{revenue} ₼</div>
      <div className="text-xs mt-1" style={accent ? { opacity: 0.7 } : { color: "var(--text-muted)" }}>
        {count} rezervasiya
      </div>
    </div>
  );
}
