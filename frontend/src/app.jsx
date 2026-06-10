import { useState, useEffect } from "react";
import Dashboard   from "./pages/Dashboard";
import FieldView   from "./pages/FieldView";
import Predict     from "./pages/Predict";
import Analytics   from "./pages/Analytics";
import Simulation  from "./pages/Simulation";
import CropYield   from "./pages/CropYield";
import Navbar      from "./components/Navbar";
import AlertPanel  from "./components/AlertPanel";
import Login       from "./pages/Login";

/* ── Searchable items ────────────────────────────────────── */
const SEARCH_ITEMS = [
  { label: "Dashboard",           desc: "Overview & KPIs",                page: "dashboard",  icon: "⊞" },
  { label: "Field Map",           desc: "View field grid & health",        page: "field",      icon: "🌿" },
  { label: "Yield Predict",       desc: "Run AI yield prediction",         page: "predict",    icon: "📈" },
  { label: "Analytics",           desc: "Charts & statistics",             page: "analytics",  icon: "📊" },
  { label: "Digital Twin",        desc: "Live field simulation",           page: "simulation", icon: "🚜" },
  { label: "Crop Yield",          desc: "Yield history & recommendations", page: "cropyield",  icon: "🌾" },
  { label: "Schedule Inspection", desc: "Dashboard → schedule a visit",    page: "dashboard",  icon: "📅" },
  { label: "Add New Crop",        desc: "Dashboard → add crop record",     page: "dashboard",  icon: "🌱" },
  { label: "Soil Moisture",       desc: "Sensor data in Field Map",        page: "field",      icon: "💧" },
  { label: "Spectral Data",       desc: "Upload CSV in Yield Predict",     page: "predict",    icon: "📡" },
];

/* ── SearchBar component ─────────────────────────────────── */
function SearchBar({ onNavigate }) {
  const [query,  setQuery]  = useState("");
  const [open,   setOpen]   = useState(false);
  const [active, setActive] = useState(0);

  const results = query.trim() === "" ? [] :
    SEARCH_ITEMS.filter(i =>
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      i.desc.toLowerCase().includes(query.toLowerCase())
    );

  const choose = (item) => {
    onNavigate(item.page);
    setQuery("");
    setOpen(false);
  };

  const onKey = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === "Enter")     { choose(results[active]); }
    if (e.key === "Escape")    { setOpen(false); setQuery(""); }
  };

  return (
    <div style={{ position: "relative", width: "300px" }}>
      {/* Input row */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        background: "var(--bg-app)",
        border: `1px solid ${open ? "var(--primary)" : "var(--border-light)"}`,
        borderRadius: "8px", padding: "7px 12px",
        transition: "border-color 0.15s",
        boxShadow: open ? "0 0 0 3px rgba(6,95,70,0.08)" : "none",
      }}>
        <span style={{ fontSize: "14px", flexShrink: 0 }}>🔍</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKey}
          placeholder="Search fields, crops, predictions…"
          style={{
            border: "none", outline: "none", background: "transparent",
            fontSize: "13px", color: "var(--text-main)", width: "100%",
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "14px", lineHeight: 1, padding: 0 }}
          >✕</button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: "10px", boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
          zIndex: 500, overflow: "hidden",
        }}>
          {results.map((item, i) => (
            <button
              key={item.label}
              onMouseDown={() => choose(item)}
              onMouseEnter={() => setActive(i)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                width: "100%", padding: "10px 14px", border: "none", cursor: "pointer",
                background: i === active ? "var(--primary-light)" : "transparent",
                textAlign: "left",
                borderBottom: i < results.length - 1 ? "1px solid var(--border-light)" : "none",
              }}
            >
              <span style={{ fontSize: "18px", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>{item.label}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query.trim().length > 0 && results.length === 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          borderRadius: "10px", boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
          zIndex: 500, padding: "16px", textAlign: "center",
          color: "var(--text-muted)", fontSize: "13px",
        }}>
          No results for "<strong>{query}</strong>"
        </div>
      )}
    </div>
  );
}

