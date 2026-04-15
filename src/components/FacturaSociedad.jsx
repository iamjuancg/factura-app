import { useState, useEffect } from "react";
import Field from "./Field";
import ImportPDFButton from "./ImportPDFButton";
import * as S from "./styles";
import { generateSociedadPDF } from "../pdf";
import { usePersonas } from "../context/PersonasContext";
import { safe } from "../pdfImport";

const today = new Date().toISOString().split("T")[0];
const LINE_GRID = "2fr 80px 100px 100px 100px 36px";
const STORAGE_KEY = "factura_sociedad_selected";

export default function FacturaSociedad() {
  const { clientes, receptor, loading, error } = usePersonas();

  const [numero, setNumero] = useState("000010");
  const [fecha, setFecha] = useState(today);
  const [selectedId, setSelectedId] = useState(null);
  const [ivaPct, setIvaPct] = useState(21);
  const [lineas, setLineas] = useState([
    { id: 1, descripcion: "Gestion de proyectos (tipo 1)", cantidad: 177, tarifa: 78 },
    { id: 2, descripcion: "Gestion de proyectos (tipo 2)", cantidad: 177, tarifa: 72 },
    { id: 3, descripcion: "Ejecucion de proyectos", cantidad: 80, tarifa: 62 },
  ]);

  useEffect(() => {
    if (clientes.length > 0) {
      const saved = localStorage.getItem(STORAGE_KEY);
      const found = clientes.find(c => c.nombre === saved);
      setSelectedId(found ? found.id : clientes[0].id);
    }
  }, [clientes]);

  const cliente = clientes.find(c => c.id === selectedId) || clientes[0];

  const handleSelect = (id) => {
    setSelectedId(id);
    const found = clientes.find(c => c.id === id);
    if (found) localStorage.setItem(STORAGE_KEY, found.nombre);
  };

  const addLinea = () => setLineas(l => [...l, { id: Date.now(), descripcion: "", cantidad: 1, tarifa: 0 }]);
  const removeLinea = id => setLineas(l => l.filter(x => x.id !== id));
  const updateLinea = (id, k, v) => setLineas(l => l.map(x => x.id === id ? { ...x, [k]: v } : x));

  const base     = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.tarifa), 0);
  const ivaTotal = base * ivaPct / 100;
  const total    = base + ivaTotal;

  const handleImport = ({ data }) => {
    if (data.numero) setNumero(data.numero);
    if (data.fecha) setFecha(data.fecha);
    if (data.ivaPct != null) setIvaPct(Number(data.ivaPct));
    if (data.lineas && data.lineas.length > 0) {
      setLineas(data.lineas.map((l, i) => ({
        id: Date.now() + i,
        descripcion: l.descripcion || "",
        cantidad: Number(l.cantidad) || 0,
        tarifa: Number(l.tarifa) || 0,
      })));
    }
    // Try to match receptor (cliente) by name
    if (data.receptorNombre && clientes.length > 0) {
      const nameClean = safe(data.receptorNombre).toLowerCase();
      const match = clientes.find(c => safe(c.nombre).toLowerCase() === nameClean);
      if (match) handleSelect(match.id);
    }
  };

  const handleGenerate = () => {
    if (!cliente) return;
    if (!numero.trim()) return alert("Introduce un numero de factura.");
    if (!fecha) return alert("Selecciona una fecha.");
    if (lineas.length === 0) return alert("Añade al menos una linea.");
    const invalid = lineas.some(l => !l.descripcion.trim() || Number(l.cantidad) <= 0 || Number(l.tarifa) < 0);
    if (invalid) return alert("Revisa las lineas: descripcion obligatoria, cantidad > 0 y tarifa >= 0.");
    generateSociedadPDF({
      numero, fecha,
      emisorNombre: receptor.nombre, emisorNif: receptor.nif,
      emisorDireccion: receptor.direccion, emisorCiudad: receptor.ciudad,
      receptorNombre: cliente.nombre, receptorNif: cliente.nif,
      receptorDireccion: cliente.direccion, receptorCiudad: cliente.ciudad,
      iban: receptor.iban,
      lineas, ivaPct,
    });
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "var(--text-3)", fontSize: 14 }}>
      <div style={{ marginBottom: 12, fontSize: 24 }}>{"⏳"}</div>
      Cargando datos...
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: 60, color: "var(--danger)", fontSize: 14 }}>
      <div style={{ marginBottom: 12, fontSize: 24 }}>{"⚠️"}</div>
      {error}
    </div>
  );

  return (
    <div>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...S.sectionTitle, marginBottom: 14 }}>
          <span>Datos de la factura</span>
          <ImportPDFButton onImport={handleImport} expectedType="sociedad" />
        </div>
        <div style={S.grid2}>
          <Field label="Num. Factura"><input value={numero} onChange={e => setNumero(e.target.value)} /></Field>
          <Field label="Fecha"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></Field>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Emisor - Sociedad</div>
        <div style={{ padding: 12, background: "var(--surface-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--navy)" }}>{receptor.nombre}</strong> - NIF: {receptor.nif}<br />
          {receptor.direccion}, {receptor.ciudad}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Receptor - Cliente</div>
        <Field label="Seleccionar cliente">
          <select value={selectedId || ""} onChange={e => handleSelect(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: 14, background: "var(--surface)", color: "var(--navy)", cursor: "pointer" }}>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </Field>
        {cliente && (
          <div style={{ marginTop: 12, padding: 12, background: "var(--surface-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--navy)" }}>{cliente.nombre}</strong> - NIF: {cliente.nif}<br />
            {cliente.direccion}, {cliente.ciudad}
            {cliente.email && <><br />{cliente.email}</>}
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Lineas de factura</div>
        <div style={{ display: "grid", gridTemplateColumns: LINE_GRID, gap: 8, paddingBottom: 6, borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
          <span style={S.lhCell}>Descripcion</span>
          <span style={{ ...S.lhCell, textAlign: "right" }}>Cantidad</span>
          <span style={{ ...S.lhCell, textAlign: "right" }}>Tarifa</span>
          <span style={{ ...S.lhCell, textAlign: "right" }}>IVA</span>
          <span style={{ ...S.lhCell, textAlign: "right" }}>Total</span>
          <span />
        </div>
        {lineas.map(l => {
          const sub = Number(l.cantidad) * Number(l.tarifa);
          const ivaLine = sub * ivaPct / 100;
          return (
            <div key={l.id} style={{ display: "grid", gridTemplateColumns: LINE_GRID, gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input value={l.descripcion} placeholder="Descripcion" onChange={e => updateLinea(l.id, "descripcion", e.target.value)} />
              <input type="number" value={l.cantidad} min="0" style={{ textAlign: "right" }} onChange={e => updateLinea(l.id, "cantidad", e.target.value)} />
              <input type="number" value={l.tarifa} min="0" step="0.01" style={{ textAlign: "right" }} onChange={e => updateLinea(l.id, "tarifa", e.target.value)} />
              <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "var(--text-3)", textAlign: "right" }}>{S.fmt(ivaLine)}</span>
              <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: "var(--text-2)", textAlign: "right" }}>{S.fmt(sub + ivaLine)}</span>
              <button style={S.delBtn} onClick={() => removeLinea(l.id)}>x</button>
            </div>
          );
        })}
        <button style={S.addBtn} onClick={addLinea}>+ Añadir linea</button>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Impuestos y totales</div>
        <div style={{ maxWidth: 200, marginBottom: 16 }}>
          <Field label="IVA (%)"><input type="number" value={ivaPct} min="0" max="100" onChange={e => setIvaPct(Number(e.target.value))} /></Field>
        </div>
        <div style={S.totalsBox}>
          <div style={S.totalRow}><span>Base Imponible</span><span style={S.totalAmt}>{S.fmt(base)}</span></div>
          <div style={S.totalRow}><span>IVA ({ivaPct}%)</span><span style={S.totalAmt}>{S.fmt(ivaTotal)}</span></div>
          <div style={S.totalGrand}><span>Total</span><span style={S.totalGrandAmt}>{S.fmt(total)}</span></div>
        </div>
      </div>

      <button style={S.genBtn} onClick={handleGenerate}>Descargar factura PDF</button>
    </div>
  );
}