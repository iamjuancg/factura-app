import { createContext, useContext, useState } from "react";

const AUTONOMOS_DEFAULT = [
  {
    id: 1, nombre: "Juan Cotrina Gutierrez", dni: "76074376J",
    direccion: "Juan de Austria, 31, 4B", ciudad: "28010, Madrid",
    email: "jucotrina@gmail.com", tel: "+34 630 156 786",
    iban: "ES87 0182 9465 6002 0597 6548",
  },
  {
    id: 2, nombre: "Denis Gonzalez Blazquez", dni: "47376677N",
    direccion: "Mira el Rio Baja 16, 3A", ciudad: "28005, Madrid",
    email: "dennisgb@icloud.com", tel: "+34 687 388 122",
    iban: "ES41 0073 0100 5106 1656 8049",
  },
  {
    id: 3, nombre: "Ramon Ruiz Herrero", dni: "05940273V",
    direccion: "Avenida de Mallorca 4, Bajo C.", ciudad: "28290, Las Rozas de Madrid",
    email: "ruizherrero1@gmail.com", tel: "+34 649 925 463",
    iban: "ES30 0182 2011 4102 0159 0348",
  },
];

const CLIENTES_DEFAULT = [
  {
    id: 1, nombre: "Kynaxis Technology Solutions S.L.", nif: "B09633710",
    direccion: "Paseo de la Castellana, N90, planta 1.", ciudad: "28046, Madrid",
    email: "", tel: "",
  },
];

const RECEPTOR_DEFAULT = {
  nombre: "Stratos Dynamis Consulting S.L.", nif: "B21951033",
  direccion: "Avenida de Mallorca 4, Bajo C.", ciudad: "28290, Las Rozas de Madrid",
  email: "administracion@stratosdc.es", tel: "+34 649 925 463",
  iban: "ES44 0182 6135 8502 0166 9830",
};

const PersonasCtx = createContext(null);

export function PersonasProvider({ children }) {
  const [autonomos, setAutonomos] = useState(AUTONOMOS_DEFAULT);
  const [clientes, setClientes] = useState(CLIENTES_DEFAULT);

  const addAutonomo = (a) => setAutonomos(prev => [...prev, { ...a, id: Date.now() }]);
  const updateAutonomo = (id, a) => setAutonomos(prev => prev.map(x => x.id === id ? { ...x, ...a } : x));
  const removeAutonomo = (id) => setAutonomos(prev => prev.filter(x => x.id !== id));

  const addCliente = (c) => setClientes(prev => [...prev, { ...c, id: Date.now() }]);
  const updateCliente = (id, c) => setClientes(prev => prev.map(x => x.id === id ? { ...x, ...c } : x));
  const removeCliente = (id) => setClientes(prev => prev.filter(x => x.id !== id));

  return (
    <PersonasCtx.Provider value={{
      autonomos, addAutonomo, updateAutonomo, removeAutonomo,
      clientes, addCliente, updateCliente, removeCliente,
      receptor: RECEPTOR_DEFAULT,
    }}>
      {children}
    </PersonasCtx.Provider>
  );
}

export const usePersonas = () => useContext(PersonasCtx);