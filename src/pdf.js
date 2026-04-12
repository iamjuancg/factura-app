import jsPDF from "jspdf";
import "jspdf-autotable";

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function fmtDate(d) {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${parseInt(dd)} de ${MESES[parseInt(m) - 1]} de ${y}`;
}

function fmtMoney(n) {
  return Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}

const NAVY  = [15, 43, 91];
const BLUE  = [30, 100, 200];
const GRAY1 = [40, 40, 40];
const GRAY2 = [120, 120, 130];
const GRAY3 = [170, 170, 178];
const BORD  = [220, 224, 235];

async function loadLogo() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = process.env.PUBLIC_URL + "/logo-negro.png";
  });
}

function drawHeader(doc, { numero, fecha, logoData }) {
  if (logoData) {
    doc.addImage(logoData, "PNG", 14, 10, 22, 18);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text("FACTURA N\u00BA: " + numero, 196, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY2);
  doc.text("Fecha: " + fmtDate(fecha), 196, 20, { align: "right" });
  doc.setDrawColor(...BORD);
  doc.setLineWidth(0.3);
  doc.line(14, 32, 196, 32);
}

function drawParties(doc, { left, right, leftTitle, rightTitle }) {
  let y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY1);
  doc.text(leftTitle + ":", 14, y);
  doc.text(rightTitle + ":", 108, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...BLUE);
  doc.text(left[0], 14, y);
  doc.text(right[0], 108, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY1);
  left.slice(1).forEach((line, i) => { if (line) doc.text(line, 14, y + i * 4.5); });
  right.slice(1).forEach((line, i) => { if (line) doc.text(line, 108, y + i * 4.5); });
  const maxLines = Math.max(left.filter(Boolean).length, right.filter(Boolean).length);
  return y + (maxLines - 1) * 4.5 + 12;
}

function drawTotals(doc, rows, grand) {
  const tableBottom = doc.lastAutoTable.finalY;
  const W = 196;
  const boxW = 80;
  const boxX = W - boxW;

  let y = tableBottom + 14;

  // Titulo "Total" centrado sobre el bloque
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GRAY2);
  doc.text("Total", boxX + boxW / 2, y, { align: "center" });
  y += 4;

  doc.setDrawColor(...BORD);
  doc.setLineWidth(0.3);
  doc.line(boxX, y, W, y);
  y += 6;

  rows.forEach(({ label, pct, amount, bold }) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY2);
    doc.text(label, boxX + 2, y);
    if (pct) {
      doc.text(pct, boxX + 28, y);
    }
    doc.setTextColor(bold ? GRAY1 : GRAY2);
    doc.text(amount, W - 2, y, { align: "right" });
    doc.setDrawColor(...BORD);
    doc.setLineWidth(0.2);
    doc.line(boxX, y + 3, W, y + 3);
    y += 9;
  });

  // Fila total en negrita
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY1);
  doc.text("Total", boxX + 2, y);
  doc.text(grand, W - 2, y, { align: "right" });
  doc.setDrawColor(...BORD);
  doc.setLineWidth(0.4);
  doc.line(boxX, y + 3, W, y + 3);

  return y + 14;
}

function drawIban(doc, iban) {
  const y = 248;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(15);
  doc.setTextColor(...GRAY2);
  doc.text("N\u00BA de cuenta: " + iban, 105, y, { align: "center" });

  const payText = "El pago se realizara en un plazo de 15 dias naturales desde la emision de esta factura, se realizara mediante transferencia bancaria.";
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY3);
  const lines = doc.splitTextToSize(payText, 72);
  lines.forEach((line, i) => {
    doc.text(line, 196, y + 10 + i * 4, { align: "right" });
  });
}

export async function generateAutonomoPDF(data) {
  const { numero, fecha, emisorNombre, emisorDni, emisorDireccion, emisorCiudad,
    emisorEmail, emisorTel, receptorNombre, receptorNif, receptorDireccion,
    receptorCiudad, receptorEmail, receptorTel, iban, lineas = [], ivaPct = 21, irpfPct = 15 } = data;

  const base = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio), 0);
  const ivaAmt = base * ivaPct / 100;
  const irpfAmt = base * irpfPct / 100;
  const total = base + ivaAmt - irpfAmt;

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Sin logo en facturas de autonomo
  drawHeader(doc, { numero, fecha, logoData: null });

  const tableY = drawParties(doc, {
    leftTitle: "Emisor",
    rightTitle: "Receptor",
    left: [emisorNombre, `DNI: ${emisorDni}`, emisorDireccion, emisorCiudad, emisorEmail, emisorTel],
    right: [receptorNombre, `NIF: ${receptorNif}`, receptorDireccion, receptorCiudad, receptorEmail, receptorTel],
  });

  doc.autoTable({
    startY: tableY,
    margin: { left: 14, right: 14 },
    head: [["Descripci\u00F3n", "Cantidad", "Precio", "Total"]],
    body: lineas.map(l => {
      const sub = Number(l.cantidad) * Number(l.precio);
      return [l.descripcion, Number(l.cantidad).toLocaleString("es-ES"), fmtMoney(l.precio), fmtMoney(sub)];
    }),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 24 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 34 },
    },
    headStyles: { fillColor: false, textColor: GRAY1, fontStyle: "bold", fontSize: 8.5, lineColor: BORD, lineWidth: { bottom: 0.3 } },
    bodyStyles: { fontSize: 9, textColor: GRAY2, lineColor: BORD, lineWidth: { bottom: 0.2 }, cellPadding: { top: 4, bottom: 4, left: 2, right: 2 } },
    alternateRowStyles: { fillColor: false },
    tableLineWidth: 0,
  });

  drawTotals(doc, [
    { label: "Base Imponible", amount: fmtMoney(base) },
    { label: "IVA", pct: `(${ivaPct}%)`, amount: fmtMoney(ivaAmt) },
    { label: "IRPF", pct: `(-${irpfPct}%)`, amount: "-" + fmtMoney(irpfAmt) },
  ], fmtMoney(total));

  drawIban(doc, iban);
  doc.save(`Factura_${numero}.pdf`);
}

export async function generateSociedadPDF(data) {
  const { numero, fecha, emisorNombre, emisorNif, emisorDireccion, emisorCiudad,
    receptorNombre, receptorNif, receptorDireccion, receptorCiudad,
    iban, lineas = [], ivaPct = 21 } = data;

  const base = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.tarifa), 0);
  const ivaTotal = base * ivaPct / 100;
  const total = base + ivaTotal;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logoData = await loadLogo();

  drawHeader(doc, { numero, fecha, logoData });

  const tableY = drawParties(doc, {
    leftTitle: "Emisor",
    rightTitle: "Receptor",
    left: [emisorNombre, `NIF: ${emisorNif}`, emisorDireccion, emisorCiudad],
    right: [receptorNombre, `NIF: ${receptorNif}`, receptorDireccion, receptorCiudad],
  });

  doc.autoTable({
    startY: tableY,
    margin: { left: 14, right: 14 },
    head: [["Descripci\u00F3n", "Cantidad", "Tarifa", "IVA", "Total"]],
    body: lineas.map(l => {
      const sub = Number(l.cantidad) * Number(l.tarifa);
      const ivaLine = sub * ivaPct / 100;
      return [l.descripcion, Number(l.cantidad).toLocaleString("es-ES"), fmtMoney(l.tarifa), fmtMoney(ivaLine), fmtMoney(sub + ivaLine)];
    }),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 22 },
      2: { halign: "right", cellWidth: 26 },
      3: { halign: "right", textColor: GRAY3, cellWidth: 28 },
      4: { halign: "right", cellWidth: 32 },
    },
    headStyles: { fillColor: false, textColor: GRAY1, fontStyle: "bold", fontSize: 8.5, lineColor: BORD, lineWidth: { bottom: 0.3 } },
    bodyStyles: { fontSize: 9, textColor: GRAY2, lineColor: BORD, lineWidth: { bottom: 0.2 }, cellPadding: { top: 4, bottom: 4, left: 2, right: 2 } },
    alternateRowStyles: { fillColor: false },
    tableLineWidth: 0,
  });

  drawTotals(doc, [
    { label: "Base Imponible", amount: fmtMoney(base) },
    { label: "IVA", pct: `${ivaPct}%`, amount: fmtMoney(ivaTotal) },
  ], fmtMoney(total));

  drawIban(doc, iban);
  doc.save(`Factura_${numero}.pdf`);
}