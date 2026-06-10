import { useState, useEffect } from "react";
import { api } from "../api";

const STATUS_COLOR = { Healthy: "#10B981", Moderate: "#F59E0B", Critical: "#EF4444" };
const STATUS_ICON  = { Healthy: "🟢", Moderate: "🟡", Critical: "🔴" };

export default function Simulation() {
  const [running, setRunning] = useState(false);
  const [grid,    setGrid]    = useState({});
  const [log,     setLog]     = useState([{ time: new Date().toLocaleTimeString(), icon: "⏹", text: "Simulation stopped", color: "#6B7280" }]);
  const [tick,    setTick]    = useState(0); // counts refresh cycles

  const checkStatus = async () => {
    try { const s = await api.simStatus(); setRunning(s.running); } catch (_) {}
  };
  useEffect(() => { checkStatus(); }, []);

  // Poll field grid every 5s while running
  useEffect(() => {
    if (!running) return;
    const t = setInterval(async () => {
      const d = await api.fieldGrid();
      const g = d.grid || {};
      setGrid(g);
      setTick(n => n + 1);

      // Build a meaningful log entry
      const cells = Object.entries(g);
      const crit  = cells.filter(([, c]) => c.status === "Critical").length;
      const mod   = cells.filter(([, c]) => c.status === "Moderate").length;
      const avg   = (cells.reduce((s, [, c]) => s + c.ndvi, 0) / cells.length).toFixed(3);

      let txt, icon, color;
      if (crit > 0) {
        txt   = `${crit} sector(s) in Critical state — NDVI avg ${avg}. Immediate action recommended.`;
        icon  = "🔴"; color = "#EF4444";
      } else if (mod > 3) {
        txt   = `${mod} sectors are Moderate. NDVI avg ${avg}. Consider irrigation soon.`;
        icon  = "🟡"; color = "#F59E0B";
      } else {
        txt   = `Field looks good. NDVI avg ${avg} — all sectors Healthy or Moderate.`;
        icon  = "🟢"; color = "#10B981";
      }

      setLog(prev => [{ time: new Date().toLocaleTimeString(), icon, text: txt, color }, ...prev].slice(0, 40));
    }, 5000);
    return () => clearInterval(t);
  }, [running]);

  const toggle = async () => {
    if (running) {
      await api.stopSim();
      setRunning(false);
      setLog(prev => [{ time: new Date().toLocaleTimeString(), icon: "⏹", text: "Simulation stopped by user.", color: "#6B7280" }, ...prev]);
    } else {
      await api.startSim();
      const d = await api.fieldGrid();
      setGrid(d.grid || {});
      setRunning(true);
      setTick(0);
      setLog(prev => [{ time: new Date().toLocaleTimeString(), icon: "▶️", text: "Simulation started — field dynamics are now running.", color: "#10B981" }, ...prev]);
    }
  };

  const cells   = Object.entries(grid);
  const critical = cells.filter(([, c]) => c.status === "Critical").length;
  const healthy  = cells.filter(([, c]) => c.status === "Healthy").length;
  const moderate = cells.filter(([, c]) => c.status === "Moderate").length;
  const avgNdvi  = cells.length ? (cells.reduce((s, [, c]) => s + c.ndvi, 0) / cells.length).toFixed(3) : null;
  const avgMoist = cells.length ? (cells.reduce((s, [, c]) => s + c.moisture, 0) / cells.length).toFixed(3) : null;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>
          🚜 Digital Twin Simulation
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          A virtual copy of your real farm — watch what happens to your field over time without any risk.
        </p>
      </div>

      {/* ── What does it do? Explainer ── */}
      <div style={{
        background: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)",
        border: "1px solid #A7F3D0", borderRadius: "16px",
        padding: "24px 28px", marginBottom: "28px",
      }}>
        <div style={{ fontWeight: 700, fontSize: "15px", color: "#065F46", marginBottom: "16px" }}>
          💡 What does the simulation do?
        </div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {[
            { icon: "💧", title: "Moisture Drifts Down",    desc: "Soil water level slowly drops over time — like evaporation on a hot day." },
            { icon: "🌿", title: "NDVI Changes",            desc: "Plant health score changes. If moisture drops too low, NDVI falls and the zone turns red." },
            { icon: "🧪", title: "Nutrients Deplete",       desc: "Nitrogen, phosphorus, and potassium levels go down as plants absorb them." },
            { icon: "🔴", title: "Alerts Are Triggered",    desc: "When a zone turns Critical, the system sends an alert — so you can act fast." },
            { icon: "🔬", title: "Safe to Test",            desc: "No real field is affected. Use it to learn what happens if you don't irrigate for a while." },
          ].map(item => (
            <div key={item.title} style={{ flex: "1 1 160px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "22px", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#065F46", marginBottom: "3px" }}>{item.title}</div>
                <div style={{ fontSize: "12px", color: "#047857", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls + Live Stats ── */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "28px", flexWrap: "wrap" }}>
        <button
          onClick={toggle}
          style={{
            background: running ? "#FEF2F2" : "var(--primary)",
            border: `1.5px solid ${running ? "#EF4444" : "var(--primary)"}`,
            color: running ? "#EF4444" : "white",
            padding: "11px 28px", borderRadius: "10px", cursor: "pointer",
            fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px",
            transition: "all 0.2s",
          }}
        >
          {running ? "⏹ Stop Simulation" : "▶ Start Simulation"}
        </button>

        {/* Live pulse */}
        {running && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "20px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", animation: "simPulse 1.2s infinite" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#065F46" }}>Running · Tick {tick}</span>
          </div>
        )}

        <style>{`@keyframes simPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.3)}}`}</style>

        {/* Stat chips */}
        {[
          { label: "Avg NDVI",     value: avgNdvi  ?? "--", color: "#10B981" },
          { label: "Avg Moisture", value: avgMoist ? `${avgMoist} m³/m³` : "--", color: "#3B82F6" },
          { label: "🟢 Healthy",   value: cells.length ? healthy  : "--", color: "#10B981" },
          { label: "🟡 Moderate",  value: cells.length ? moderate : "--", color: "#F59E0B" },
          { label: "🔴 Critical",  value: cells.length ? critical : "--", color: "#EF4444" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border-light)",
            borderRadius: "10px", padding: "8px 16px", textAlign: "center",
            borderTop: `3px solid ${s.color}`,
          }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "3px" }}>{s.label}</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* ── NDVI Heatmap ── */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          flex: "0 0 auto",
        }}>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
              🛰 NDVI Heatmap {running && <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600 }}>● Live</span>}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Darker green = healthier plants. Watch cells turn red as moisture drops.
            </div>
          </div>

          {cells.length > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 80px)", gap: "6px" }}>
                {Array.from({ length: 5 }, (_, r) =>
                  Array.from({ length: 5 }, (_, c) => {
                    const cell = grid[`${r}-${c}`] || {};
                    const v    = cell.ndvi ?? 0.5;
                    const st   = cell.status || "Moderate";
                    return (
                      <div key={`${r}-${c}`} style={{
                        width: "80px", height: "64px", borderRadius: "8px",
                        background: `rgba(6, 95, 70, ${Math.max(0.08, v)})`,
                        border: `1.5px solid ${STATUS_COLOR[st]}50`,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: "2px",
                      }}>
                        <div style={{ fontSize: "10px" }}>{STATUS_ICON[st]}</div>
                        <div style={{ fontSize: "14px", color: v > 0.35 ? "white" : "var(--text-main)", fontWeight: 800 }}>{v}</div>
                        <div style={{ fontSize: "9px", color: v > 0.35 ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}>
                          💧{cell.moisture?.toFixed(2)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Color scale */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Low NDVI</span>
                <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: "linear-gradient(to right, rgba(6,95,70,0.08), rgba(6,95,70,1))" }} />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>High NDVI</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
                ⏱ Refreshes every 5 seconds when running
              </div>
            </>
          ) : (
            <div style={{ width: "430px", height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px", gap: "8px" }}>
              <div style={{ fontSize: "32px" }}>🚜</div>
              <p>Press <strong>Start Simulation</strong> to see the heatmap</p>
            </div>
          )}
        </div>

        {/* ── Simulation Log ── */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: "16px", padding: "24px", flex: "1 1 300px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column",
        }}>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
              📋 What is happening?
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Plain-language updates every 5 seconds
            </div>
          </div>

          <div style={{
            flex: 1, minHeight: "320px", maxHeight: "420px",
            overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px",
          }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                display: "flex", gap: "10px", alignItems: "flex-start",
                padding: "10px 12px", borderRadius: "8px",
                background: i === 0 ? "var(--bg-app)" : "transparent",
                border: i === 0 ? "1px solid var(--border-light)" : "none",
                opacity: i === 0 ? 1 : Math.max(0.4, 1 - i * 0.04),
              }}>
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{entry.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", color: entry.color, fontWeight: 700, marginBottom: "2px" }}>
                    {entry.time}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-main)", lineHeight: 1.5 }}>
                    {entry.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* How to use tip */}
          {!running && (
            <div style={{
              marginTop: "16px", padding: "14px", borderRadius: "10px",
              background: "#FFFBEB", border: "1px solid #FCD34D", fontSize: "13px", color: "#92400E", lineHeight: 1.6,
            }}>
              💡 <strong>Tip:</strong> Start the simulation and wait 10–15 seconds. Watch the heatmap change colours and read the log to understand what is happening to your field.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}