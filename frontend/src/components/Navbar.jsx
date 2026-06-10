import { useState, useRef, useEffect } from "react";

const NAV = [
  { id: "dashboard",  label: "Dashboard",    icon: "⊞" },
  { id: "analytics",  label: "Analytics",    icon: "📊" },
  { id: "cropyield",  label: "Crop Yield",   icon: "🌾" },
  { id: "field",      label: "Field Map",    icon: "🌿" },
  { id: "predict",    label: "Yield Predict",icon: "📈" },
  { id: "simulation", label: "Digital Twin", icon: "🚜" },
];

/* ── Chatbot knowledge base (simple farmer-friendly language) ── */
const BOT_RULES = [
  { match: ["hello","hi","hey","helo","namaste"],
    reply: "👋 Namaste! I am your SAMS helper.\nYou can ask me things like:\n• How to check my crop health?\n• Which crop should I grow?\n• How to see my field?" },

  { match: ["yield","predict","production","harvest","kitna","how much crop"],
    reply: "🌾 Want to know how much crop you will get?\n\n1. Click on \"Yield Predict\" in the left menu.\n2. Upload your field sensor file (the CSV file).\n3. Set your soil water and temperature.\n4. Press the green button.\n\nThe app will tell you how many tons per hectare you can expect! 🎉" },

  { match: ["sample","try","demo","no file","test"],
    reply: "✅ No file? No problem!\n\nGo to Yield Predict and click:\n👉 \"Run Sample Prediction\"\n\nIt will show you a result using example data. Good for testing!" },

  { match: ["soil","moisture","water","pani","nami"],
    reply: "💧 Soil water (moisture) means how wet your soil is.\n\n• 0.2 = very dry soil\n• 0.4 = normal soil\n• 0.6 = wet soil\n\nCheck your field's water level in the Field Map page." },

  { match: ["temperature","temp","garmi","tapman","heat"],
    reply: "🌡 Enter the temperature of your field in degree Celsius (°C).\n\nExample: if it is 28°C outside, type 28.\n\nBest results come between 20°C and 40°C." },

  { match: ["field","map","grid","zone","area","kheth","block"],
    reply: "🗺 The Field Map shows your farm divided into 25 small sections.\n\nEach section shows:\n🟢 Green = healthy crop\n🟡 Yellow = needs attention\n🔴 Red = urgent problem\n\nTap any section to see details and fix problems." },

  { match: ["ndvi","green","health","plant","crop condition"],
    reply: "🌱 NDVI tells you how healthy your plants are:\n\n🟢 0.65 and above = Very healthy\n🟡 0.35 to 0.65 = Okay, watch it\n🔴 Below 0.35 = Needs urgent care\n\nIf NDVI is low — water your field or add fertilizer." },

  { match: ["alert","warning","red","critical","urgent","problem","issue"],
    reply: "🚨 If you see a red alert:\n\n1. Go to the Field Map\n2. Find the red section\n3. Click on it\n4. Choose one of these fixes:\n   💧 Water – if soil is dry\n   🌿 Fertilize – if nutrients are low\n   ⚗️ Fix pH – if soil balance is off" },

  { match: ["simulation","twin","digital","test","live"],
    reply: "🚜 The Digital Twin is like a practice field.\n\nPress \"Start Simulation\" and watch what happens to your farm over time — without any real risk.\n\nYou can try watering or fertilizing to see what helps most." },

  { match: ["history","record","past","previous","data"],
    reply: "📋 To see past predictions:\n\nGo to \"Crop Yield\" in the left menu.\nYou will see a list of all past results — date, yield amount, and soil conditions." },

  { match: ["recommend","which crop","kaunsi fasal","crop suggest","best crop","which"],
    reply: "🌾 To find the best crop for your field:\n\n1. Go to \"Crop Yield\" page\n2. Move the sliders for:\n   💧 Soil water\n   🌡 Temperature\n   🌿 Nitrogen\n   ⚗️ pH level\n3. Press \"Get Recommendations\"\n\nThe app will suggest the best crops for your conditions!" },

  { match: ["inspect","visit","check","schedule","book","appointment"],
    reply: "📅 To book a field inspection:\n\n1. Go to the Dashboard (home page)\n2. Click the \"Schedule Inspection\" button\n3. Fill in the date, time, and inspector name\n4. Press Confirm\n\nDone! Your inspection is booked. ✅" },

  { match: ["add crop","new crop","register crop","new","add"],
    reply: "🌱 To add a new crop to the system:\n\n1. Go to the Dashboard (home page)\n2. Click the green \"Add New Crop\" button\n3. Fill in crop name, field, and planting date\n4. Press \"Add Crop\"\n\nYour crop will be recorded! 🌾" },

  { match: ["not working","error","fail","problem","broken","kaam nahi"],
    reply: "🛠 If something is not working:\n\n1. Make sure the app is fully loaded\n2. Try refreshing the page (F5)\n3. Make sure the backend server is running\n\nIf prediction fails — the server may need to be restarted. Ask your technical person to run the backend again." },

  { match: ["navigate","go","open","menu","page","where","kahan"],
    reply: "📌 To move between pages, use the menu on the left side:\n\n⊞ Dashboard – Main overview\n🌿 Field Map – Your field health\n📈 Yield Predict – Crop forecast\n📊 Analytics – Charts & data\n🌾 Crop Yield – History & crop tips\n🚜 Digital Twin – Live simulation" },

  { match: ["help","kya","what","how","explain","bata","guide","use"],
    reply: "🙋 I can help you with:\n\n🌾 How much crop will I get?\n💧 Is my soil healthy?\n🌱 Which crop should I grow?\n🔴 What do red alerts mean?\n📅 How to book a field visit?\n\nJust ask me in simple words!" },
];

