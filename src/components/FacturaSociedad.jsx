import { useState } from 'react';
import Field from './Field';
import * as S from './styles';
import { generateSociedadPDF } from '../pdf';

const today = new Date().toISOString().split('T')[0];

const DEFAULT = {
  numero: '000010', fecha: today,
  emisorNombre: 'Stratos Dynamis Consulting S.L.', emisorNif: 'B21951033',
  emisorDireccion: 'Avenida de Mallorca 4, Bajo C.', emisorCiudad: '28290, Las Rozas de Madrid',
  receptorNombre: 'Kynaxis Technology Solutions S.L.', receptorNif: 'B09633710',
  receptorDireccion: 'Paseo de la Castellana, Nº90, planta 1.', receptorCiudad: '28046, Madrid',
  iban: 'ES44 0182 6135 8502 0166 9830',
  ivaPct: 21,
};

const LINE_GRID = '2fr 80px 100px 100px 100px 36px';

export default function FacturaSociedad() {
  const [form, setForm] = useState(DEFAULT);
  const [lineas, setLineas] = useState([
    { id: 1, descripcion: 'Gestión de proyectos (tipo 1)', cantidad: 177, tarifa: 78 },
    { id: 2, descripcion: 'Gestión de proyectos (tipo 2)', cantidad: 177, tarifa: 72 },
    { id: 3, descripcion: 'Ejecución de proyectos', cantidad: 80, tarifa: 62 },
  ]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const addLinea = () => setLineas(l => [...l, { id: Date.now(), descripcion: '', cantidad: 1, tarifa: 0 }]);
  const removeLinea = id => setLineas(l => l.filter(x => x.id !== id));
  const updateLinea = (id, k, v) => setLineas(l => l.map(x => x.id === id ? { ...x, [k]: v } : x));

  const base = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.tarifa), 0);
  const ivaTotal = base * form.ivaPct / 100;
  const total = base + ivaTotal;

  return (
    <div>
      <div style={S.card}>
        <div style={S.sectionTitle}>Datos de la factura</div>
        <div style={S.grid2}>
          <Field label="Nº Factura"><input value={form.numero} onChange={set('numero')} /></Field>
          <Field label="Fecha"><input type="date" value={form.fecha} onChange={set('fecha')} /></Field>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Emisor · Sociedad</div>
        <div style={{ ...S.grid2, marginBottom: 12 }}>
          <Field label="Razón Social"><input value={form.emisorNombre} onChange={set('emisorNombre')} /></Field>
          <Field label="NIF"><input value={form.emisorNif} onChange={set('emisorNif')} /></Field>
        </div>
        <div style={S.grid2}>
          <Field label="Dirección"><input value={form.emisorDireccion} onChange={set('emisorDireccion')} /></Field>
          <Field label="Ciudad / CP"><input value={form.emisorCiudad} onChange={set('emisorCiudad')} /></Field>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Receptor · Cliente</div>
        <div style={{ ...S.grid2, marginBottom: 12 }}>
          <Field label="Razón Social"><input value={form.receptorNombre} onChange={set('receptorNombre')} /></Field>
          <Field label="NIF"><input value={form.receptorNif} onChange={set('receptorNif')} /></Field>
        </div>
        <div style={S.grid2}>
          <Field label="Dirección"><input value={form.receptorDireccion} onChange={set('receptorDireccion')} /></Field>
          <Field label="Ciudad / CP"><input value={form.receptorCiudad} onChange={set('receptorCiudad')} /></Field>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Cuenta bancaria</div>
        <Field label="IBAN"><input value={form.iban} onChange={set('iban')} /></Field>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Líneas de factura</div>
        <div style={{ display: 'grid', gridTemplateColumns: LINE_GRID, gap: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <span style={S.lhCell}>Descripción</span>
          <span style={{ ...S.lhCell, textAlign: 'right' }}>Cantidad</span>
          <span style={{ ...S.lhCell, textAlign: 'right' }}>Tarifa</span>
          <span style={{ ...S.lhCell, textAlign: 'right' }}>IVA</span>
          <span style={{ ...S.lhCell, textAlign: 'right' }}>Total</span>
          <span />
        </div>
        {lineas.map(l => {
          const sub = Number(l.cantidad) * Number(l.tarifa);
          const ivaLine = sub * form.ivaPct / 100;
          return (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: LINE_GRID, gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input value={l.descripcion} placeholder="Descripción" onChange={e => updateLinea(l.id, 'descripcion', e.target.value)} />
              <input type="number" value={l.cantidad} min="0" style={{ textAlign: 'right' }} onChange={e => updateLinea(l.id, 'cantidad', e.target.value)} />
              <input type="number" value={l.tarifa} min="0" step="0.01" style={{ textAlign: 'right' }} onChange={e => updateLinea(l.id, 'tarifa', e.target.value)} />
              <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'var(--text-3)', textAlign: 'right' }}>{S.fmt(ivaLine)}</span>
              <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: 'var(--text-2)', textAlign: 'right' }}>{S.fmt(sub + ivaLine)}</span>
              <button style={S.delBtn} onClick={() => removeLinea(l.id)}>×</button>
            </div>
          );
        })}
        <button style={S.addBtn} onClick={addLinea}>+ Añadir línea</button>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Impuestos y totales</div>
        <div style={{ maxWidth: 200, marginBottom: 16 }}>
          <Field label="IVA (%)"><input type="number" value={form.ivaPct} min="0" max="100" onChange={set('ivaPct')} /></Field>
        </div>
        <div style={S.totalsBox}>
          <div style={S.totalRow}><span>Base Imponible</span><span style={S.totalAmt}>{S.fmt(base)}</span></div>
          <div style={S.totalRow}><span>IVA ({form.ivaPct}%)</span><span style={S.totalAmt}>{S.fmt(ivaTotal)}</span></div>
          <div style={S.totalGrand}><span>Total</span><span style={S.totalGrandAmt}>{S.fmt(total)}</span></div>
        </div>
      </div>

      <button style={S.genBtn} onClick={() => generateSociedadPDF({ ...form, lineas })}>
        Descargar factura PDF ↓
      </button>
    </div>
  );
}
