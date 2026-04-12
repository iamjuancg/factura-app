import { useState } from "react";
import Field from "./Field";
import * as S from "./styles";
import { generateSociedadPDF } from "../pdf";
import { usePersonas } from "../context/PersonasContext";

const today = new Date().toISOString().split("T")[0];
const LINE_GRID = "2fr 80px 100px 100px 100px 36px";

export default function FacturaSociedad() {
  const { clientes, receptor } = usePersonas();

  const [numero, setNumero] = useState("000010");
  const [fecha, setFecha] = useState(today);
  const [selectedId, setSelectedId] = useState(clientes[0]?.id ?? null);
  const [ivaPct, setIvaPct] = useState(21);
  const [lineas, setLineas] = useState([
    { id: 1, descripcion: "Gestion de proyectos (tipo 1)", cantidad: 177, tarifa: 78 },
    { id: 2, descripcion: "Gestion de proyectos (tipo 2)", cantidad: 177, tarifa: 72 },
    { id: 3, descripcion: "Ejecucion de proyectos",        cantidad: 80,  tarifa: 62 },
  ]);

  const cliente = clientes.find(c => c.id === selectedId) || clientes[0];

  const addLinea = () => setLineas(l => [...l, { id: Date.now(), descripcion: "", cantidad: 1, tarifa: 0 }]);
  const removeLinea = id => setLineas(l => l.filter(x => x.id !== id));
  const updateLinea = (id, k, v) => setLineas(l => l.map(x => x.id === id ? { ...x, [k]: v } : x));

  const base     = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.tarifa), 0);
  const ivaTotal = base * ivaPct / 100;
  const total    = base + ivaTotal;

  const handleGenerate = () => {
    if (!cliente) return;
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

  return (
    <div>
      <div style={S.card}>
        <div style={S.sectionTitle}>Datos de la factura</div>
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
          <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
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
          const sub     = Number(l.cantidad) * Number(l.tarifa);
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
        <button style={S.addBtn} onClick={addLinea}>+ AÃ±adir linea</button>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Impuestos y totales</div>
        <div style={{ maxWidth: 200, marginBottom: 16 }}>
          <Field label="IVA (%)"><input type="number" value={ivaPct} min="0" max="100" onChange={e => setIvaPct(e.target.value)} /></Field>
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