import { useState } from "react";

/* ── Google SVG icon ─────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

/* ── Floating animated field blobs ───────────────────────── */
function Background() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.08)} 66%{transform:translate(-20px,15px) scale(0.95)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,20px) scale(1.05)} 66%{transform:translate(20px,-15px) scale(0.97)} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,25px) scale(1.06)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Dark green gradient base */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)" }} />

      {/* Blobs */}
      <div style={{ position: "absolute", top: "-100px", left: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(16,185,129,0.12)", animation: "blob1 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "420px", height: "420px", borderRadius: "50%", background: "rgba(52,211,153,0.09)", animation: "blob2 11s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "40%", left: "60%", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(6,95,70,0.15)", animation: "blob3 13s ease-in-out infinite" }} />

      {/* Subtle grid lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
    </div>
  );
}

/* ── Main Login component ────────────────────────────────── */
export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleGoogleLogin = () => {
    setLoading(true);
    setError("");

    // Simulate Google OAuth popup / redirect
    // In production: replace this block with real Google OAuth
    // using @react-oauth/google or Firebase Auth
    setTimeout(() => {
      const mockUser = {
        name:    "Farm Admin",
        email:   "admin@sams-agri.com",
        picture: null,
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem("sams_user", JSON.stringify(mockUser));
      setLoading(false);
      onLogin(mockUser);
    }, 1800);
  };

  return (
    <>
      <Background />

      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "24px", fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: "100%", maxWidth: "420px",
          animation: "fadeUp 0.5s ease both",
        }}>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "24px",
            padding: "48px 40px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
          }}>

            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "16px",
                background: "linear-gradient(135deg, #10B981, #065F46)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
                fontSize: "28px",
              }}>🌾</div>
              <h1 style={{ color: "white", fontSize: "26px", fontWeight: 800, marginBottom: "6px", letterSpacing: "-0.5px" }}>
                Welcome to SAMS
              </h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", fontWeight: 400 }}>
                Smart Agricultural Management System
              </p>
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "36px" }}>
              {["🌿 Field Monitoring", "📈 Yield Prediction", "🌾 Crop Analytics", "🚜 Digital Twin"].map(f => (
                <span key={f} style={{
                  background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                  color: "#6EE7B7", fontSize: "11px", fontWeight: 600,
                  padding: "4px 10px", borderRadius: "20px",
                }}>{f}</span>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", marginBottom: "28px" }} />

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px", padding: "12px 14px", marginBottom: "16px",
                color: "#FCA5A5", fontSize: "13px", textAlign: "center",
              }}>{error}</div>
            )}

            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: "100%", padding: "14px 20px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                background: loading ? "rgba(255,255,255,0.07)" : "white",
                border: "none", borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px", fontWeight: 700, color: loading ? "rgba(255,255,255,0.4)" : "#1F2937",
                transition: "all 0.2s ease",
                boxShadow: loading ? "none" : "0 4px 16px rgba(0,0,0,0.25)",
                marginBottom: "16px",
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)"; }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#10B981", animation: "spin 0.7s linear infinite",
                    flexShrink: 0,
                  }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Signing in…</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Sign in with Google
                </>
              )}
            </button>

            {/* Terms note */}
            <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              By signing in, you agree to SAMS's<br/>
              <span style={{ color: "rgba(110,231,183,0.7)", cursor: "pointer" }}>Terms of Service</span>
              {" "}and{" "}
              <span style={{ color: "rgba(110,231,183,0.7)", cursor: "pointer" }}>Privacy Policy</span>
            </p>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "12px", marginTop: "24px" }}>
            SAMS v2.0 · Smart Agri Mgmt System
          </p>
        </div>
      </div>
    </>
  );
}
