import { useState } from "react";
import { api } from "../api";

export default function Predict() {
  const [soilMoisture, setSoilMoisture] = useState(0.45);
  const [temperature,  setTemperature]  = useState(28);
  const [spectral,     setSpectral]     = useState(null);
  const [fileName,     setFileName]     = useState("");
  const [result,       setResult]       = useState(null);
  const [crops,        setCrops]        = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [isSample,     setIsSample]     = useState(false);

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines  = ev.target.result.trim().split("\n");
      const values = lines[0].split(",").map(Number);
      if (values.length < 131 || values.length > 150) {
        setError(`CSV must have 131–150 columns, got ${values.length}`);
        setSpectral(null);
      } else {
        setError("");
        setSpectral(values.slice(0, 131));
      }
    };
    reader.readAsText(file);
  };

  const handleTrySample = async () => {
    setLoading(true); setError(""); setResult(null); setCrops(null); setIsSample(true);
    try {
      const pred = await api.predictSample();
      if (pred.error) {
        setError(`Backend error: ${pred.error}`);
        setResult(null);
      } else {
        setResult(pred);
      }
    } catch (e) {
      setError("Sample prediction failed. Is the backend running?");
    }
    setLoading(false);
  };

  const handlePredict = async () => {
    if (!spectral) { setError("Please upload a spectral CSV file first"); return; }
    setLoading(true); setError(""); setResult(null); setCrops(null); setIsSample(false);
    try {
      const pred = await api.predict({ spectral, soil_moisture: soilMoisture, temperature });
      if (pred.error) {
        setError(`Backend error: ${pred.error}`);
        setResult(null);
      } else {
        setResult(pred);
      }
    } catch (e) {
      setError("Prediction failed. Is the backend running?");
    }
    try {
      const rec = await api.recommendCrop({ moisture: soilMoisture, temperature,
                            nitrogen: 50, phosphorus: 30, potassium: 200, ph: 6.5 });
      setCrops(rec.recommendations || []);
    } catch (_) {}
    setLoading(false);
  };

  const yieldColor = result
    ? result.yield_tph >= 5 ? "var(--success)"
    : result.yield_tph >= 3.5 ? "var(--warning)"
    : result.yield_tph >= 2   ? "var(--warning)"
    : "var(--danger)"
    : "var(--text-main)";

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>
          Yield Prediction Model
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Upload spectral data and environmental parameters to forecast crop yields.
        </p>
      </div>

      {/* ── Trial / Demo Banner ─────────────────────────────────────────────── */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--primary)",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(6, 95, 70, 0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{
            background: "var(--primary)", color: "white",
            fontSize: "10px", fontWeight: 700,
            padding: "4px 10px", borderRadius: "12px",
            letterSpacing: "0.5px", textTransform: "uppercase"
          }}>Demo Mode</span>
          <span style={{ color: "var(--text-main)", fontSize: "16px", fontWeight: 600 }}>
            Quick Start
          </span>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px", lineHeight: "1.5" }}>
          Don't have a dataset? Test the prediction model instantly using sample multi-spectral data from our validation set.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <button onClick={handleTrySample} disabled={loading} style={{
            background: "var(--primary)",
            color: "white",
            padding: "10px 24px",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.2s ease"
          }}>
            {loading && isSample ? "Running..." : "Run Sample Prediction"}
          </button>

          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span>📊</span> 131 bands</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span>💧</span> 0.45 moisture</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span>🌡</span> 28°C</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--border-light)" }} />
        <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 500, textTransform: "uppercase" }}>Or run custom analysis</span>
        <div style={{ flex: 1, height: "1px", background: "var(--border-light)" }} />
      </div>

      {/* ── Full Prediction Form ────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ color: "var(--text-main)", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
            Spectral Data CSV (131–150 columns)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{
              background: "white", border: "1px solid var(--border-light)",
              color: "var(--text-main)", padding: "8px 16px", borderRadius: "6px",
              cursor: "pointer", fontSize: "14px", fontWeight: 500, boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}>
              Choose File
              <input type="file" accept=".csv" onChange={handleCSV} style={{ display: "none" }} />
            </label>
            <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              {fileName || "No file chosen"}
            </span>
            {spectral && (
              <span style={{ color: "var(--success)", fontSize: "13px", fontWeight: 500 }}>
                ✓ {spectral.length} bands loaded
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div>
            <label style={{ color: "var(--text-main)", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
              Soil Moisture (0–1)
            </label>
            <input type="number" min="0" max="1" step="0.01" value={soilMoisture}
              onChange={e => setSoilMoisture(parseFloat(e.target.value))}
              style={{ background: "white", border: "1px solid var(--border-light)", color: "var(--text-main)",
                       padding: "8px 12px", borderRadius: "6px", fontSize: "14px", width: "140px", outline: "none" }} />
          </div>
          <div>
            <label style={{ color: "var(--text-main)", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
              Temperature (°C)
            </label>
            <input type="number" min="0" max="50" step="0.1" value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              style={{ background: "white", border: "1px solid var(--border-light)", color: "var(--text-main)",
                       padding: "8px 12px", borderRadius: "6px", fontSize: "14px", width: "140px", outline: "none" }} />
          </div>
        </div>

        {error && <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "12px", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>⚠ {error}</div>}

        <button onClick={handlePredict} disabled={loading} style={{
          background: loading ? "var(--text-muted)" : "var(--primary)",
          color: "white", padding: "10px 24px", borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, width: "100%"
        }}>
          {loading && !isSample ? "Processing..." : "Generate Prediction"}
        </button>
      </div>

      {/* ── Prediction Result ───────────────────────────────────────────────── */}
      {result && (
        <div style={{
          background: "var(--bg-card)",
          border: `1px solid ${yieldColor}`,
          borderRadius: "12px",
          padding: "32px",
          marginTop: "24px",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
        }}>
          {isSample && (
            <div style={{
              display: "inline-block", background: "var(--bg-app)",
              border: "1px solid var(--border-light)", borderRadius: "20px",
              padding: "4px 12px", marginBottom: "20px", fontSize: "12px",
              color: "var(--text-muted)", fontWeight: 600
            }}>
              SAMPLE PREDICTION
            </div>
          )}

          <div style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Estimated Yield</div>
          <div style={{ color: yieldColor, fontSize: "64px", fontWeight: 700, lineHeight: 1 }}>
            {result.yield_tph != null ? result.yield_tph : "—"}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "16px", fontWeight: 500, marginTop: "8px", marginBottom: "20px" }}>tons per hectare</div>

          {result.category && (
            <div style={{
              display: "inline-block", background: `${yieldColor}15`, padding: "6px 16px",
              borderRadius: "20px", color: yieldColor, fontSize: "14px", fontWeight: 600
            }}>
              {result.category}
            </div>
          )}

          {isSample && result.sample_info && (
            <div style={{
              marginTop: "24px", padding: "16px",
              background: "var(--bg-app)", borderRadius: "8px",
              textAlign: "left"
            }}>
              <div style={{ color: "var(--text-main)", fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>
                Input Parameters
              </div>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span>📊</span> {result.sample_info.spectral_bands} bands</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span>💧</span> {result.sample_info.soil_moisture}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span>🌡</span> {result.sample_info.temperature}°C</span>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                {result.sample_info.note}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Crop Recommendations ────────────────────────────────────────────── */}
      {crops && crops.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "12px", padding: "24px", marginTop: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "var(--text-main)", fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
            Recommended Crops
          </h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {crops.map((c, i) => (
              <div key={i} style={{ 
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderBottom: i === crops.length - 1 ? "none" : "1px solid var(--border-light)", 
                padding: "12px 0" 
              }}>
                <div>
                  <div style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "15px" }}>{c.name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "2px" }}>{c.reason}</div>
                </div>
                <div style={{ background: "var(--success-bg)", color: "var(--success-text)", padding: "4px 10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600 }}>
                  {c.confidence}% Match
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}