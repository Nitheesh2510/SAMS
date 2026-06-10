const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const get  = (path)       => fetch(`${BASE}${path}`).then(r => r.json());
const post = (path, body) => fetch(`${BASE}${path}`, {
  method: "POST", headers: {"Content-Type": "application/json"},
  body: JSON.stringify(body)
}).then(r => r.json());

export const api = {
  health:       ()           => get("/health"),
  predict:      (body)       => post("/predict", body),
  predictSample:(body)       => post("/predict/sample", body || {}),
  history:      (limit = 50) => get(`/history?limit=${limit}`),
  fieldGrid:    ()           => get("/field/grid"),
  remediate:    (cid, action)=> post(`/field/grid/${cid}/remediate`, { action }),
  sensorSummary:()           => get("/sensors/summary"),
  recommendCrop:(body)       => post("/recommend/crop", body),
  analytics:    ()           => get("/analytics/overview"),
  startSim:     ()           => post("/simulation/start", {}),
  stopSim:      ()           => post("/simulation/stop", {}),
  simStatus:    ()           => get("/simulation/status"),
};