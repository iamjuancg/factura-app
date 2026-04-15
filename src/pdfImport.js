import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function parseSpanishDate(str) {
  if (!str) return "";
  const m = str.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
  if (!m) return "";
  const day = m[1].padStart(2, "0");
  const monthIdx = MESES.indexOf(m[2].toLowerCase());
  if (monthIdx === -1) return "";
  const month = String(monthIdx + 1).padStart(2, "0");
  return `${m[3]}-${month}-${day}`;
}

function parseESMoney(str) {
  if (!str) return 0;
  const clean = str.replace(/[^\d,.\-]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

function safe(str) {
  if (!str) return "";
  return str
    .replace(/\u00e1/g, "a").replace(/\u00e9/g, "e").replace(/\u00ed/g, "i")
    .replace(/\u00f3/g, "o").replace(/\u00fa/g, "u")
    .replace(/\u00c1/g, "A").replace(/\u00c9/g, "E").replace(/\u00cd/g, "I")
    .replace(/\u00d3/g, "O").replace(/\u00da/g, "U");
}

// --- Metadata-based import (for PDFs generated with embedded JSON) ---

function tryMetadataImport(info) {
  const kw = info && info.Keywords;
  if (!kw) return null;
  const m = kw.match(/%%FACTURA%%(.+?)%%END%%/);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1]);
    return { type: data._facturaType, data };
  } catch {
    return null;
  }
}

// --- Text-based fallback import (for old PDFs without metadata) ---

function extractTextItems(textContent) {
  // Sort by Y (descending because PDF coords) then X (ascending)
  return textContent.items
    .filter(item => item.str.trim())
    .sort((a, b) => {
      const dy = b.transform[5] - a.transform[5];
      if (Math.abs(dy) > 3) return dy;
      return a.transform[4] - b.transform[4];
    });
}

function groupByRows(items, threshold = 3) {
  const rows = [];
  let currentRow = [];
  let lastY = null;
  for (const item of items) {
    const y = item.transform[5];
    if (lastY !== null && Math.abs(y - lastY) > threshold) {
      if (currentRow.length) rows.push(currentRow);
      currentRow = [];
    }
    currentRow.push(item);
    lastY = y;
  }
  if (currentRow.length) rows.push(currentRow);
  return rows;
}

function rowText(row) {
  return row.map(i => i.str.trim()).join(" ");
}

function detectType(allText) {
  if (allText.includes("IRPF")) return "autonomo";
  if (allText.includes("DNI:")) return "autonomo";
  return "sociedad";
}

function parseTextFallback(textContent) {
  const items = extractTextItems(textContent);
  const rows = groupByRows(items);
  const allText = rows.map(rowText).join("\n");
  const type = detectType(allText);

  const result = { _facturaType: type };

  // Parse numero
  const numMatch = allText.match(/FACTURA\s+N[^\n]*?\n\s*(.+)/m);
  if (numMatch) {
    // The number is usually on the line after "FACTURA Nº:"
    const numLine = numMatch[1].trim();
    result.numero = numLine.split(/\s/)[0];
  }

  // Parse fecha
  const fechaMatch = allText.match(/Fecha:\s*(.+)/);
  if (fechaMatch) {
    result.fecha = parseSpanishDate(fechaMatch[1]);
  }

  // Parse parties
  const emisorIdx = rows.findIndex(r => rowText(r).includes("Emisor:"));
  const receptorIdx = rows.findIndex(r => rowText(r).includes("Receptor:"));

  if (emisorIdx >= 0 && receptorIdx >= 0) {
    // Names are on the row after labels
    const nameRowIdx = emisorIdx + 1;
    if (nameRowIdx < rows.length) {
      const nameRow = rows[nameRowIdx];
      // Names are split by X position: left = emisor, right = receptor
      const midX = 300; // approximate midpoint in PDF coords
      const leftItems = nameRow.filter(i => i.transform[4] < midX);
      const rightItems = nameRow.filter(i => i.transform[4] >= midX);
      result.emisorNombre = leftItems.map(i => i.str.trim()).join(" ");
      result.receptorNombre = rightItems.map(i => i.str.trim()).join(" ");
    }

    // Parse details from rows after names
    for (let i = nameRowIdx + 1; i < rows.length; i++) {
      const text = rowText(rows[i]);
      if (text.includes("Descripcion") || text.includes("Base Imponible")) break;

      const dniMatch = text.match(/DNI:\s*(\S+)/);
      if (dniMatch) result.emisorDni = dniMatch[1];
      const nifMatches = text.match(/NIF:\s*(\S+)/g);
      if (nifMatches) {
        if (type === "autonomo") {
          // First NIF in receptor area
          const nifVal = nifMatches[0].replace("NIF: ", "").replace("NIF:", "");
          if (!result.emisorDni) result.receptorNif = nifVal;
          else result.receptorNif = nifVal;
        } else {
          // Both are NIF
          nifMatches.forEach((m, idx) => {
            const val = m.replace("NIF: ", "").replace("NIF:", "").trim();
            if (idx === 0) result.emisorNif = val;
            else result.receptorNif = val;
          });
        }
      }
    }
  }

  // Parse table rows - find between "Descripcion" header and "Base Imponible"
  const tableStartIdx = rows.findIndex(r => rowText(r).includes("Descripcion"));
  const tableEndIdx = rows.findIndex((r, i) => i > tableStartIdx && rowText(r).includes("Base Imponible"));

  if (tableStartIdx >= 0 && tableEndIdx >= 0) {
    const lineas = [];
    for (let i = tableStartIdx + 1; i < tableEndIdx; i++) {
      const row = rows[i];
      const text = rowText(row);
      // Skip separator/empty rows and the totals title rows
      if (!text || text.includes("Total") || text.includes("Importe Final")) continue;

      // Items sorted by X position
      const sorted = [...row].sort((a, b) => a.transform[4] - b.transform[4]);
      if (sorted.length < 3) continue;

      // Last items are numbers, first is description
      const desc = sorted[0].str.trim();
      const numItems = sorted.slice(1).map(i => i.str.trim());

      if (type === "autonomo") {
        const cantidad = parseESMoney(numItems[0] || "0");
        const precio = parseESMoney(numItems[1] || "0");
        lineas.push({ descripcion: desc, cantidad, precio });
      } else {
        const cantidad = parseESMoney(numItems[0] || "0");
        const tarifa = parseESMoney(numItems[1] || "0");
        lineas.push({ descripcion: desc, cantidad, tarifa });
      }
    }
    result.lineas = lineas;
  }

  // Parse IVA/IRPF percentages
  const ivaMatch = allText.match(/IVA\s*\(?(\d+)%?\)?/);
  if (ivaMatch) result.ivaPct = Number(ivaMatch[1]);

  if (type === "autonomo") {
    const irpfMatch = allText.match(/IRPF\s*\(-?(\d+)%?\)?/);
    if (irpfMatch) result.irpfPct = Number(irpfMatch[1]);
  }

  // Parse IBAN from footer
  const ibanMatch = allText.match(/cuenta:\s*(ES[\d\s]+)/i);
  if (ibanMatch) result.iban = ibanMatch[1].trim();

  return { type, data: result };
}

// --- Main export ---

export async function importFromPDF(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const meta = await pdf.getMetadata();

  // Try metadata first (reliable for PDFs generated by this app)
  const metaResult = tryMetadataImport(meta.info);
  if (metaResult) return metaResult;

  // Fallback: text extraction
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  return parseTextFallback(textContent);
}

export { safe, parseSpanishDate, parseESMoney };
