import { useState } from "react";
import Field from "./Field";
import * as S from "./styles";
import { generateAutonomoPDF } from "../pdf";
import { usePersonas } from "../context/PersonasContext";

const today = new Date().toISOString().split("T")[0];
const LINE_GRID = "2fr 80px 100px 100px 36px";

export default function FacturaAutonomo() {
  const { autonomos, receptor } = usePersonas();

  const [numero, setNumero] = useState("000002");
  const [fecha, setFecha] = useState(today);
  const [selectedId, setSelectedId] = useState(autonomos[0]?.id ?? null);
  const [ivaPct, setIvaPct] = useState(21);
  const [irpfPct, setIrpfPct] = useState(15);
  const [lineas, setLineas] = useState([{ id: 1, descripcion: "Gestion de proyectos", cantidad: 1, precio: 14320 }]);

  const emisor = autonomos.find(a => a.id === selectedId) || autonomos[0];

  const addLinea = () => setLineas(l => [...l, { id: Date.now(), descripcion: "", cantidad: 1, precio: 0 }]);
  const removeLinea = id => setLineas(l => l.filter(x => x.id !== id));
  const updateLinea = (id, k, v) => setLineas(l => l.map(x => x.id === id ? { ...x, [k]: v } : x));

  const base    = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio), 0);
  const ivaAmt  = base * ivaPct / 100;
  const irpfAmt = base * irpfPct / 100;
  const total   = base + ivaAmt - irpfAmt;

  const handleGenerate = () => {
    if (!emisor) return;
    generateAutonomoPDF({
      numero, fecha,
      emisorNombre: emisor.nombre, emisorDni: emisor.dni,
      emisorDireccion: emisor.direccion, emisorCiudad: emisor.ciudad,
      emisorEmail: emisor.email, emisorTel: emisor.tel,
      receptorNombre: receptor.nombre, receptorNif: receptor.nif,
      receptorDireccion: receptor.direccion, receptorCiudad: receptor.ciudad,
      receptorEmail: receptor.email, receptorTel: receptor.tel,
      iban: emisor.iban,
      lineas, ivaPct, irpfPct,
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
        <div style={S.sectionTitle}>Emisor - Autonomo</div>
        <Field label="Seleccionar socio">
          <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: 14, background: "var(--surface)", color: "var(--navy)", cursor: "pointer" }}>
            {autonomos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </Field>
        {emisor && (
          <div style={{ marginTop: 12, padding: 12, background: "var(--surface-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--navy)" }}>{emisor.nombre}</strong> - DNI: {emisor.dni}<br />
            {emisor.direccion}, {emisor.ciudad}<br />
            {emisor.email} - {emisor.tel}<br />
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-3)" }}>IBAN: {emisor.iban}</span>
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Receptor - Sociedad</div>
        <div style={{ padding: 12, background: "var(--surface-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--navy)" }}>{receptor.nombre}</strong> - NIF: {receptor.nif}<br />
          {receptor.direccion}, {receptor.ciudad}<br />
          {receptor.email} - {receptor.tel}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Lineas de factura</div>
        <div style={{ display: "grid", gridTemplateColumns: LINE_GRID, gap: 8, paddingBottom: 6, borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
          <span style={S.lhCell}>Descripcion</span>
          <span style={{ ...S.lhCell, textAlign: "right" }}>Cantidad</span>
          <span style={{ ...S.lhCell, textAlign: "right" }}>Precio</span>
          <span style={{ ...S.lhCell, textAlign: "right" }}>Total</span>
          <span />
        </div>
        {lineas.map(l => (
          <div key={l.id} style={{ display: "grid", gridTemplateColumns: LINE_GRID, gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input value={l.descripcion} placeholder="Descripcion del servicio" onChange={e => updateLinea(l.id, "descripcion", e.target.value)} />
            <input type="number" value={l.cantidad} min="0" style={{ textAlign: "right" }} onChange={e => updateLinea(l.id, "cantidad", e.target.value)} />
            <input type="number" value={l.precio} min="0" step="0.01" style={{ textAlign: "right" }} onChange={e => updateLinea(l.id, "precio", e.target.value)} />
            <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: "var(--text-2)", textAlign: "right" }}>
              {S.fmt(Number(l.cantidad) * Number(l.precio))}
            </span>
            <button style={S.delBtn} onClick={() => removeLinea(l.id)}>x</button>
          </div>
        ))}
        <button style={S.addBtn} onClick={addLinea}>+ Añadir linea</button>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Impuestos y totales</div>
        <div style={{ ...S.grid2, marginBottom: 16 }}>
          <Field label="IVA (%)"><input type="number" value={ivaPct} min="0" max="100" onChange={e => setIvaPct(e.target.value)} /></Field>
          <Field label="IRPF (%)"><input type="number" value={irpfPct} min="0" max="100" onChange={e => setIrpfPct(e.target.value)} /></Field>
        </div>
        <div style={S.totalsBox}>
          <div style={S.totalRow}><span>Base Imponible</span><span style={S.totalAmt}>{S.fmt(base)}</span></div>
          <div style={S.totalRow}><span>IVA ({ivaPct}%)</span><span style={S.totalAmt}>{S.fmt(ivaAmt)}</span></div>
          <div style={{ ...S.totalRow, color: "var(--danger)" }}>
            <span>IRPF (-{irpfPct}%)</span>
            <span style={{ ...S.totalAmt, color: "var(--danger)" }}>-{S.fmt(irpfAmt)}</span>
          </div>
          <div style={S.totalGrand}><span>Total</span><span style={S.totalGrandAmt}>{S.fmt(total)}</span></div>
        </div>
      </div>

      <button style={S.genBtn} onClick={handleGenerate}>Descargar factura PDF</button>
    </div>
  );
}
