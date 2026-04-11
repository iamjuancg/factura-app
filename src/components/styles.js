export const card = {
  background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)', padding: 24,
  boxShadow: 'var(--shadow-sm)', marginBottom: 16,
};

export const sectionTitle = {
  fontSize: 11, fontWeight: 500, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--text-3)',
  marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border)',
};

export const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

export const addBtn = {
  width: '100%', padding: '9px', background: 'none',
  border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)',
  color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', marginTop: 4,
};

export const delBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-3)', fontSize: 18, lineHeight: 1, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28,
};

export const totalsBox = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: 16,
  display: 'flex', flexDirection: 'column', gap: 8,
};

export const totalRow = {
  display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)',
};

export const totalAmt = { fontFamily: "'DM Mono', monospace", fontSize: 13 };

export const totalGrand = {
  display: 'flex', justifyContent: 'space-between',
  padding: '12px 16px', background: 'var(--navy)',
  borderRadius: 'var(--radius)', color: '#fff',
  fontWeight: 600, fontSize: 15, marginTop: 4,
};

export const totalGrandAmt = { fontFamily: "'DM Mono', monospace", color: 'var(--blue-accent)', fontSize: 16 };

export const genBtn = {
  width: '100%', padding: 14, background: 'var(--navy)',
  color: '#fff', border: 'none', borderRadius: 'var(--radius)',
  fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 20,
};

export const lhCell = { fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' };

export function fmt(n) {
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
