import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AUTONOMOS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWeDOnX_4tkvEI6zin85Kv7b-xW2ZRh6ef1ld-3qVdC_guOrVs_JBPSm7uf4Y-Jb15WPPmPWoSK2Ff/pub?gid=0&single=true&output=tsv";
const CLIENTES_URL  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWeDOnX_4tkvEI6zin85Kv7b-xW2ZRh6ef1ld-3qVdC_guOrVs_JBPSm7uf4Y-Jb15WPPmPWoSK2Ff/pub?gid=1848159679&single=true&output=tsv";

const RECEPTOR_DEFAULT = {
  nombre: "Stratos Dynamis Consulting S.L.", nif: "B21951033",
  direccion: "Avenida de Mallorca 4, Bajo C.", ciudad: "28290, Las Rozas de Madrid",
  email: "administracion@stratosdc.es", tel: "+34 649 925 463",
  iban: "ES44 0182 6135 8502 0166 9830",
};

const LS_AUTONOMOS = "personas_autonomos";
const LS_CLIENTES = "personas_clientes";

function parseTSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split("\t").map(h => h.trim());
  return lines.slice(1).map((line, i) => {
    const values = line.split("\t").map(v => v.trim());
    const obj = { id: i + 1 };
    headers.forEach((h, j) => { obj[h] = values[j] || ""; });
    return obj;
  });
}

function loadLocal(key) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch { return null; }
}

function saveLocal(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

const PersonasCtx = createContext(null);

export function PersonasProvider({ children }) {
  const [autonomos, setAutonomos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resA, resC] = await Promise.all([
          fetch(AUTONOMOS_URL),
          fetch(CLIENTES_URL),
        ]);
        const [textA, textC] = await Promise.all([resA.text(), resC.text()]);
        const sheetAutonomos = parseTSV(textA);
        const sheetClientes = parseTSV(textC);
        const localA = loadLocal(LS_AUTONOMOS);
        const localC = loadLocal(LS_CLIENTES);
        setAutonomos(localA || sheetAutonomos);
        setClientes(localC || sheetClientes);
        if (!localA) saveLocal(LS_AUTONOMOS, sheetAutonomos);
        if (!localC) saveLocal(LS_CLIENTES, sheetClientes);
      } catch (e) {
        const localA = loadLocal(LS_AUTONOMOS);
        const localC = loadLocal(LS_CLIENTES);
        if (localA && localC) {
          setAutonomos(localA);
          setClientes(localC);
        } else {
          setError("No se pudieron cargar los datos del sheet.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const nextId = (list) => list.length === 0 ? 1 : Math.max(...list.map(x => x.id)) + 1;

  const addAutonomo = useCallback((data) => {
    setAutonomos(prev => {
      const updated = [...prev, { ...data, id: nextId(prev) }];
      saveLocal(LS_AUTONOMOS, updated);
      return updated;
    });
  }, []);

  const updateAutonomo = useCallback((id, data) => {
    setAutonomos(prev => {
      const updated = prev.map(a => a.id === id ? { ...data, id } : a);
      saveLocal(LS_AUTONOMOS, updated);
      return updated;
    });
  }, []);

  const removeAutonomo = useCallback((id) => {
    setAutonomos(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveLocal(LS_AUTONOMOS, updated);
      return updated;
    });
  }, []);

  const addCliente = useCallback((data) => {
    setClientes(prev => {
      const updated = [...prev, { ...data, id: nextId(prev) }];
      saveLocal(LS_CLIENTES, updated);
      return updated;
    });
  }, []);

  const updateCliente = useCallback((id, data) => {
    setClientes(prev => {
      const updated = prev.map(c => c.id === id ? { ...data, id } : c);
      saveLocal(LS_CLIENTES, updated);
      return updated;
    });
  }, []);

  const removeCliente = useCallback((id) => {
    setClientes(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveLocal(LS_CLIENTES, updated);
      return updated;
    });
  }, []);

  return (
    <PersonasCtx.Provider value={{
      autonomos, clientes, loading, error,
      receptor: RECEPTOR_DEFAULT,
      addAutonomo, updateAutonomo, removeAutonomo,
      addCliente, updateCliente, removeCliente,
    }}>
      {children}
    </PersonasCtx.Provider>
  );
}

export const usePersonas = () => useContext(PersonasCtx);