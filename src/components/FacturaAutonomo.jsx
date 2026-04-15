import { useState, useEffect } from "react";
import Field from "./Field";
import ImportPDFButton from "./ImportPDFButton";
import * as S from "./styles";
import { generateAutonomoPDF } from "../pdf";
import { usePersonas } from "../context/PersonasContext";
import { safe } from "../pdfImport";

const today = new Date().toISOString().split("T")[0];
const LINE_GRID = "2fr 80px 100px 100px 36px";
const STORAGE_KEY = "factura_autonomo_selected";

export default function FacturaAutonomo() {
  const { autonomos, receptor, loading, error } = usePersonas();

  const [numero, setNumero] = useState("000002");
  const [fecha, setFecha] = useState(today);
  const [selectedId, setSelectedId] = useState(null);
  const [ivaPct, setIvaPct] = useState(21);
  const [irpfPct, setIrpfPct] = useState(15);
  const [lineas, setLineas] = useState([{ id: 1, descripcion: "Gestion de proyectos", cantidad: 1, precio: 14320 }]);

  // Cargar ultimo seleccionado
  useEffect(() => {
    if (autonomos.length > 0) {
      const saved = localStorage.getItem(STORAGE_KEY);
      const found = autonomos.find(a => a.nombre === saved);
      setSelectedId(found ? found.id : autonomos[0].id);
    }
  }, [autonomos]);

  const emisor = autonomos.find(a => a.id === selectedId) || autonomos[0];

  const handleSelect = (id) => {
    setSelectedId(id);
    const found = autonomos.find(a => a.id === id);
    if (found) localStorage.setItem(STORAGE_KEY, found.nombre);
  };

  const addLinea = () => setLineas(l => [...l, { id: Date.now(), descripcion: "", cantidad: 1, precio: 0 }]);
  const removeLinea = id => setLineas(l => l.filter(x => x.id !== id));
  const updateLinea = (id, k, v) => setLineas(l => l.map(x => x.id === id ? { ...x, [k]: v } : x));

  const base    = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio), 0);
  const ivaAmt  = base * ivaPct / 100;
  const irpfAmt = base * irpfPct / 100;
  const total   = base + ivaAmt - irpfAmt;

  const handleImport = ({ data }) => {
    if (data.numero) setNumero(data.numero);
    if (data.fecha) setFecha(data.fecha);
    if (data.ivaPct != null) setIvaPct(Number(data.ivaPct));
    if (data.irpfPct != null) setIrpfPct(Number(data.irpfPct));
    if (data.lineas && data.lineas.length > 0) {
      setLineas(data.lineas.map((l, i) => ({
        id: Date.now() + i,
        descripcion: l.descripcion || "",
        cantidad: Number(l.cantidad) || 0,
        precio: Number(l.precio) || 0,
      })));
    }
    // Try to match emisor by name
    if (data.emisorNombre && autonomos.length > 0) {
      const nameClean = safe(data.emisorNombre).toLowerCase();
      const match = autonomos.find(a => safe(a.nombre).toLowerCase() === nameClean);
      if (match) handleSelect(match.id);
    }
  };

  const handleGenerate = () => {
    if (!emisor) return;
    if (!numero.trim()) return alert("Introduce un numero de factura.");
    if (!fecha) return alert("Selecciona una fecha.");
    if (lineas.length === 0) return alert("Añade al menos una linea.");
    const invalid = lineas.some(l => !l.descripcion.trim() || Number(l.cantidad) <= 0 || Number(l.precio) < 0);
    if (invalid) return alert("Revisa las lineas: descripcion obligatoria, cantidad > 0 y precio >= 0.");
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
          <ImportPDFButton onImport={handleImport} expectedType="autonomo" />
        </div>
        <div style={S.grid2}>
          <Field label="Num. Factura"><input value={numero} onChange={e => setNumero(e.target.value)} /></Field>
          <Field label="Fecha"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></Field>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Emisor - Autonomo</div>
        <Field label="Seleccionar socio">
          <select value={selectedId || ""} onChange={e => handleSelect(Number(e.target.value))}
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
          <Field label="IVA (%)"><input type="number" value={ivaPct} min="0" max="100" onChange={e => setIvaPct(Number(e.target.value))} /></Field>
          <Field label="IRPF (%)"><input type="number" value={irpfPct} min="0" max="100" onChange={e => setIrpfPct(Number(e.target.value))} /></Field>
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