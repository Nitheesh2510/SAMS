import { useState, useEffect } from "react";
import { api } from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
         PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [history,  setHistory]  = useState([]);

  useEffect(() => {
    const load = async () => {
      const [o, h] = await Promise.all([api.analytics(), api.history(30)]);
      setOverview(o);
      setHistory(h.history || []);
    };
    load();
  }, []);

  if (!overview) return <p style={{ color: "var(--text-muted)" }}>Loading analytics...</p>;

  const O = overview;
  const healthData = [
    { name: "Healthy",  value: O.field_health?.healthy  || 0, color: "var(--success)" },
    { name: "Moderate", value: O.field_health?.moderate || 0, color: "var(--warning)" },
    { name: "Critical", value: O.field_health?.critical || 0, color: "var(--danger)" },
  ];

  const buckets = { "< 2": 0, "2–3.5": 0, "3.5–5": 0, "> 5": 0 };
  history.forEach(p => {
    const y = p.yield_tph;
    if (y < 2) buckets["< 2"]++;
    else if (y < 3.5) buckets["2–3.5"]++;
    else if (y < 5) buckets["3.5–5"]++;
    else buckets["> 5"]++;
  });
  const bucketData = Object.entries(buckets).map(([name, count]) => ({ name, count }));

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>
          Analytics Overview
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Farm health trends & historical yield analysis.</p>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "32px" }}>
        {[
          ["Total Predictions", O.total_predictions,  ""],
          ["Avg Yield",         O.avg_yield_tph,       "t/ha"],
          ["Best Yield",        O.best_yield_tph,      "t/ha"],
          ["Worst Yield",       O.worst_yield_tph,     "t/ha"],
          ["Avg NDVI",          O.avg_ndvi,            ""],
        ].map(([label, val, unit]) => (
          <div key={label} style={{ 
            background: "var(--bg-card)", border: "1px solid var(--border-light)",
            borderRadius: "12px", padding: "20px", flex: "1 1 180px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
          }}>
            <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", marginBottom: "12px" }}>{label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <div style={{ color: "var(--text-main)", fontSize: "28px", fontWeight: 700 }}>
                {val ?? "--"}
              </div>
              <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "32px" }}>
        <div style={{ 
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: "12px", padding: "24px", flex: 1, minWidth: "300px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
        }}>
          <h3 style={{ color: "var(--text-main)", fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Field Health Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={healthData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                {healthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--border-light)", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
              <Legend wrapperStyle={{ color: "var(--text-main)", fontSize: "13px", fontWeight: 500 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ 
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: "12px", padding: "24px", flex: 1, minWidth: "300px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
        }}>
          <h3 style={{ color: "var(--text-main)", fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Yield Distribution (t/ha)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bucketData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid var(--border-light)", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} cursor={{ fill: "var(--bg-app)" }} />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ 
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
        }}>
          <h3 style={{ color: "var(--text-main)", fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Recent Predictions</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr>
                  {["ID", "Time", "Yield (t/ha)", "Category", "Moisture", "Temp (°C)"].map(h => (
                    <th key={h} style={{ color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border-light)", padding: "12px 16px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>#{p.id}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-main)" }}>{p.timestamp}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-main)", fontWeight: 600 }}>{p.yield_tph}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        background: p.yield_tph >= 5 ? "var(--success-bg)" : p.yield_tph >= 3.5 ? "var(--warning-bg)" : p.yield_tph >= 2 ? "var(--warning-bg)" : "var(--danger-bg)",
                        color: p.yield_tph >= 5 ? "var(--success-text)" : p.yield_tph >= 3.5 ? "var(--warning-text)" : p.yield_tph >= 2 ? "var(--warning-text)" : "var(--danger-text)",
                        padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 
                      }}>{p.category}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{p.soil_moisture}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{p.temperature}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