function getBotReply(input) {
  const lower = input.toLowerCase();
  for (const rule of BOT_RULES) {
    if (rule.match.some(k => lower.includes(k))) return rule.reply;
  }
  return "🤔 Sorry, I did not understand that.\n\nTry asking things like:\n• How much crop will I get?\n• My field is showing red, what to do?\n• Which crop is best for my soil?\n• How to check soil water?";
}

/* ── Shared Modal shell ─────────────────────────────────── */
function Modal({ title, icon, onClose, wide, children }) {
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
          width: "100%", maxWidth: wide ? "580px" : "460px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "nbSlideUp 0.22s ease",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        <style>{`@keyframes nbSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, var(--primary) 0%, #047857 100%)",
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>{icon}</span>
            <h2 style={{ color: "white", fontSize: "16px", fontWeight: 700, margin: 0 }}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", color: "white",
              width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer",
              fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Toggle row for Settings ─────────────────────────────── */
function Toggle({ label, desc, checked, onChange }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: "1px solid var(--border-light)",
    }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</div>
      </div>
      <div
        onClick={onChange}
        style={{
          width: "42px", height: "24px", borderRadius: "12px",
          background: checked ? "var(--primary)" : "var(--border-light)",
          cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s",
        }}
      >
        <div style={{
          position: "absolute", top: "3px", left: checked ? "21px" : "3px",
          width: "18px", height: "18px", borderRadius: "50%",
          background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </div>
    </div>
  );
}

/* ── Chatbot ─────────────────────────────────────────────── */
function Chatbot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Namaste! I am your farming helper.\n\nYou can ask me:\n🌾 How much crop will I get?\n💧 My soil is dry, what to do?\n🔴 Field showing red alert?\n🌱 Which crop should I grow?\n\nJust ask in simple words!" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { from: "bot", text: getBotReply(text) }]);
    }, 700 + Math.random() * 400);
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const QUICK = ["How much crop will I get?", "My field is red, what to do?", "Which crop should I grow?", "Prediction is not working"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "400px" }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
        gap: "10px", paddingBottom: "8px",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
          }}>
            {msg.from === "bot" && (
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                background: "var(--primary)", color: "white", fontSize: "13px",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginRight: "8px", marginTop: "2px",
              }}>🤖</div>
            )}
            <div style={{
              maxWidth: "78%", padding: "10px 13px", borderRadius: msg.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.from === "user" ? "var(--primary)" : "var(--bg-app)",
              color: msg.from === "user" ? "white" : "var(--text-main)",
              fontSize: "13px", lineHeight: 1.55,
              border: msg.from === "bot" ? "1px solid var(--border-light)" : "none",
              whiteSpace: "pre-wrap",
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "var(--primary)", color: "white", fontSize: "13px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>🤖</div>
            <div style={{
              background: "var(--bg-app)", border: "1px solid var(--border-light)",
              borderRadius: "14px 14px 14px 4px", padding: "10px 14px",
              display: "flex", gap: "4px", alignItems: "center",
            }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: "var(--text-muted)",
                  animation: `botDot 1.2s ${d * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px", marginTop: "4px" }}>
        {QUICK.map(q => (
          <button
            key={q}
            onClick={() => { setInput(q); setTimeout(send, 0); setMessages(m => [...m, { from: "user", text: q }]); setInput(""); setTyping(true); setTimeout(() => { setTyping(false); setMessages(m => [...m, { from: "bot", text: getBotReply(q) }]); }, 800); }}
            style={{
              padding: "4px 10px", borderRadius: "20px", border: "1px solid var(--border-light)",
              background: "var(--bg-app)", fontSize: "11px", color: "var(--text-muted)",
              cursor: "pointer", fontWeight: 500,
            }}
          >{q}</button>
        ))}
      </div>

      {/* Input */}
      <style>{`@keyframes botDot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
      <div style={{
        display: "flex", gap: "8px", alignItems: "center",
        background: "var(--bg-app)", border: "1px solid var(--border-light)",
        borderRadius: "10px", padding: "8px 12px",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a question…"
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontSize: "13px", color: "var(--text-main)",
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || typing}
          style={{
            background: input.trim() && !typing ? "var(--primary)" : "var(--border-light)",
            color: "white", border: "none", borderRadius: "8px",
            width: "32px", height: "32px", cursor: input.trim() && !typing ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px",
            transition: "background 0.15s", flexShrink: 0,
          }}
        >➤</button>
      </div>
    </div>
  );
}

/* ── Main Navbar ─────────────────────────────────────────── */
export default function Navbar({ current, onNavigate, alertCount }) {
  const [modal, setModal] = useState(null);
  const [supportTab, setSupportTab] = useState("faq"); // "faq" | "chat"

  /* Settings state */
  const [settings, setSettings] = useState({
    notifications: true,
    alertSound:    false,
    autoRefresh:   true,
    compactView:   false,
  });
  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  return (
    <>
      <aside className="app-sidebar">
        {/* Brand */}
        <div style={{
          padding: "20px 20px 16px",
          display: "flex", alignItems: "center", gap: "10px",
          borderBottom: "1px solid var(--border-light)",
        }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "8px",
            background: "var(--primary)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: "15px", fontWeight: "bold",
          }}>S</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-main)", lineHeight: 1.2 }}>SAMS</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>Smart Agri Mgmt System</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          {NAV.map(n => {
            const active = current === n.id;
            return (
              <button
                key={n.id}
                onClick={() => onNavigate(n.id)}
                className={`nav-item${active ? " active" : ""}`}
              >
                <span style={{ fontSize: "16px", lineHeight: 1, flexShrink: 0 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.id === "field" && alertCount > 0 && (
                  <span style={{
                    background: "var(--danger)", color: "white",
                    fontSize: "10px", fontWeight: 700, minWidth: "18px", height: "18px",
                    borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                  }}>{alertCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border-light)" }}>
          <button
            className="btn-primary"
            onClick={() => setModal("analysis")}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "12px" }}
          >
            <span style={{ fontSize: "16px" }}>+</span> New Analysis
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <button className="nav-item" onClick={() => setModal("settings")}>⚙ Settings</button>
            <button className="nav-item" onClick={() => { setSupportTab("faq"); setModal("support"); }}>❓ Support</button>
          </div>
        </div>
      </aside>

      {/* ══ Modal: New Analysis ══ */}
      {modal === "analysis" && (
        <Modal title="New Analysis" icon="📈" onClose={() => setModal(null)}>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: 1.6 }}>
            Choose the type of analysis to run:
          </p>
          {[
            { icon: "📈", label: "Yield Prediction",  desc: "Upload spectral CSV + IoT data to forecast yield",    page: "predict"    },
            { icon: "🌿", label: "Field Health Scan", desc: "Inspect NDVI, moisture & nutrients across all cells",  page: "field"      },
            { icon: "📊", label: "Analytics Report",  desc: "View historical trends, distributions & insights",     page: "analytics"  },
            { icon: "🚜", label: "Digital Twin Sim",  desc: "Run live field simulation and test scenarios",          page: "simulation" },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => { onNavigate(item.page); setModal(null); }}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-light)",
                background: "var(--bg-app)", cursor: "pointer", marginBottom: "10px", textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "var(--primary-light)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "var(--bg-app)"; }}
            >
              <span style={{ fontSize: "24px", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>{item.label}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>{item.desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "16px" }}>→</span>
            </button>
          ))}
        </Modal>
      )}

      {/* ══ Modal: Settings ══ */}
      {modal === "settings" && (
        <Modal title="Settings" icon="⚙" onClose={() => setModal(null)}>
          <Toggle label="Push Notifications" desc="Receive alerts for critical field events"  checked={settings.notifications} onChange={() => toggle("notifications")} />
          <Toggle label="Alert Sound"        desc="Play a sound when critical alerts arrive"  checked={settings.alertSound}    onChange={() => toggle("alertSound")} />
          <Toggle label="Auto Refresh"       desc="Refresh dashboard data every 10 seconds"  checked={settings.autoRefresh}   onChange={() => toggle("autoRefresh")} />
          <Toggle label="Compact View"       desc="Reduce card padding for smaller screens"  checked={settings.compactView}   onChange={() => toggle("compactView")} />
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setModal(null)}
              style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
            >Save Settings</button>
          </div>
        </Modal>
      )}

      {/* ══ Modal: Support ══ */}
      {modal === "support" && (
        <Modal title="Help & Support" icon="❓" onClose={() => setModal(null)} wide>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {[{ id: "faq", label: "📋 FAQ" }, { id: "chat", label: "🤖 Chat Assistant" }].map(t => (
              <button
                key={t.id}
                onClick={() => setSupportTab(t.id)}
                style={{
                  padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontSize: "13px", fontWeight: 600, transition: "all 0.15s",
                  background: supportTab === t.id ? "var(--primary)" : "var(--bg-app)",
                  color: supportTab === t.id ? "white" : "var(--text-muted)",
                  border: supportTab === t.id ? "none" : "1px solid var(--border-light)",
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* FAQ tab */}
          {supportTab === "faq" && (
            <>
              {[
                { q: "How do I run a yield prediction?",  a: "Go to Yield Predict, upload a 131-column spectral CSV, set soil moisture & temperature, then click Generate Prediction." },
                { q: "What is the Digital Twin?",         a: "A live simulation of your field. Start the simulation to watch NDVI, moisture, and nutrients drift in real time." },
                { q: "Why is the prediction failing?",    a: "Ensure the backend Flask server is running with the correct Python venv that has TensorFlow installed." },
                { q: "How do I interpret NDVI?",          a: "NDVI ≥ 0.65 = Healthy, 0.35–0.65 = Moderate, < 0.35 = Critical. Apply water or fertilizer to improve it." },
                { q: "How to get crop recommendations?",  a: "Go to Crop Yield page, adjust the sliders (moisture, temperature, nitrogen, pH) and click Get Recommendations." },
              ].map((f, i) => (
                <details key={i} style={{ marginBottom: "10px", borderRadius: "8px", border: "1px solid var(--border-light)", overflow: "hidden" }}>
                  <summary style={{ padding: "12px 14px", cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "var(--text-main)", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
                    {f.q} <span style={{ color: "var(--text-muted)" }}>＋</span>
                  </summary>
                  <p style={{ padding: "0 14px 12px", margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{f.a}</p>
                </details>
              ))}
              <div style={{
                marginTop: "16px", padding: "16px", borderRadius: "10px",
                background: "var(--primary-light)", border: "1px solid var(--primary)",
                display: "flex", gap: "12px", alignItems: "flex-start",
              }}>
                <span style={{ fontSize: "24px" }}>📧</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--primary)" }}>Contact Support</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>support@sams-agri.com · Mon–Fri, 9am–6pm IST</div>
                </div>
              </div>
            </>
          )}

          {/* Chat tab */}
          {supportTab === "chat" && <Chatbot />}
        </Modal>
      )}
    </>
  );
}