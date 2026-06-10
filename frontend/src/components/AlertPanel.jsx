const COLORS    = { Critical: "var(--danger)",     Warning: "var(--warning)",     Information: "var(--primary)" };
const BG_COLORS = { Critical: "var(--danger-bg)",  Warning: "var(--warning-bg)",  Information: "var(--primary-light)" };

export default function AlertPanel({ alerts }) {
  return (
    <>
      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
        Live Alerts
      </p>
      {alerts.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No alerts yet.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {alerts.map((a, i) => (
          <div key={i} style={{
            borderLeft: `3px solid ${COLORS[a.severity] || "var(--primary)"}`,
            background: BG_COLORS[a.severity] || "var(--bg-app)",
            padding: "10px 12px", borderRadius: "0 8px 8px 0",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: COLORS[a.severity] || "var(--text-main)", marginBottom: "3px" }}>
              {a.severity}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-main)", lineHeight: 1.4 }}>
              {a.message}
            </div>
            {a.timestamp && (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>
                {a.timestamp}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}