import { useRef, useState } from "react";

const btnStyle = {
  padding: "9px 16px",
  background: "none",
  border: "1.5px dashed var(--blue-accent)",
  borderRadius: "var(--radius)",
  color: "var(--navy)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

export default function ImportPDFButton({ onImport, expectedType }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const { importFromPDF } = await import("../pdfImport");
      const result = await importFromPDF(file);
      if (expectedType && result.type !== expectedType) {
        const ok = window.confirm(
          `Este PDF parece ser de tipo "${result.type}" pero estas en el formulario "${expectedType}". ¿Importar de todas formas?`
        );
        if (!ok) { setLoading(false); return; }
      }
      onImport(result);
    } catch (err) {
      console.error("Error importando PDF:", err);
      setError("No se pudo leer el PDF. Verifica que sea una factura valida.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button
        style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v9M4 4l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 9v3h10V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {loading ? "Leyendo PDF..." : "Importar PDF"}
      </button>
      {error && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