/* ── App ─────────────────────────────────────────────────── */
export default function App() {
  const [page,      setPage]      = useState("dashboard");
  const [alerts,    setAlerts]    = useState([]);
  const [bellOpen,  setBellOpen]  = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);

  /* ── Auth state ── */
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sams_user")); } catch { return null; }
  });

  const handleLogin  = (u) => setUser(u);
  const handleLogout = () => {
    localStorage.removeItem("sams_user");
    setUser(null);
    setUserMenu(false);
  };

  /* ── Show login if not authenticated ── */
  if (!user) return <Login onLogin={handleLogin} />;

  useEffect(() => {
    let es;
    try {
      es = new EventSource("http://127.0.0.1:5000/alerts/stream");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type !== "connected") {
            setAlerts(prev => [data, ...prev].slice(0, 50));
          }
        } catch (_) {}
      };
      es.onerror = () => es.close();
    } catch (_) {}
    return () => es && es.close();
  }, []);

  /* ── Export alerts as CSV ── */
  const handleExport = () => {
    const rows = [
      ["Severity", "Message", "Timestamp"],
      ...alerts.map(a => [a.severity ?? "", (a.message ?? "").replace(/,/g, " "), a.timestamp ?? new Date().toLocaleTimeString()]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `sams_alerts_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const dismissAlert = (idx) => setAlerts(prev => prev.filter((_, i) => i !== idx));
  const clearAlerts  = ()    => setAlerts([]);

  const pages = {
    dashboard:  Dashboard,
    field:      FieldView,
    predict:    Predict,
    analytics:  Analytics,
    simulation: Simulation,
    cropyield:  CropYield,
  };
  const PageComponent  = pages[page] || Dashboard;
  const criticalCount  = alerts.filter(a => a.severity === "Critical").length;

  return (
    <div className="app-shell">
      {/* ── Left Sidebar ── */}
      <Navbar current={page} onNavigate={setPage} alertCount={criticalCount} />

      {/* ── Main Column ── */}
      <div className="app-main">
        {/* Top Header */}
        <header className="app-header">
          <SearchBar onNavigate={setPage} />

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>

            {/* Export button */}
            <button
              onClick={handleExport}
              title="Download alerts as CSV"
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                fontSize: "13px", color: "var(--text-muted)", fontWeight: 600,
                padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border-light)",
                background: "var(--bg-card)", cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              📥 Export
            </button>

            {/* Bell + dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setBellOpen(o => !o)}
                title={alerts.length === 0 ? "No alerts" : `${alerts.length} alerts`}
                style={{
                  fontSize: "18px", lineHeight: 1, padding: "6px", borderRadius: "8px",
                  border: "1px solid var(--border-light)", background: "var(--bg-card)",
                  cursor: "pointer", position: "relative", display: "flex", alignItems: "center",
                  transition: "all 0.15s",
                }}
              >
                🔔
                <span style={{
                  position: "absolute", top: "-5px", right: "-5px",
                  background: alerts.length > 0 ? "var(--danger)" : "#10B981",
                  color: "white",
                  fontSize: "10px", fontWeight: 700,
                  minWidth: "18px", height: "18px", borderRadius: "9px", padding: "0 4px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.3s",
                  animation: alerts.length > 0 ? "bellPop 0.3s ease" : "none",
                }}>{alerts.length}</span>
                <style>{`@keyframes bellPop{0%{transform:scale(0.6)}60%{transform:scale(1.3)}100%{transform:scale(1)}}`}</style>
              </button>

              {/* Alert dropdown */}
              {bellOpen && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    width: "340px", background: "var(--bg-card)",
                    border: "1px solid var(--border-light)", borderRadius: "14px",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.15)", zIndex: 600,
                    overflow: "hidden",
                  }}
                >
                  {/* Dropdown header */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 16px", borderBottom: "1px solid var(--border-light)",
                    background: "var(--bg-app)",
                  }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>
                      🔔 Alerts ({alerts.length})
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {alerts.length > 0 && (
                        <button
                          onClick={clearAlerts}
                          style={{ fontSize: "11px", color: "var(--danger)", fontWeight: 600, cursor: "pointer", background: "none", border: "none" }}
                        >Clear all</button>
                      )}
                      <button
                        onClick={() => setBellOpen(false)}
                        style={{ fontSize: "14px", color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none" }}
                      >✕</button>
                    </div>
                  </div>

                  {/* Alert list */}
                  <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {alerts.length === 0 ? (
                      <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                        ✅ No alerts right now
                      </div>
                    ) : alerts.map((a, i) => (
                      <div key={i} style={{
                        display: "flex", gap: "10px", alignItems: "flex-start",
                        padding: "12px 16px",
                        borderBottom: i < alerts.length - 1 ? "1px solid var(--border-light)" : "none",
                        background: a.severity === "Critical" ? "#FEF2F2" : "transparent",
                      }}>
                        <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>
                          {a.severity === "Critical" ? "🔴" : "🟡"}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: "12px", fontWeight: 700,
                            color: a.severity === "Critical" ? "#EF4444" : "#F59E0B",
                            marginBottom: "3px",
                          }}>{a.severity} · {a.timestamp}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-main)", lineHeight: 1.4 }}>{a.message}</div>
                        </div>
                        <button
                          onClick={() => dismissAlert(i)}
                          style={{ fontSize: "12px", color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none", flexShrink: 0 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar + menu */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenu(o => !o)}
                style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: user.picture ? "transparent" : "var(--primary)",
                  color: "white", border: "2px solid var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700, cursor: "pointer",
                  overflow: "hidden", flexShrink: 0, padding: 0,
                }}
              >
                {user.picture
                  ? <img src={user.picture} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (user.name?.[0] ?? "A").toUpperCase()
                }
              </button>

              {userMenu && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  background: "var(--bg-card)", border: "1px solid var(--border-light)",
                  borderRadius: "14px", boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                  zIndex: 700, overflow: "hidden", minWidth: "220px",
                }}>
                  {/* User info */}
                  <div style={{ padding: "16px", background: "var(--bg-app)", borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)", marginBottom: "3px" }}>{user.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{user.email}</div>
                  </div>
                  {/* Menu items */}
                  {[
                    { icon: "⚙️", label: "Settings" },
                    { icon: "❓", label: "Help & Support" },
                  ].map(item => (
                    <button key={item.label}
                      onClick={() => setUserMenu(false)}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        width: "100%", padding: "11px 16px", border: "none",
                        background: "transparent", cursor: "pointer", fontSize: "13px",
                        color: "var(--text-main)", borderBottom: "1px solid var(--border-light)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--primary-light)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span>{item.icon}</span> {item.label}
                    </button>
                  ))}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      width: "100%", padding: "11px 16px", border: "none",
                      background: "transparent", cursor: "pointer", fontSize: "13px",
                      color: "#EF4444",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Row */}
        <div className="app-content-row">
          <main className="app-content">
            <PageComponent alerts={alerts} />
          </main>

          {alerts.length > 0 && (
            <aside className="app-alerts">
              <AlertPanel alerts={alerts} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}