import { createContext, useContext, useState, useEffect } from "react";

const AUTONOMOS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWeDOnX_4tkvEI6zin85Kv7b-xW2ZRh6ef1ld-3qVdC_guOrVs_JBPSm7uf4Y-Jb15WPPmPWoSK2Ff/pub?gid=0&single=true&output=tsv";
const CLIENTES_URL  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWeDOnX_4tkvEI6zin85Kv7b-xW2ZRh6ef1ld-3qVdC_guOrVs_JBPSm7uf4Y-Jb15WPPmPWoSK2Ff/pub?gid=1848159679&single=true&output=tsv";

const RECEPTOR_DEFAULT = {
  nombre: "Stratos Dynamis Consulting S.L.", nif: "B21951033",
  direccion: "Avenida de Mallorca 4, Bajo C.", ciudad: "28290, Las Rozas de Madrid",
  email: "administracion@stratosdc.es", tel: "+34 649 925 463",
  iban: "ES44 0182 6135 8502 0166 9830",
};

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
        setAutonomos(parseTSV(textA));
        setClientes(parseTSV(textC));
      } catch (e) {
        setError("No se pudieron cargar los datos del sheet.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <PersonasCtx.Provider value={{
      autonomos, clientes, loading, error,
      receptor: RECEPTOR_DEFAULT,
    }}>
      {children}
    </PersonasCtx.Provider>
  );
}

export const usePersonas = () => useContext(PersonasCtx);