import jsPDF from "jspdf";
import "jspdf-autotable";

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function fmtDate(d) {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${parseInt(dd)} de ${MESES[parseInt(m) - 1]} de ${y}`;
}

function fmtMoney(n) {
  return Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "\u20AC";
}

function fmtTarifa(n) {
  const num = Number(n);
  if (Number.isInteger(num)) return num + "\u20AC";
  return num.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "\u20AC";
}

function safe(str) {
  if (!str) return "";
  return str
    .replace(/\u00e1/g, "a").replace(/\u00e9/g, "e").replace(/\u00ed/g, "i")
    .replace(/\u00f3/g, "o").replace(/\u00fa/g, "u")
    .replace(/\u00c1/g, "A").replace(/\u00c9/g, "E").replace(/\u00cd/g, "I")
    .replace(/\u00d3/g, "O").replace(/\u00da/g, "U");
}

const NAVY  = [15, 43, 91];
const BLUE  = [30, 100, 200];
const GRAY1 = [50, 50, 50];
const GRAY2 = [130, 130, 140];
const GRAY3 = [180, 180, 188];
const BORD  = [210, 215, 228];
const BLACK = [0, 0, 0];

function sc(doc, c) { doc.setTextColor(c[0], c[1], c[2]); }
function sd(doc, c) { doc.setDrawColor(c[0], c[1], c[2]); }

async function loadLogo() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ratio = img.width / img.height;
      const h = 32;
      const w = h * ratio;
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve({ data: canvas.toDataURL("image/png"), w, h });
    };
    img.onerror = () => resolve(null);
    img.src = process.env.PUBLIC_URL + "/logo-negro.png";
  });
}

function drawHeader(doc, { numero, fecha, logo }) {
  if (logo) {
    doc.addImage(logo.data, "PNG", 16, 10, logo.w, logo.h);
  }

  // FACTURA No: en negrita arriba derecha
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  sc(doc, BLACK);
  doc.text("FACTURA N\u00BA:", 194, 16, { align: "right" });

  // Numero de factura
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  sc(doc, BLACK);
  doc.text(numero, 194, 22, { align: "right" });

  // Fecha
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  sc(doc, GRAY2);
  doc.text("Fecha: " + fmtDate(fecha), 194, 28, { align: "right" });
}

function drawParties(doc, { left, right, logoH }) {
  const startY = logoH ? Math.max(logoH + 18, 50) : 46;

  // Emisor label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  sc(doc, GRAY1);
  doc.text("Emisor:", 16, startY);
  doc.text("Receptor:", 108, startY);

  // Nombre en azul negrita
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  sc(doc, BLUE);
  doc.text(left[0], 16, startY + 6);
  doc.text(right[0], 108, startY + 6);

  // Resto de datos
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  sc(doc, GRAY1);
  let maxLines = 0;
  left.slice(1).forEach((line, i) => {
    if (line) { doc.text(safe(line), 16, startY + 12 + i * 5); maxLines = Math.max(maxLines, i + 1); }
  });
  right.slice(1).forEach((line, i) => {
    if (line) { doc.text(safe(line), 108, startY + 12 + i * 5); maxLines = Math.max(maxLines, i + 1); }
  });

  return startY + 12 + maxLines * 5 + 10;
}

function drawTotalsBlock(doc, rows, grand, blockTitle) {
  const W = 194;
  const boxW = 82;
  const boxX = W - boxW;
  let y = doc.lastAutoTable.finalY + 12;

  // Titulo con lineas a ambos lados (estilo plantilla)
  sd(doc, BORD);
  doc.setLineWidth(0.3);
  const titleWidth = doc.getTextWidth(blockTitle) + 6;
  const lineY = y + 3;
  doc.line(boxX, lineY, boxX + (boxW - titleWidth) / 2, lineY);
  doc.line(boxX + (boxW + titleWidth) / 2, lineY, W, lineY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  sc(doc, GRAY2);
  doc.text(blockTitle, boxX + boxW / 2, y + 4, { align: "center" });
  y += 10;

  // Linea superior
  sd(doc, BORD);
  doc.setLineWidth(0.3);
  doc.line(boxX, y, W, y);
  y += 6;

  rows.forEach(({ label, pct, amount, bold }) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    sc(doc, bold ? GRAY1 : GRAY2);
    doc.text(label, boxX + 2, y);
    if (pct) {
      doc.setFont("helvetica", "normal");
      sc(doc, GRAY2);
      doc.text(pct, boxX + 32, y);
    }
    sc(doc, bold ? BLACK : GRAY2);
    doc.text(amount, W - 2, y, { align: "right" });
    sd(doc, BORD);
    doc.setLineWidth(0.2);
    doc.line(boxX, y + 3, W, y + 3);
    y += 9;
  });

  // Fila Total en negrita
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  sc(doc, BLACK);
  doc.text("Total", boxX + 2, y);
  sc(doc, BLACK);
  doc.text(grand, W - 2, y, { align: "right" });
  sd(doc, BORD);
  doc.setLineWidth(0.4);
  doc.line(boxX, y + 3, W, y + 3);

  return y + 14;
}

function drawFooter(doc, iban, payText) {
  const y = 248;

  // IBAN grande centrado
  doc.setFont("helvetica", "normal");
  doc.setFontSize(17);
  sc(doc, GRAY1);
  doc.text("N\u00BA de cuenta: " + iban, 105, y, { align: "center" });

  // Texto de pago a la derecha
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  sc(doc, GRAY3);
  const lines = doc.splitTextToSize(safe(payText), 80);
  lines.forEach((line, i) => {
    doc.text(line, 194, y + 10 + i * 4.5, { align: "right" });
  });
}

const PAY_TEXT = "El pago se realizara en un plazo de 15 dias naturales desde la emision de esta factura, se realizara mediante transferencia bancaria.";

const HEAD_STYLES = {
  fillColor: false, textColor: [50,50,50], fontStyle: "bold",
  fontSize: 9, lineColor: [210,215,228], lineWidth: { top: 0.4, bottom: 0.4 },
};
const BODY_STYLES = {
  fontSize: 9, textColor: [130,130,140],
  lineColor: [210,215,228], lineWidth: { bottom: 0.2 },
  cellPadding: { top: 5, bottom: 5, left: 2, right: 2 },
};

export async function generateAutonomoPDF(data) {
  const { numero, fecha,
    emisorNombre, emisorDni, emisorDireccion, emisorCiudad, emisorEmail, emisorTel,
    receptorNombre, receptorNif, receptorDireccion, receptorCiudad, receptorEmail, receptorTel,
    iban, lineas = [], ivaPct = 21, irpfPct = 15 } = data;

  const base    = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio), 0);
  const ivaAmt  = base * ivaPct / 100;
  const irpfAmt = base * irpfPct / 100;
  const total   = base + ivaAmt - irpfAmt;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  drawHeader(doc, { numero, fecha, logo: null });

  const tableY = drawParties(doc, {
    logoH: null,
    left:  [emisorNombre, `DNI: ${emisorDni}`, emisorDireccion, emisorCiudad, emisorEmail, emisorTel],
    right: [receptorNombre, `NIF: ${receptorNif}`, receptorDireccion, receptorCiudad, receptorEmail, receptorTel],
  });

  doc.autoTable({
    startY: tableY,
    margin: { left: 16, right: 16 },
    head: [["Descripcion", "Cantidad", "Precio", "Importe"]],
    body: lineas.map(l => {
      const sub = Number(l.cantidad) * Number(l.precio);
      return [safe(l.descripcion), Number(l.cantidad).toLocaleString("es-ES"), fmtMoney(l.precio), fmtMoney(sub)];
    }),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 24 },
      2: { halign: "right", cellWidth: 30 },
      3: { halign: "right", cellWidth: 32 },
    },
    headStyles: HEAD_STYLES,
    bodyStyles: BODY_STYLES,
    alternateRowStyles: { fillColor: false },
    tableLineWidth: 0,
  });

  drawTotalsBlock(doc, [
    { label: "Base Imponible", amount: fmtMoney(base) },
    { label: "IVA", pct: `(${ivaPct}%)`, amount: fmtMoney(ivaAmt) },
    { label: "IRPF", pct: `(-${irpfPct}%)`, amount: "-" + fmtMoney(irpfAmt) },
  ], fmtMoney(total), "Total");

  drawFooter(doc, iban, PAY_TEXT);
  doc.save(`Factura_${numero}.pdf`);
}

export async function generateSociedadPDF(data) {
  const { numero, fecha,
    emisorNombre, emisorNif, emisorDireccion, emisorCiudad,
    receptorNombre, receptorNif, receptorDireccion, receptorCiudad,
    iban, lineas = [], ivaPct = 21 } = data;

  const base     = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.tarifa), 0);
  const ivaTotal = base * ivaPct / 100;
  const total    = base + ivaTotal;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadLogo();
  drawHeader(doc, { numero, fecha, logo });

  const tableY = drawParties(doc, {
    logoH: logo ? logo.h : null,
    left:  [emisorNombre, `NIF: ${emisorNif}`, emisorDireccion, emisorCiudad],
    right: [receptorNombre, `NIF: ${receptorNif}`, receptorDireccion, receptorCiudad],
  });

  doc.autoTable({
    startY: tableY,
    margin: { left: 16, right: 16 },
    head: [["Descripcion", "Cantidad", "Tarifa", "IVA", "Importe"]],
    body: lineas.map(l => {
      const sub = Number(l.cantidad) * Number(l.tarifa);
      const ivaLine = sub * ivaPct / 100;
      return [safe(l.descripcion), Number(l.cantidad).toLocaleString("es-ES"), fmtTarifa(l.tarifa), fmtMoney(ivaLine), fmtMoney(sub + ivaLine)];
    }),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 22 },
      2: { halign: "right", cellWidth: 24 },
      3: { halign: "right", textColor: [170,170,178], cellWidth: 28 },
      4: { halign: "right", cellWidth: 30 },
    },
    headStyles: HEAD_STYLES,
    bodyStyles: BODY_STYLES,
    alternateRowStyles: { fillColor: false },
    tableLineWidth: 0,
  });

  drawTotalsBlock(doc, [
    { label: "Base Imponible", amount: fmtMoney(base) },
    { label: "IVA", pct: `${ivaPct}%`, amount: fmtMoney(ivaTotal) },
  ], fmtMoney(total), "Importe Final");

  drawFooter(doc, iban, PAY_TEXT);
  doc.save(`Factura_${numero}.pdf`);
}