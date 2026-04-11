import { useState } from 'react';
import Field from './Field';
import * as S from './styles';
import { generateAutonomoPDF } from '../pdf';

const today = new Date().toISOString().split('T')[0];

const DEFAULT = {
  numero: '000002', fecha: today,
  emisorNombre: 'Juan Cotrina Gutiérrez', emisorDni: '76074376J',
  emisorDireccion: 'Juan de Austria, 31, 4ºB', emisorCiudad: '28010, Madrid',
  emisorEmail: 'jucotrina@gmail.com', emisorTel: '+34 630 156 786',
  receptorNombre: 'Stratos Dynamis Consulting S.L.', receptorNif: 'B21951033',
  receptorDireccion: 'Avenida de Mallorca 4, Bajo C.', receptorCiudad: '28290, Las Rozas de Madrid',
  receptorEmail: 'administracion@stratosdc.es', receptorTel: '+34 649 925 463',
  iban: 'ES87 0182 9465 6002 0597 6548',
  ivaPct: 21, irpfPct: 15,
};

const LINE_GRID = '2fr 80px 100px 100px 36px';

export default function FacturaAutonomo() {
  const [form, setForm] = useState(DEFAULT);
  const [lineas, setLineas] = useState([{ id: 1, descripcion: 'Gestión de proyectos', cantidad: 1, precio: 14320 }]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const addLinea = () => setLineas(l => [...l, { id: Date.now(), descripcion: '', cantidad: 1, precio: 0 }]);
  const removeLinea = id => setLineas(l => l.filter(x => x.id !== id));
  const updateLinea = (id, k, v) => setLineas(l => l.map(x => x.id === id ? { ...x, [k]: v } : x));

  const base = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio), 0);
  const ivaAmt = base * form.ivaPct / 100;
  const irpfAmt = base * form.irpfPct / 100;
  const total = base + ivaAmt - irpfAmt;

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
        <div style={S.sectionTitle}>Emisor · Autónomo</div>
        <div style={{ ...S.grid2, marginBottom: 12 }}>
          <Field label="Nombre completo"><input value={form.emisorNombre} onChange={set('emisorNombre')} /></Field>
          <Field label="DNI"><input value={form.emisorDni} onChange={set('emisorDni')} /></Field>
        </div>
        <div style={{ ...S.grid2, marginBottom: 12 }}>
          <Field label="Dirección"><input value={form.emisorDireccion} onChange={set('emisorDireccion')} /></Field>
          <Field label="Ciudad / CP"><input value={form.emisorCiudad} onChange={set('emisorCiudad')} /></Field>
        </div>
        <div style={S.grid2}>
          <Field label="Email"><input type="email" value={form.emisorEmail} onChange={set('emisorEmail')} /></Field>
          <Field label="Teléfono"><input value={form.emisorTel} onChange={set('emisorTel')} /></Field>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Receptor · Sociedad</div>
        <div style={{ ...S.grid2, marginBottom: 12 }}>
          <Field label="Razón Social"><input value={form.receptorNombre} onChange={set('receptorNombre')} /></Field>
          <Field label="NIF"><input value={form.receptorNif} onChange={set('receptorNif')} /></Field>
        </div>
        <div style={{ ...S.grid2, marginBottom: 12 }}>
          <Field label="Dirección"><input value={form.receptorDireccion} onChange={set('receptorDireccion')} /></Field>
          <Field label="Ciudad / CP"><input value={form.receptorCiudad} onChange={set('receptorCiudad')} /></Field>
        </div>
        <div style={S.grid2}>
          <Field label="Email"><input type="email" value={form.receptorEmail} onChange={set('receptorEmail')} /></Field>
          <Field label="Teléfono"><input value={form.receptorTel} onChange={set('receptorTel')} /></Field>
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
          <span style={{ ...S.lhCell, textAlign: 'right' }}>Precio</span>
          <span style={{ ...S.lhCell, textAlign: 'right' }}>Total</span>
          <span />
        </div>
        {lineas.map(l => (
          <div key={l.id} style={{ display: 'grid', gridTemplateColumns: LINE_GRID, gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input value={l.descripcion} placeholder="Descripción del servicio" onChange={e => updateLinea(l.id, 'descripcion', e.target.value)} />
            <input type="number" value={l.cantidad} min="0" style={{ textAlign: 'right' }} onChange={e => updateLinea(l.id, 'cantidad', e.target.value)} />
            <input type="number" value={l.precio} min="0" step="0.01" style={{ textAlign: 'right' }} onChange={e => updateLinea(l.id, 'precio', e.target.value)} />
            <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: 'var(--text-2)', textAlign: 'right' }}>
              {S.fmt(Number(l.cantidad) * Number(l.precio))}
            </span>
            <button style={S.delBtn} onClick={() => removeLinea(l.id)}>×</button>
          </div>
        ))}
        <button style={S.addBtn} onClick={addLinea}>+ Añadir línea</button>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Impuestos y totales</div>
        <div style={{ ...S.grid2, marginBottom: 16 }}>
          <Field label="IVA (%)"><input type="number" value={form.ivaPct} min="0" max="100" onChange={set('ivaPct')} /></Field>
          <Field label="IRPF (%)"><input type="number" value={form.irpfPct} min="0" max="100" onChange={set('irpfPct')} /></Field>
        </div>
        <div style={S.totalsBox}>
          <div style={S.totalRow}><span>Base Imponible</span><span style={S.totalAmt}>{S.fmt(base)}</span></div>
          <div style={S.totalRow}><span>IVA ({form.ivaPct}%)</span><span style={S.totalAmt}>{S.fmt(ivaAmt)}</span></div>
          <div style={{ ...S.totalRow, color: 'var(--danger)' }}>
            <span>IRPF (−{form.irpfPct}%)</span>
            <span style={{ ...S.totalAmt, color: 'var(--danger)' }}>−{S.fmt(irpfAmt)}</span>
          </div>
          <div style={S.totalGrand}><span>Total</span><span style={S.totalGrandAmt}>{S.fmt(total)}</span></div>
        </div>
      </div>

      <button style={S.genBtn} onClick={() => generateAutonomoPDF({ ...form, lineas })}>
        Descargar factura PDF ↓
      </button>
    </div>
  );
}
