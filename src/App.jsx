import { useState } from "react";
import FacturaAutonomo from "./components/FacturaAutonomo";
import FacturaSociedad from "./components/FacturaSociedad";
import GestionPersonas from "./components/GestionPersonas";
import { PersonasProvider } from "./context/PersonasContext";

const PASSWORD = "stratos2026";

function IconDoc() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 5h6M4 7.5h4M4 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconDoc2() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 4h6M4 7h6M4 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconPeople() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

const NAV = [
  { id: "autonomo", label: "Autonomo -> Sociedad", icon: <IconDoc />, section: "Facturas" },
  { id: "sociedad", label: "Sociedad -> Cliente",  icon: <IconDoc2 />, section: null },
  { id: "personas", label: "Personas",             icon: <IconPeople />, section: "Configuracion" },
];

export default function App() {
  const [tab, setTab] = useState("autonomo");
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);

  const login = () => {
    if (pwd === PASSWORD) { setAuth(true); setPwdError(false); }
    else setPwdError(true);
  };

  if (!auth) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", border: "0.5px solid #e4e8f2", borderRadius: 16, padding: 40, width: 320, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, background: "#0f2b5b", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#5bb4f5" strokeWidth="1.5"/>
              <path d="M4 5h6M4 7.5h4M4 10h3" stroke="#5bb4f5" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: "#0f2b5b", marginBottom: 4 }}>Facturas</h2>
          <p style={{ fontSize: 13, color: "#9aa0b8", marginBottom: 24 }}>Stratos Dynamis Consulting</p>
          <input
            type="password"
            placeholder="Contrasena de acceso"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setPwdError(false); }}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: pwdError ? "1px solid #c94040" : "0.5px solid #e4e8f2", fontSize: 14, marginBottom: 8, outline: "none", boxSizing: "border-box" }}
          />
          {pwdError && <p style={{ fontSize: 12, color: "#c94040", marginBottom: 8 }}>Contrasena incorrecta</p>}
          <button onClick={login} style={{ width: "100%", padding: 12, background: "#0f2b5b", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <PersonasProvider>
      <div style={{ minHeight: "100vh", background: "#f0f4f9", display: "flex", flexDirection: "column" }}>

        <header style={{ background: "#0f2b5b", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: "rgba(91,180,245,0.18)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="#5bb4f5" strokeWidth="1.5"/>
                <path d="M4 5h6M4 7.5h4M4 10h3" stroke="#5bb4f5" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ color: "#fff", fontWeight: 500, fontSize: 15 }}>Facturas</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>Stratos Dynamis Consulting</span>
            <button onClick={() => setAuth(false)} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
              Salir
            </button>
          </div>
        </header>

        <div style={{ display: "flex", flex: 1 }}>

          <aside style={{ width: 210, minWidth: 210, background: "#0f2b5b", padding: "16px 10px", display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: 52, height: "calc(100vh - 52px)" }}>
            {NAV.map((item, i) => (
              <div key={item.id}>
                {item.section && (
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", padding: i === 0 ? "4px 12px 6px" : "16px 12px 6px" }}>
                    {item.section}
                  </div>
                )}
                <button onClick={() => setTab(item.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 13, textAlign: "left", transition: "all 0.15s",
                  background: tab === item.id ? "rgba(91,180,245,0.15)" : "transparent",
                  color: tab === item.id ? "#5bb4f5" : "rgba(255,255,255,0.55)",
                }}>
                  {item.icon}
                  {item.label}
                </button>
              </div>
            ))}
          </aside>

          <main style={{ flex: 1, padding: "28px 24px 60px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 680 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 500, color: "#0f2b5b" }}>
                    {tab === "personas" ? "Gestion de personas" : "Nueva factura"}
                  </h1>
                  {tab !== "personas" && (
                    <span style={{ background: "rgba(91,180,245,0.12)", color: "#0f2b5b", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>
                      {tab === "autonomo" ? "Autonomo -> Sociedad" : "Sociedad -> Cliente"}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#9aa0b8" }}>
                  {tab === "personas" ? "Administra los datos de socios y clientes." : "Rellena los campos y descarga el PDF listo para enviar."}
                </p>
              </div>

              {tab === "autonomo" && <FacturaAutonomo />}
              {tab === "sociedad" && <FacturaSociedad />}
              {tab === "personas" && <GestionPersonas />}
            </div>
          </main>

        </div>
      </div>
    </PersonasProvider>
  );
}