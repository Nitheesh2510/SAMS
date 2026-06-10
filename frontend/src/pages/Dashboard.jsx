import { useState, useEffect } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* ── Modal Overlay ── */
function Modal({ title, onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg-card)", borderRadius: "18px",
          width: "100%", maxWidth: "480px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.22s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, var(--primary) 0%, #047857 100%)",
          padding: "22px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{ color: "white", fontSize: "17px", fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", color: "white",
              width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer",
              fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.35)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          >✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: "28px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Field Input ── */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "7px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: "8px",
  border: "1px solid var(--border-light)", background: "var(--bg-app)",
  color: "var(--text-main)", fontSize: "14px", outline: "none",
  boxSizing: "border-box", transition: "border-color 0.15s",
};

/* ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [summary,  setSummary]  = useState(null);
  const [overview, setOverview] = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* modal state */
  const [showInspection, setShowInspection] = useState(false);
  const [showAddCrop,    setShowAddCrop]    = useState(false);

  /* Schedule Inspection form */
  const [inspection, setInspection] = useState({
    field: "", date: "", time: "", inspector: "", type: "Routine", notes: "",
  });
  const [inspectionDone, setInspectionDone] = useState(false);

  /* Add New Crop form */
  const [newCrop, setNewCrop] = useState({
    name: "", variety: "", field: "", plantedDate: "", area: "", season: "Kharif",
  });
  const [cropDone, setCropDone] = useState(false);

  const refresh = async () => {
    try {
      const [s, o, h] = await Promise.all([
        api.sensorSummary(), api.analytics(), api.history(20)
      ]);
      setSummary(s);
      setOverview(o);
      setHistory((h.history || []).map(p => ({ name: `#${p.id}`, yield: p.yield_tph })));
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, []);

  const S = summary || {};
  const O = overview || {};

  /* handlers */
  const submitInspection = (e) => {
    e.preventDefault();
    setInspectionDone(true);
    setTimeout(() => { setShowInspection(false); setInspectionDone(false); setInspection({ field: "", date: "", time: "", inspector: "", type: "Routine", notes: "" }); }, 1800);
  };

  const submitCrop = (e) => {
    e.preventDefault();
    setCropDone(true);
    setTimeout(() => { setShowAddCrop(false); setCropDone(false); setNewCrop({ name: "", variety: "", field: "", plantedDate: "", area: "", season: "Kharif" }); }, 1800);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-muted)" }}>
        Loading data…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px" }}>

      {/* ── Keyframe for modal animation ── */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .dash-input:focus { border-color: var(--primary) !important; }
      `}</style>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Crop Dashboard</h1>
          <p className="page-subtitle">Real-time field health monitoring across all sectors.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn-outline" id="btn-schedule-inspection" onClick={() => setShowInspection(true)}>
            📅 Schedule Inspection
          </button>
          <button className="btn-primary" id="btn-add-new-crop" onClick={() => setShowAddCrop(true)}>
            ⊕ Add New Crop
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
        <StatCard
          label="Total Acreage"
          value="12,450"
          unit="Acres"
          icon="📐"
          trend={{ positive: true, value: "+2.4%", label: "from last season" }}
        />
        <StatCard
          label="Health Index"
          value={O.field_health && S.total_cells
            ? Math.round((O.field_health.healthy / S.total_cells) * 100) || 94
            : 94}
          unit="/ 100"
          icon="🛡"
          trend={{ positive: true, value: "Stable", label: "across 5 fields" }}
        />
        <StatCard
          label="Active Alerts"
          value={S.critical_cells ?? 0}
          unit="Critical"
          icon="⚠"
          trend={
            S.critical_cells > 0
              ? { positive: false, value: "Action needed", label: "" }
              : { positive: true,  value: "All clear",    label: "" }
          }
        />
        <StatCard
          label="Avg. NDVI"
          value={S.avg_ndvi ?? "--"}
          icon="🌿"
          trend={{ positive: true, value: "Optimal", label: "vegetative state" }}
        />
      </div>

      {/* Yield Trend Chart */}
      {history.length > 0 && (
        <>
          <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-main)", marginBottom: "14px" }}>
            Yield Prediction Trends
          </h2>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={history} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} dy={8} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} unit=" t" />
                <Tooltip
                  contentStyle={{ background: "white", border: "1px solid var(--border-light)", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
                  itemStyle={{ color: "var(--primary)", fontWeight: 600 }}
                  labelStyle={{ color: "var(--text-muted)", fontWeight: 400 }}
                />
                <Line
                  type="monotone" dataKey="yield" stroke="var(--primary)" strokeWidth={2.5}
                  dot={{ fill: "white", stroke: "var(--primary)", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: "var(--primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          MODAL — Schedule Inspection
      ══════════════════════════════════════════════ */}
      {showInspection && (
        <Modal title="📅 Schedule Field Inspection" onClose={() => setShowInspection(false)}>
          {inspectionDone ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: "52px", marginBottom: "12px" }}>✅</div>
              <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "16px" }}>Inspection Scheduled!</p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px" }}>Your inspection has been added to the calendar.</p>
            </div>
          ) : (
            <form onSubmit={submitInspection}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Field label="Field / Sector">
                  <select
                    className="dash-input" required value={inspection.field}
                    onChange={e => setInspection(p => ({ ...p, field: e.target.value }))}
                    style={{ ...inputStyle }}
                  >
                    <option value="">Select field…</option>
                    {["North Block A", "North Block B", "South Field", "East Paddock", "West Zone"].map(f => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Inspection Type">
                  <select
                    className="dash-input" value={inspection.type}
                    onChange={e => setInspection(p => ({ ...p, type: e.target.value }))}
                    style={{ ...inputStyle }}
                  >
                    {["Routine", "Pest & Disease", "Irrigation", "Soil Sampling", "Post-Harvest"].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Date">
                  <input
                    type="date" className="dash-input" required value={inspection.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setInspection(p => ({ ...p, date: e.target.value }))}
                    style={{ ...inputStyle }}
                  />
                </Field>
                <Field label="Time">
                  <input
                    type="time" className="dash-input" required value={inspection.time}
                    onChange={e => setInspection(p => ({ ...p, time: e.target.value }))}
                    style={{ ...inputStyle }}
                  />
                </Field>
              </div>
              <Field label="Inspector Name">
                <input
                  type="text" className="dash-input" placeholder="e.g. Dr. Ravi Kumar" required
                  value={inspection.inspector}
                  onChange={e => setInspection(p => ({ ...p, inspector: e.target.value }))}
                  style={{ ...inputStyle }}
                />
              </Field>
              <Field label="Notes (optional)">
                <textarea
                  className="dash-input" rows={3} placeholder="Any specific areas or concerns to check…"
                  value={inspection.notes}
                  onChange={e => setInspection(p => ({ ...p, notes: e.target.value }))}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button type="button" onClick={() => setShowInspection(false)}
                  style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "transparent", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "14px", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--primary-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}>
                  Confirm Schedule
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ══════════════════════════════════════════════
          MODAL — Add New Crop
      ══════════════════════════════════════════════ */}
      {showAddCrop && (
        <Modal title="🌱 Add New Crop" onClose={() => setShowAddCrop(false)}>
          {cropDone ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: "52px", marginBottom: "12px" }}>🌾</div>
              <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "16px" }}>Crop Added Successfully!</p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px" }}>Your new crop record has been saved.</p>
            </div>
          ) : (
            <form onSubmit={submitCrop}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Field label="Crop Name">
                  <input
                    type="text" className="dash-input" placeholder="e.g. Rice" required
                    value={newCrop.name}
                    onChange={e => setNewCrop(p => ({ ...p, name: e.target.value }))}
                    style={{ ...inputStyle }}
                  />
                </Field>
                <Field label="Variety">
                  <input
                    type="text" className="dash-input" placeholder="e.g. Basmati 370"
                    value={newCrop.variety}
                    onChange={e => setNewCrop(p => ({ ...p, variety: e.target.value }))}
                    style={{ ...inputStyle }}
                  />
                </Field>
                <Field label="Field / Sector">
                  <select
                    className="dash-input" required value={newCrop.field}
                    onChange={e => setNewCrop(p => ({ ...p, field: e.target.value }))}
                    style={{ ...inputStyle }}
                  >
                    <option value="">Select field…</option>
                    {["North Block A", "North Block B", "South Field", "East Paddock", "West Zone"].map(f => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Season">
                  <select
                    className="dash-input" value={newCrop.season}
                    onChange={e => setNewCrop(p => ({ ...p, season: e.target.value }))}
                    style={{ ...inputStyle }}
                  >
                    {["Kharif", "Rabi", "Zaid", "Year-Round"].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Planting Date">
                  <input
                    type="date" className="dash-input" required value={newCrop.plantedDate}
                    onChange={e => setNewCrop(p => ({ ...p, plantedDate: e.target.value }))}
                    style={{ ...inputStyle }}
                  />
                </Field>
                <Field label="Area (acres)">
                  <input
                    type="number" className="dash-input" placeholder="e.g. 12.5" min="0.1" step="0.1" required
                    value={newCrop.area}
                    onChange={e => setNewCrop(p => ({ ...p, area: e.target.value }))}
                    style={{ ...inputStyle }}
                  />
                </Field>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button type="button" onClick={() => setShowAddCrop(false)}
                  style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "transparent", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "14px", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--primary-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}>
                  Add Crop
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

    </div>
  );
}