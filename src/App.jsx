import { useState } from "react";
import FacturaAutonomo from "./components/FacturaAutonomo";
import FacturaSociedad from "./components/FacturaSociedad";
import GestionPersonas from "./components/GestionPersonas";
import { PersonasProvider } from "./context/PersonasContext";

const TABS = [
  { id: "autonomo", label: "Autonomo -> Sociedad" },
  { id: "sociedad", label: "Sociedad -> Cliente" },
  { id: "personas", label: "Personas" },
];

const PASSWORD = "stratos2026";

export default function App() {
  const [tab, setTab] = useState("autonomo");
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);

  if (!auth) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 40, boxShadow: "var(--shadow-sm)", width: 320, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, background: "var(--navy)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#5bb4f5" strokeWidth="1.5"/>
              <path d="M4 5h6M4 7.5h4M4 10h3" stroke="#5bb4f5" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Facturas</h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 24 }}>Stratos Dynamis Consulting</p>
          <input
            type="password"
            placeholder="Contrasena de acceso"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setPwdError(false); }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                if (pwd === PASSWORD) { setAuth(true); } else { setPwdError(true); }
              }
            }}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius)", border: pwdError ? "1px solid var(--danger)" : "1px solid var(--border)", fontSize: 14, marginBottom: 8, boxSizing: "border-box" }}
          />
          {pwdError && <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8 }}>Contrasena incorrecta</p>}
          <button
            onClick={() => { if (pwd === PASSWORD) { setAuth(true); } else { setPwdError(true); } }}
            style={{ width: "100%", padding: 12, background: "var(--navy)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <PersonasProvider>
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <header style={{
          background: "var(--navy)", padding: "0 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 56, position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "rgba(91,180,245,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="#5bb4f5" strokeWidth="1.5"/>
                <path d="M4 5h6M4 7.5h4M4 10h3" stroke="#5bb4f5" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>Facturas</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>
              Stratos Dynamis Consulting
            </div>
            <button onClick={() => setAuth(false)} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
              Salir
            </button>
          </div>
        </header>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 60px" }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.02em", marginBottom: 4 }}>
              {tab === "personas" ? "Gestion de " : "Nueva "}<strong style={{ fontWeight: 600 }}>{tab === "personas" ? "personas" : "factura"}</strong>
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-3)" }}>
              {tab === "personas" ? "Administra los datos de socios y clientes." : "Rellena los campos y descarga el PDF listo para enviar."}
            </p>
          </div>
          <div style={{
            display: "flex", gap: 4,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: 4, marginBottom: 24,
            boxShadow: "var(--shadow-sm)",
          }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "10px 16px", border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: tab === t.id ? 500 : 400, cursor: "pointer",
                transition: "all 0.15s",
                background: tab === t.id ? "var(--navy)" : "transparent",
                color: tab === t.id ? "#fff" : "var(--text-3)",
              }}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === "autonomo" && <FacturaAutonomo />}
          {tab === "sociedad" && <FacturaSociedad />}
          {tab === "personas" && <GestionPersonas />}
        </main>
      </div>
    </PersonasProvider>
  );
}