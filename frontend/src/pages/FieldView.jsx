import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

const STATUS_COLOR = { Healthy: "#10B981", Moderate: "#F59E0B", Critical: "#EF4444" };
const STATUS_BG    = { Healthy: "#ECFDF5", Moderate: "#FFFBEB", Critical: "#FEF2F2" };
const STATUS_ICON  = { Healthy: "🟢", Moderate: "🟡", Critical: "🔴" };

/* ── small progress bar ── */
function SensorBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height: "6px", background: "var(--border-light)", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.5s" }} />
    </div>
  );
}

/* ── sensor row in detail panel ── */
function SensorRow({ icon, label, value, unit, max, color }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{icon} {label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>
          {value ?? "--"} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>{unit}</span>
        </span>
      </div>
      {value != null && <SensorBar value={value} max={max} color={color} />}
    </div>
  );
}

export default function FieldView() {
  const [grid,     setGrid]     = useState({});
  const [summary,  setSummary]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(false);
  const [pulse,    setPulse]    = useState(false);   // live refresh indicator
  const [actionDone, setActionDone] = useState("");

  const load = useCallback(async () => {
    try {
      const [g, s] = await Promise.all([api.fieldGrid(), api.sensorSummary()]);
      setGrid(g.grid || {});
      setSummary(s);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  const remediate = async (action) => {
    if (!selected || acting) return;
    setActing(true);
    await api.remediate(selected, action);
    await load();
    setActing(false);
    const labels = { water: "💧 Irrigation applied!", fertilize: "🌿 Fertilizer applied!", adjust_ph: "⚗️ pH adjusted!" };
    setActionDone(labels[action] || "Done!");
    setTimeout(() => setActionDone(""), 2500);
  };

  const cell = selected ? grid[selected] : null;
  const S = summary || {};

  /* helper: how many of each status */
  const cells = Object.values(grid);
  const counts = { Healthy: 0, Moderate: 0, Critical: 0 };
  cells.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

      {/* ── Page Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>
            🌿 Field Sensor Map
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Live data from all 25 field sectors · auto-refreshes every 8 seconds
          </p>
        </div>
        {/* Live pulse indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "20px" }}>
          <div style={{
            width: "10px", height: "10px", borderRadius: "50%",
            background: pulse ? "#10B981" : "var(--border-light)",
            transition: "background 0.3s", boxShadow: pulse ? "0 0 0 4px rgba(16,185,129,0.2)" : "none",
          }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
            {pulse ? "Updating…" : "Live"}
          </span>
        </div>
      </div>

      {/* ── Sensor Summary Strip ── */}
      {!loading && S.avg_ndvi != null && (
        <div style={{
          display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px",
        }}>
          {[
            { icon: "🛰", label: "Avg NDVI",       value: S.avg_ndvi,        unit: "",        color: "#10B981", max: 1    },
            { icon: "💧", label: "Avg Moisture",   value: S.avg_moisture,    unit: "m³/m³",   color: "#3B82F6", max: 0.7  },
            { icon: "🌡", label: "Avg Temp",       value: S.avg_temperature, unit: "°C",      color: "#F97316", max: 45   },
            { icon: "🌿", label: "Avg Nitrogen",   value: S.avg_nitrogen,    unit: "mg/kg",   color: "#6366F1", max: 100  },
            { icon: "⚗️", label: "Avg pH",         value: S.avg_ph,          unit: "",        color: "#8B5CF6", max: 9    },
            { icon: "🟢", label: "Healthy Zones",  value: counts.Healthy,    unit: "/ 25",    color: "#10B981", max: 25   },
            { icon: "🔴", label: "Critical Zones", value: counts.Critical,   unit: "/ 25",    color: "#EF4444", max: 25   },
          ].map(s => (
            <div key={s.label} style={{
              flex: "1 1 120px", background: "var(--bg-card)", border: "1px solid var(--border-light)",
              borderRadius: "12px", padding: "14px 16px",
              borderTop: `3px solid ${s.color}`,
            }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
                {s.icon} {s.label}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", lineHeight: 1 }}>
                {s.value ?? "--"} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* ── Field Grid Map ── */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: "16px", padding: "24px", flex: "1 1 460px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <div style={{ marginBottom: "16px", fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
            Click any sector to see live sensor data
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
            {Array.from({ length: 5 }, (_, r) =>
              Array.from({ length: 5 }, (_, c) => {
                const cid  = `${r}-${c}`;
                const data = grid[cid] || {};
                const st   = data.status || "Moderate";
                const isSel = selected === cid;

                return (
                  <div
                    key={cid}
                    onClick={() => setSelected(isSel ? null : cid)}
                    style={{
                      borderRadius: "10px", cursor: "pointer", padding: "10px 8px",
                      background: STATUS_BG[st],
                      border: `2px solid ${isSel ? STATUS_COLOR[st] : "transparent"}`,
                      boxShadow: isSel ? `0 4px 16px ${STATUS_COLOR[st]}40` : "none",
                      transform: isSel ? "scale(1.06)" : "scale(1)",
                      transition: "all 0.18s ease",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                    }}
                  >
                    {/* Status dot */}
                    <div style={{ fontSize: "14px" }}>{STATUS_ICON[st]}</div>
                    {/* NDVI */}
                    <div style={{ fontSize: "15px", fontWeight: 800, color: STATUS_COLOR[st], lineHeight: 1 }}>
                      {data.ndvi ?? "--"}
                    </div>
                    {/* Sector label */}
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 600 }}>
                      {r},{c}
                    </div>
                    {/* Mini moisture bar */}
                    {data.moisture != null && (
                      <div style={{ width: "100%", height: "3px", background: "rgba(0,0,0,0.1)", borderRadius: "2px", marginTop: "2px" }}>
                        <div style={{ height: "100%", width: `${Math.round(data.moisture * 100 / 0.7)}%`, background: "#3B82F6", borderRadius: "2px" }} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "20px", marginTop: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            {Object.entries(STATUS_COLOR).map(([s, c]) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
                <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 500 }}>{s} ({counts[s]})</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "20px", height: "3px", background: "#3B82F6", borderRadius: "2px" }} />
              <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 500 }}>Moisture bar</span>
            </div>
          </div>
        </div>

        {/* ── Sensor Detail Panel ── */}
        {cell ? (
          <div style={{
            background: "var(--bg-card)", border: `1px solid ${STATUS_COLOR[cell.status]}40`,
            borderRadius: "16px", padding: "24px", flex: "1 1 300px", minWidth: "280px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            borderTop: `4px solid ${STATUS_COLOR[cell.status]}`,
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                  Sector {selected}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
                  {STATUS_ICON[cell.status]} {cell.status} Zone
                </h3>
              </div>
              <span style={{
                background: STATUS_BG[cell.status], color: STATUS_COLOR[cell.status],
                padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                border: `1px solid ${STATUS_COLOR[cell.status]}40`,
              }}>
                Live
              </span>
            </div>

            {/* Action done toast */}
            {actionDone && (
              <div style={{
                background: "#ECFDF5", border: "1px solid #10B981", borderRadius: "8px",
                padding: "10px 14px", marginBottom: "16px", fontSize: "13px",
                color: "#065F46", fontWeight: 600, textAlign: "center",
              }}>
                {actionDone}
              </div>
            )}

            {/* Sensor readings */}
            <SensorRow icon="🛰" label="NDVI (Plant Health)" value={cell.ndvi}        unit=""        max={1}   color={STATUS_COLOR[cell.status]} />
            <SensorRow icon="💧" label="Soil Moisture"       value={cell.moisture}    unit="m³/m³"   max={0.7} color="#3B82F6" />
            <SensorRow icon="🌡" label="Temperature"         value={cell.temperature} unit="°C"      max={45}  color="#F97316" />
            <SensorRow icon="🌿" label="Nitrogen"            value={cell.nitrogen}    unit="mg/kg"   max={100} color="#10B981" />
            <SensorRow icon="🧪" label="Phosphorus"          value={cell.phosphorus}  unit="mg/kg"   max={60}  color="#8B5CF6" />
            <SensorRow icon="⚡" label="Potassium"           value={cell.potassium}   unit="mg/kg"   max={300} color="#F59E0B" />
            <SensorRow icon="⚗️" label="Soil pH"            value={cell.ph}          unit=""        max={9}   color="#6366F1" />

            {/* Smart suggestion */}
            <div style={{
              marginTop: "16px", padding: "12px 14px", borderRadius: "10px",
              background: "var(--bg-app)", border: "1px solid var(--border-light)",
              fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "20px",
            }}>
              💡 <strong>Suggestion: </strong>
              {cell.status === "Critical"
                ? "NDVI is critically low. Apply irrigation immediately and check nutrient levels."
                : cell.status === "Moderate"
                ? "Crop is growing but needs attention. Monitor moisture and consider fertilizing."
                : "Crop is healthy! Maintain current irrigation and nutrient schedule."}
            </div>

            {/* Quick Actions */}
            <p style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Actions
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { action: "water",      label: "💧 Irrigate Field",    desc: "Increases soil moisture & NDVI" },
                { action: "fertilize",  label: "🌿 Apply NPK Fertilizer", desc: "Boosts nitrogen, phosphorus & potassium" },
                { action: "adjust_ph",  label: "⚗️ Buffer Soil pH",   desc: "Balances pH to optimal range" },
              ].map(({ action, label, desc }) => (
                <button
                  key={action}
                  onClick={() => remediate(action)}
                  disabled={acting}
                  style={{
                    background: acting ? "var(--bg-app)" : "white",
                    border: "1px solid var(--border-light)", color: "var(--text-main)",
                    padding: "10px 14px", borderRadius: "8px",
                    cursor: acting ? "not-allowed" : "pointer", textAlign: "left",
                    transition: "all 0.15s", opacity: acting ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!acting) { e.currentTarget.style.background = "var(--primary-light)"; e.currentTarget.style.borderColor = "var(--primary)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "var(--border-light)"; }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{acting ? "Applying…" : label}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            background: "var(--bg-card)", border: "1px dashed var(--border-light)",
            borderRadius: "16px", padding: "48px 24px", flex: "1 1 300px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)", textAlign: "center", minWidth: "280px",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
            <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-main)", marginBottom: "8px" }}>
              Select a sector
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.6 }}>
              Click any cell on the map to see<br/>live sensor readings and take action.
            </p>
            {!loading && (
              <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                {Object.entries(counts).map(([st, n]) => (
                  <div key={st} style={{ padding: "6px 14px", borderRadius: "20px", background: STATUS_BG[st], color: STATUS_COLOR[st], fontSize: "12px", fontWeight: 700, border: `1px solid ${STATUS_COLOR[st]}40` }}>
                    {STATUS_ICON[st]} {n} {st}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}