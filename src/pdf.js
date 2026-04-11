import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function fmtDate(d) {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  return `${parseInt(dd)} de ${MESES[parseInt(m) - 1]} de ${y}`;
}

function fmtMoney(n) {
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';
}

const NAVY   = [15, 43, 91];
const BLUE   = [91, 180, 245];
const WHITE  = [255, 255, 255];
const LIGHT  = [245, 247, 255];
const GRAY1  = [26, 26, 46];
const GRAY2  = [90, 96, 128];
const GRAY3  = [155, 160, 184];
const BORD   = [228, 232, 242];
const RED    = [201, 64, 64];

function drawHeader(doc, { numero, fecha, left, right }) {
  const W = 210;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 52, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text('FACTURA', 16, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...BLUE);
  doc.text('N\u00DAMERO', 194, 11, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text(numero, 194, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 230);
  doc.text(fmtDate(fecha), 194, 23, { align: 'right' });

  const col = (x, label, lines) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...BLUE);
    doc.text(label.toUpperCase(), x, 31);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(lines[0], x, 37);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 200, 230);
    lines.slice(1).forEach((l, i) => doc.text(l, x, 42 + i * 4.5));
  };

  col(16, 'Emisor', left);
  col(110, 'Receptor', right);
}

function drawPayment(doc, y, iban) {
  doc.setFillColor(...LIGHT);
  doc.roundedRect(16, y, 178, 18, 3, 3, 'F');
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  doc.line(16, y, 16, y + 18);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY3);
  doc.text('DATOS DE PAGO \u00B7 TRANSFERENCIA BANCARIA', 22, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(iban, 22, y + 13);
}

function drawFooter(doc, left, num, fecha) {
  const y = 282;
  doc.setDrawColor(...BORD);
  doc.setLineWidth(0.3);
  doc.line(16, y, 194, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY3);
  doc.text(left, 16, y + 5);
  doc.text(`Factura N\u00BA ${num} \u00B7 ${fmtDate(fecha)}`, 194, y + 5, { align: 'right' });
}

function drawTotals(doc, rows, grand) {
  const W = 194, bx = 122;
  let y = doc.lastAutoTable.finalY + 6;

  rows.forEach(({ label, amount, color }) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...(color || GRAY2));
    doc.text(label, bx, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(amount, W, y, { align: 'right' });
    doc.setDrawColor(...BORD);
    doc.setLineWidth(0.2);
    doc.line(bx, y + 2, W, y + 2);
    y += 8;
  });

  doc.setFillColor(...NAVY);
  doc.roundedRect(bx, y, W - bx, 12, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text('Total', bx + 4, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BLUE);
  doc.text(grand, W - 4, y + 8, { align: 'right' });

  return y + 18;
}

export function generateAutonomoPDF(data) {
  const { numero, fecha, emisorNombre, emisorDni, emisorDireccion, emisorCiudad,
    emisorEmail, emisorTel, receptorNombre, receptorNif, receptorDireccion,
    receptorCiudad, receptorEmail, receptorTel, iban, lineas = [], ivaPct = 21, irpfPct = 15 } = data;

  const base = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precio), 0);
  const ivaAmt = base * ivaPct / 100;
  const irpfAmt = base * irpfPct / 100;
  const total = base + ivaAmt - irpfAmt;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  drawHeader(doc, {
    numero, fecha,
    left: [emisorNombre, `DNI: ${emisorDni}`, emisorDireccion, emisorCiudad, emisorEmail, emisorTel],
    right: [receptorNombre, `NIF: ${receptorNif}`, receptorDireccion, receptorCiudad, receptorEmail, receptorTel],
  });

  doc.autoTable({
    startY: 58,
    margin: { left: 16, right: 16 },
    head: [['Descripci\u00F3n', 'Cantidad', 'Precio', 'Total']],
    body: lineas.map(l => {
      const sub = Number(l.cantidad) * Number(l.precio);
      return [l.descripcion, Number(l.cantidad).toLocaleString('es-ES'), fmtMoney(l.precio), fmtMoney(sub)];
    }),
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 22 }, 2: { halign: 'right', cellWidth: 30 }, 3: { halign: 'right', cellWidth: 32 } },
    headStyles: { fillColor: false, textColor: GRAY3, fontStyle: 'normal', fontSize: 7, lineColor: BORD, lineWidth: { bottom: 0.3 } },
    bodyStyles: { fontSize: 9, textColor: GRAY1, lineColor: BORD, lineWidth: { bottom: 0.2 } },
    alternateRowStyles: { fillColor: [250, 251, 254] },
    tableLineWidth: 0,
  });

  const payY = drawTotals(doc, [
    { label: 'Base Imponible', amount: fmtMoney(base) },
    { label: `IVA (${ivaPct}%)`, amount: fmtMoney(ivaAmt) },
    { label: `IRPF (\u2212${irpfPct}%)`, amount: `\u2212${fmtMoney(irpfAmt)}`, color: RED },
  ], fmtMoney(total));

  drawPayment(doc, payY, iban);
  drawFooter(doc, `${emisorNombre} \u00B7 DNI ${emisorDni}`, numero, fecha);

  doc.save(`Factura_${numero}.pdf`);
}

export function generateSociedadPDF(data) {
  const { numero, fecha, emisorNombre, emisorNif, emisorDireccion, emisorCiudad,
    receptorNombre, receptorNif, receptorDireccion, receptorCiudad,
    iban, lineas = [], ivaPct = 21 } = data;

  const base = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.tarifa), 0);
  const ivaTotal = base * ivaPct / 100;
  const total = base + ivaTotal;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  drawHeader(doc, {
    numero, fecha,
    left: [emisorNombre, `NIF: ${emisorNif}`, emisorDireccion, emisorCiudad],
    right: [receptorNombre, `NIF: ${receptorNif}`, receptorDireccion, receptorCiudad],
  });

  doc.autoTable({
    startY: 58,
    margin: { left: 16, right: 16 },
    head: [['Descripci\u00F3n', 'Cantidad', 'Tarifa', 'IVA', 'Total']],
    body: lineas.map(l => {
      const sub = Number(l.cantidad) * Number(l.tarifa);
      const ivaLine = sub * ivaPct / 100;
      return [l.descripcion, Number(l.cantidad).toLocaleString('es-ES'), fmtMoney(l.tarifa), fmtMoney(ivaLine), fmtMoney(sub + ivaLine)];
    }),
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 22 }, 2: { halign: 'right', cellWidth: 28 }, 3: { halign: 'right', textColor: GRAY3, cellWidth: 28 }, 4: { halign: 'right', cellWidth: 32 } },
    headStyles: { fillColor: false, textColor: GRAY3, fontStyle: 'normal', fontSize: 7, lineColor: BORD, lineWidth: { bottom: 0.3 } },
    bodyStyles: { fontSize: 9, textColor: GRAY1, lineColor: BORD, lineWidth: { bottom: 0.2 } },
    alternateRowStyles: { fillColor: [250, 251, 254] },
    tableLineWidth: 0,
  });

  const payY = drawTotals(doc, [
    { label: 'Base Imponible', amount: fmtMoney(base) },
    { label: `IVA (${ivaPct}%)`, amount: fmtMoney(ivaTotal) },
  ], fmtMoney(total));

  drawPayment(doc, payY, iban);
  drawFooter(doc, `${emisorNombre} \u00B7 NIF ${emisorNif}`, numero, fecha);

  doc.save(`Factura_${numero}.pdf`);
}
