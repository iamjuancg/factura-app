import { useState } from "react";
import Field from "./Field";
import * as S from "./styles";
import { usePersonas } from "../context/PersonasContext";

const EMPTY_AUTONOMO = { nombre: "", dni: "", direccion: "", ciudad: "", email: "", tel: "", iban: "" };
const EMPTY_CLIENTE   = { nombre: "", nif: "", direccion: "", ciudad: "", email: "", tel: "" };

function PersonaForm({ fields, values, onChange, onSave, onCancel }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--blue-accent)", borderRadius: "var(--radius)", padding: 16, marginTop: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {fields.map(f => (
          <Field key={f.key} label={f.label} style={f.full ? { gridColumn: "1 / -1" } : {}}>
            <input value={values[f.key] || ""} onChange={e => onChange(f.key, e.target.value)} />
          </Field>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ ...S.addBtn, width: "auto", padding: "8px 16px", border: "1px solid var(--border)" }}>Cancelar</button>
        <button onClick={onSave} style={{ ...S.genBtn, width: "auto", padding: "8px 20px", marginTop: 0, fontSize: 13 }}>Guardar</button>
      </div>
    </div>
  );
}

function PersonaCard({ persona, fields, onEdit, onDelete, ibanKey }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)", marginBottom: 2 }}>{persona.nombre}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
          {fields.filter(f => f.key !== "nombre" && f.key !== ibanKey && persona[f.key]).map(f => persona[f.key]).join(" - ")}
        </div>
        {ibanKey && persona[ibanKey] && (
          <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace", marginTop: 2 }}>{persona[ibanKey]}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-2)" }}>Editar</button>
        <button onClick={onDelete} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #fca5a5", background: "none", cursor: "pointer", color: "var(--danger)" }}>Eliminar</button>
      </div>
    </div>
  );
}

const AUTONOMO_FIELDS = [
  { key: "nombre",    label: "Nombre completo", full: true },
  { key: "dni",       label: "DNI" },
  { key: "iban",      label: "IBAN" },
  { key: "direccion", label: "Direccion" },
  { key: "ciudad",    label: "Ciudad / CP" },
  { key: "email",     label: "Email" },
  { key: "tel",       label: "Telefono" },
];

const CLIENTE_FIELDS = [
  { key: "nombre",    label: "Razon Social", full: true },
  { key: "nif",       label: "NIF" },
  { key: "email",     label: "Email" },
  { key: "direccion", label: "Direccion" },
  { key: "ciudad",    label: "Ciudad / CP" },
  { key: "tel",       label: "Telefono" },
];

export default function GestionPersonas() {
  const { autonomos, addAutonomo, updateAutonomo, removeAutonomo,
          clientes,  addCliente,  updateCliente,  removeCliente } = usePersonas();

  const [showNewA, setShowNewA] = useState(false);
  const [editingA, setEditingA] = useState(null);
  const [newA, setNewA] = useState(EMPTY_AUTONOMO);

  const [showNewC, setShowNewC] = useState(false);
  const [editingC, setEditingC] = useState(null);
  const [newC, setNewC] = useState(EMPTY_CLIENTE);

  const changeA = (k, v) => setNewA(p => ({ ...p, [k]: v }));
  const changeC = (k, v) => setNewC(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...S.sectionTitle, marginBottom: 0 }}>
          <span>Socios - Autonomos</span>
          <button onClick={() => { setShowNewA(true); setEditingA(null); setNewA(EMPTY_AUTONOMO); }}
            style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "1px solid var(--blue-accent)", background: "none", cursor: "pointer", color: "var(--navy)", fontWeight: 500 }}>
            + AÃ±adir
          </button>
        </div>
        {autonomos.map(a => (
          editingA === a.id ? (
            <PersonaForm key={a.id} fields={AUTONOMO_FIELDS} values={newA} onChange={changeA}
              onSave={() => { updateAutonomo(a.id, newA); setEditingA(null); }}
              onCancel={() => setEditingA(null)} />
          ) : (
            <PersonaCard key={a.id} persona={a} fields={AUTONOMO_FIELDS} ibanKey="iban"
              onEdit={() => { setEditingA(a.id); setNewA({ ...a }); setShowNewA(false); }}
              onDelete={() => removeAutonomo(a.id)} />
          )
        ))}
        {showNewA && !editingA && (
          <PersonaForm fields={AUTONOMO_FIELDS} values={newA} onChange={changeA}
            onSave={() => { addAutonomo(newA); setShowNewA(false); setNewA(EMPTY_AUTONOMO); }}
            onCancel={() => setShowNewA(false)} />
        )}
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...S.sectionTitle, marginBottom: 0 }}>
          <span>Clientes</span>
          <button onClick={() => { setShowNewC(true); setEditingC(null); setNewC(EMPTY_CLIENTE); }}
            style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "1px solid var(--blue-accent)", background: "none", cursor: "pointer", color: "var(--navy)", fontWeight: 500 }}>
            + AÃ±adir
          </button>
        </div>
        {clientes.map(c => (
          editingC === c.id ? (
            <PersonaForm key={c.id} fields={CLIENTE_FIELDS} values={newC} onChange={changeC}
              onSave={() => { updateCliente(c.id, newC); setEditingC(null); }}
              onCancel={() => setEditingC(null)} />
          ) : (
            <PersonaCard key={c.id} persona={c} fields={CLIENTE_FIELDS} ibanKey={null}
              onEdit={() => { setEditingC(c.id); setNewC({ ...c }); setShowNewC(false); }}
              onDelete={() => removeCliente(c.id)} />
          )
        ))}
        {showNewC && !editingC && (
          <PersonaForm fields={CLIENTE_FIELDS} values={newC} onChange={changeC}
            onSave={() => { addCliente(newC); setShowNewC(false); setNewC(EMPTY_CLIENTE); }}
            onCancel={() => setShowNewC(false)} />
        )}
      </div>
    </div>
  );
}