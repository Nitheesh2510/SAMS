export default function StatCard({ label, value, unit = "", color = "var(--primary)", icon = "", trend = null }) {
  return (
    <div style={{
      background: "var(--bg-card)", 
      border: "1px solid var(--border-light)", 
      borderRadius: "12px",
      padding: "20px", 
      minWidth: "160px",
      flex: 1,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>
          {label}
        </div>
        {icon && <div style={{ color: "var(--text-muted)", fontSize: "16px" }}>{icon}</div>}
      </div>
      
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <div style={{ color: "var(--text-main)", fontSize: "28px", fontWeight: 700 }}>
          {value}
        </div>
        {unit && <div style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: 500 }}>{unit}</div>}
      </div>
      
      {trend && (
        <div style={{ 
          color: trend.positive ? "var(--success)" : "var(--danger)", 
          fontSize: "12px", 
          marginTop: "8px",
          fontWeight: 500,
          display: "flex", alignItems: "center", gap: "4px"
        }}>
          {trend.positive ? "↗" : "↘"} {trend.value}
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}