import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const categoryColor = (cat) => {
  if (!cat) return "var(--text-muted)";
  const c = cat.toLowerCase();
  if (c === "excellent") return "var(--success)";
  if (c === "good")      return "var(--primary)";
  if (c === "average")   return "var(--warning)";
  return "var(--danger)";
};
const categoryBg = (cat) => {
  if (!cat) return "var(--bg-app)";
  const c = cat.toLowerCase();
  if (c === "excellent") return "var(--success-bg)";
  if (c === "good")      return "var(--primary-light)";
  if (c === "average")   return "var(--warning-bg)";
  return "var(--danger-bg)";
};

const PIE_COLORS = ["#10B981", "#065F46", "#F59E0B", "#EF4444", "#6366F1"];

/* ─── sub-components ────────────────────────────────────────────────────────── */
function StatCard({ label, value, unit, icon, accent }) {
  return (
    <div style={{
      flex: "1 1 160px", background: "var(--bg-card)",
      border: "1px solid var(--border-light)", borderRadius: "14px",
      padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      borderTop: `3px solid ${accent || "var(--primary)"}`,
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.10)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
        <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span style={{ fontSize: "30px", fontWeight: 800, color: "var(--text-main)", lineHeight: 1 }}>
          {value ?? "—"}
        </span>
        {unit && <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>{title}</h3>
      {subtitle && <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>{subtitle}</p>}
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────────────────────── */
export default function CropYield() {
  const [overview,  setOverview]  = useState(null);
  const [history,   setHistory]   = useState([]);
  const [recInputs, setRecInputs] = useState({ moisture: 0.40, temperature: 28, nitrogen: 50, ph: 6.5 });
  const [recs,      setRecs]      = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [filter,    setFilter]    = useState("all");   // category filter for history table
  const [sortDesc,  setSortDesc]  = useState(true);
  const [tab,       setTab]       = useState("trend"); // trend | dist | cat

  /* ── load data ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [o, h] = await Promise.all([api.analytics(), api.history(50)]);
        setOverview(o);
        setHistory(h.history || []);
      } catch (_) {}
    };
    load();
  }, []);

  /* ── crop recommendation ── */
  const fetchRecs = useCallback(async () => {
    setRecLoading(true);
    try {
      const res = await api.recommendCrop(recInputs);
      setRecs(res.recommendations || []);
    } catch (_) {
      setRecs([]);
    } finally {
      setRecLoading(false);
    }
  }, [recInputs]);

  useEffect(() => { fetchRecs(); }, []); // initial load

  /* ── derived chart data ── */
  const trendData = [...history]
    .sort((a, b) => a.id - b.id)
    .map(p => ({ id: `#${p.id}`, yield: p.yield_tph, moisture: p.soil_moisture, temp: p.temperature }));

  const buckets = { "< 2": 0, "2 – 3.5": 0, "3.5 – 5": 0, "> 5": 0 };
  history.forEach(p => {
    const y = p.yield_tph;
    if (y < 2)        buckets["< 2"]++;
    else if (y < 3.5) buckets["2 – 3.5"]++;
    else if (y < 5)   buckets["3.5 – 5"]++;
    else              buckets["> 5"]++;
  });
  const distData = Object.entries(buckets).map(([name, count]) => ({ name, count }));

  const catCounts = {};
  history.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
  const catData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

  /* ── filtered & sorted history ── */
  const displayHistory = [...history]
    .filter(p => filter === "all" || p.category === filter)
    .sort((a, b) => sortDesc ? b.yield_tph - a.yield_tph : a.yield_tph - b.yield_tph);

  const categories = [...new Set(history.map(p => p.category))].sort();

  /* ── stat values ── */
  const O = overview || {};
  const avgYield   = O.avg_yield_tph;
  const bestYield  = O.best_yield_tph;
  const worstYield = O.worst_yield_tph;
  const totalPred  = O.total_predictions;
  const avgNdvi    = O.avg_ndvi;

  const cardStyle = {
    background: "var(--bg-card)", border: "1px solid var(--border-light)",
    borderRadius: "14px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  };

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "7px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
        background: tab === id ? "var(--primary)" : "transparent",
        color: tab === id ? "white" : "var(--text-muted)",
        border: tab === id ? "none" : "1px solid var(--border-light)",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >{label}</button>
  );

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto" }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <span style={{
            fontSize: "28px", width: "46px", height: "46px", borderRadius: "12px",
            background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center"
          }}>🌾</span>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.2 }}>
              Crop Yield Production
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "3px" }}>
              Monitor, analyse, and optimise field-level yield performance
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
        <StatCard label="Total Predictions" value={totalPred}   unit=""      icon="📋" accent="var(--primary)" />
        <StatCard label="Avg Yield"          value={avgYield}   unit="t/ha"  icon="📊" accent="#10B981" />
        <StatCard label="Best Yield"         value={bestYield}  unit="t/ha"  icon="🏆" accent="#6366F1" />
        <StatCard label="Worst Yield"        value={worstYield} unit="t/ha"  icon="⚠️"  accent="var(--danger)" />
        <StatCard label="Avg NDVI"           value={avgNdvi}    unit=""      icon="🛰️"  accent="var(--warning)" />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ ...cardStyle, marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <SectionHeader title="Yield Analysis Charts" subtitle="Trend, distribution and category breakdown" />
          <div style={{ display: "flex", gap: "8px" }}>
            {tabBtn("trend", "Trend")}
            {tabBtn("dist",  "Distribution")}
            {tabBtn("cat",   "By Category")}
          </div>
        </div>

        {tab === "trend" && (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="id" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid var(--border-light)", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: "13px" }}
                formatter={(v, n) => [`${v} t/ha`, "Yield"]}
              />
              <Area type="monotone" dataKey="yield" stroke="var(--primary)" strokeWidth={2.5} fill="url(#yieldGrad)" dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {tab === "dist" && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid var(--border-light)", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: "13px" }}
                formatter={(v) => [v, "Predictions"]}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {tab === "cat" && (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--border-light)", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: "13px" }} />
              <Legend wrapperStyle={{ fontSize: "13px", fontWeight: 500 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Bottom Two-Column ── */}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "28px" }}>

        {/* ── History Table ── */}
        <div style={{ ...cardStyle, flex: "2 1 520px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <SectionHeader title="Prediction History" subtitle={`${displayHistory.length} records`} />
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{
                  fontSize: "13px", padding: "6px 12px", borderRadius: "6px",
                  border: "1px solid var(--border-light)", background: "white",
                  color: "var(--text-main)", cursor: "pointer",
                }}
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => setSortDesc(s => !s)}
                style={{
                  fontSize: "13px", padding: "6px 12px", borderRadius: "6px",
                  border: "1px solid var(--border-light)", background: "white",
                  color: "var(--text-muted)", cursor: "pointer",
                }}
              >
                Yield {sortDesc ? "▼" : "▲"}
              </button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["ID", "Timestamp", "Yield (t/ha)", "Category", "Moisture", "Temp (°C)"].map(h => (
                    <th key={h} style={{
                      color: "var(--text-muted)", fontWeight: 700, fontSize: "11px",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      borderBottom: "2px solid var(--border-light)", padding: "10px 14px", textAlign: "left",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayHistory.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No records found</td></tr>
                )}
                {displayHistory.map((p, idx) => (
                  <tr key={p.id} style={{
                    background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.012)",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--primary-light)"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.012)"}
                  >
                    <td style={{ padding: "11px 14px", color: "var(--text-muted)", fontWeight: 600 }}>#{p.id}</td>
                    <td style={{ padding: "11px 14px", color: "var(--text-main)" }}>{p.timestamp}</td>
                    <td style={{ padding: "11px 14px", fontWeight: 700, color: categoryColor(p.category), fontSize: "15px" }}>
                      {p.yield_tph}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{
                        background: categoryBg(p.category),
                        color: categoryColor(p.category),
                        padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                      }}>{p.category}</span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "var(--text-muted)" }}>{p.soil_moisture}</td>
                    <td style={{ padding: "11px 14px", color: "var(--text-muted)" }}>{p.temperature} °C</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Crop Recommendation Panel ── */}
        <div style={{ ...cardStyle, flex: "1 1 280px", display: "flex", flexDirection: "column" }}>
          <SectionHeader title="🌱 Crop Recommendation" subtitle="Adjust conditions to see best crops" />

          {/* sliders */}
          {[
            { key: "moisture",    label: "Soil Moisture", min: 0.05, max: 0.75, step: 0.01, fmt: v => v.toFixed(2) },
            { key: "temperature", label: "Temperature",   min: 10,   max: 45,   step: 0.5,  fmt: v => `${v} °C`   },
            { key: "nitrogen",    label: "Nitrogen",      min: 10,   max: 100,  step: 1,    fmt: v => `${v} mg/kg` },
            { key: "ph",          label: "Soil pH",       min: 4.5,  max: 9.0,  step: 0.1,  fmt: v => v.toFixed(1) },
          ].map(({ key, label, min, max, step, fmt }) => (
            <div key={key} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700 }}>{fmt(recInputs[key])}</span>
              </div>
              <input
                type="range" min={min} max={max} step={step}
                value={recInputs[key]}
                onChange={e => setRecInputs(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
              />
            </div>
          ))}

          <button
            onClick={fetchRecs}
            disabled={recLoading}
            style={{
              width: "100%", padding: "10px", borderRadius: "8px", border: "none",
              background: "var(--primary)", color: "white", fontWeight: 700,
              fontSize: "14px", cursor: recLoading ? "not-allowed" : "pointer",
              opacity: recLoading ? 0.7 : 1, marginBottom: "20px",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (!recLoading) e.currentTarget.style.background = "var(--primary-hover)"; }}
            onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}
          >
            {recLoading ? "Calculating…" : "Get Recommendations"}
          </button>

          {/* results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, overflowY: "auto" }}>
            {recs.length === 0 && !recLoading && (
              <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", marginTop: "12px" }}>
                No crops match current conditions
              </p>
            )}
            {recs.map((r, i) => (
              <div key={i} style={{
                background: i === 0 ? "var(--primary-light)" : "var(--bg-app)",
                border: `1px solid ${i === 0 ? "var(--primary)" : "var(--border-light)"}`,
                borderRadius: "10px", padding: "12px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: i === 0 ? "var(--primary)" : "var(--text-main)" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {r.name}
                  </span>
                  <span style={{
                    background: i === 0 ? "var(--primary)" : "var(--border-light)",
                    color: i === 0 ? "white" : "var(--text-muted)",
                    fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
                  }}>
                    {r.confidence}%
                  </span>
                </div>
                {/* confidence bar */}
                <div style={{ height: "4px", background: "var(--border-light)", borderRadius: "4px", marginBottom: "6px" }}>
                  <div style={{ height: "100%", width: `${r.confidence}%`, background: i === 0 ? "var(--primary)" : "var(--success)", borderRadius: "4px", transition: "width 0.5s" }} />
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>{r.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary Insight Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary) 0%, #047857 100%)",
        borderRadius: "16px", padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
      }}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            Overall Season Performance
          </p>
          <p style={{ color: "white", fontSize: "22px", fontWeight: 800 }}>
            {avgYield >= 4.5
              ? "🏆 Excellent Season — yields are above target!"
              : avgYield >= 3
              ? "📈 Good Season — consistent production recorded."
              : "⚠️ Below-average yields — review field conditions."}
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", marginTop: "6px" }}>
            Average yield of <strong style={{ color: "white" }}>{avgYield ?? "—"} t/ha</strong> across{" "}
            <strong style={{ color: "white" }}>{totalPred ?? "—"}</strong> predictions.
          </p>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.15)", borderRadius: "12px",
          padding: "16px 24px", textAlign: "center", backdropFilter: "blur(6px)",
        }}>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Best Yield</div>
          <div style={{ color: "white", fontSize: "36px", fontWeight: 800, lineHeight: 1 }}>{bestYield ?? "—"}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: "2px" }}>t/ha</div>
        </div>
      </div>

    </div>
  );
}
