// PDF del despiece para el taller. Sigue el formato de la lista de piezas de SketchCut que usa
// Design.gr (#, largo, ancho, cantidad, nombre y casilla para tildar), separada por material.
// Se carga solo en el navegador, al tocar "Descargar PDF".
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DESPERDICIO,
  PLACA_MM,
  cantosFicha,
  entraEnPlaca,
  textoOrigen,
  type Ficha,
} from "./despiece";

const TINTA: [number, number, number] = [30, 26, 22];
const GRIS: [number, number, number] = [110, 102, 94];
const DORADO: [number, number, number] = [184, 143, 58];
const FONDO: [number, number, number] = [237, 232, 222];

const num = (n: number) => n.toLocaleString("es-AR");

async function imagenComoDataUrl(url: string) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const b = await r.blob();
    const dataUrl = await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(b);
    });
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    return { dataUrl, w: img.naturalWidth, h: img.naturalHeight };
  } catch {
    return null;
  }
}

export async function descargarDespiecePdf(f: Ficha, imgUrl: string | null, id: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = doc.internal.pageSize.getWidth();
  const M = 14;
  let y = M;

  // ---- encabezado ----
  doc
    .setFont("helvetica", "bold")
    .setFontSize(16)
    .setTextColor(...TINTA);
  doc.text("Design.gr", M, y + 4);
  doc
    .setFont("helvetica", "normal")
    .setFontSize(10)
    .setTextColor(...GRIS);
  doc.text("Despiece para el taller", PW - M, y + 4, { align: "right" });
  y += 8;
  doc
    .setDrawColor(...TINTA)
    .setLineWidth(0.4)
    .line(M, y, PW - M, y);
  y += 6;
  doc.setFontSize(10).setTextColor(...TINTA);
  doc.setFont("helvetica", "bold").text(`Orden: ${f.mueble}`, M, y);
  doc
    .setFont("helvetica", "normal")
    .text(`Fecha: ${f.fecha ?? "-"}`, PW - M, y, { align: "right" });
  y += 5;
  doc.setTextColor(...GRIS).setFontSize(9);
  const conf = doc.splitTextToSize(`Diseño: ${f.config}`, PW - 2 * M);
  doc.text(conf, M, y);
  y += conf.length * 4;
  if (f.origen) {
    doc.setFont("helvetica", "bold").setTextColor(...(f.origen === "taller" ? GRIS : DORADO));
    doc.text(textoOrigen(f), M, y + 1);
    doc.setFont("helvetica", "normal");
    y += 5;
  }
  y += 3;

  // ---- imagen + resultados ----
  const img = imgUrl ? await imagenComoDataUrl(imgUrl) : null;
  const colW = (PW - 2 * M - 6) / 2;
  let yImg = y;
  if (img) {
    const h = Math.min(70, (colW * img.h) / img.w);
    const w = (h * img.w) / img.h;
    doc.addImage(img.dataUrl, "JPEG", M, y, w, h);
    yImg = y + h;
  }
  const total = f.piezas.reduce((s, p) => s + p.cant, 0);
  autoTable(doc, {
    startY: y,
    margin: { left: img ? M + colW + 6 : M, right: M },
    tableWidth: img ? colW : PW - 2 * M,
    theme: "grid",
    head: [[{ content: "Resultados", colSpan: 2, styles: { halign: "center" } }]],
    body: [
      ["Cantidad de piezas", String(total)],
      ["Tamaño del tablero", `${num(PLACA_MM.largo)} x ${num(PLACA_MM.ancho)}`],
      ...f.placas.map((p) => [
        `Tableros ${p.material} ${p.esp} mm`,
        `${p.placas} (${num(p.m2)} m2)`,
      ]),
      ...cantosFicha(f).map((c) => [c.tipo ? `Canto ${c.tipo}` : "Canto", `${num(c.m)} m`]),
      ...f.herrajes.map((h) => [h.nombre, String(h.cant)]),
    ],
    styles: { fontSize: 8.5, cellPadding: 1.6, textColor: TINTA, lineColor: [180, 172, 160] },
    headStyles: { fillColor: FONDO, textColor: TINTA, fontStyle: "normal", fontSize: 10 },
    columnStyles: { 1: { halign: "right" } },
  });
  y =
    Math.max(yImg, (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY) +
    8;

  // ---- lista de piezas, por material ----
  doc
    .setFont("helvetica", "normal")
    .setFontSize(12)
    .setTextColor(...TINTA);
  doc.text("Lista de piezas", PW / 2, y, { align: "center" });
  y += 3;
  const materiales = [...new Set(f.piezas.map((p) => `${p.material}|${p.esp}`))];
  let i = 0;
  for (const key of materiales) {
    const [material, esp] = key.split("|");
    const filas = f.piezas.filter((p) => p.material === material && String(p.esp) === esp);
    const placas = f.placas.find((p) => p.material === material && String(p.esp) === esp);
    // si no entran el título y un par de filas, la tabla arranca en la hoja siguiente
    if (y > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      y = M;
    }
    autoTable(doc, {
      startY: y + 2,
      margin: { left: M, right: M, bottom: 18 },
      theme: "grid",
      head: [
        [
          {
            content: `Material: ${material} · ${esp} mm${placas ? ` · ${placas.placas} ${placas.placas === 1 ? "tablero" : "tableros"}` : ""}`,
            colSpan: 6,
            styles: { halign: "left", fillColor: [255, 255, 255], fontStyle: "bold" },
          },
        ],
        ["#", "Largo", "Ancho", "Cantidad", "Nombre", "OK"],
      ],
      body: filas.map((p) => [
        `${++i}.`,
        num(p.largo),
        num(p.ancho),
        String(p.cant),
        p.pieza + (entraEnPlaca(p) ? "" : " (va en 2 o más partes)"),
        "",
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 2,
        textColor: TINTA,
        lineColor: [150, 142, 132],
        valign: "middle",
      },
      headStyles: { fillColor: FONDO, textColor: TINTA, fontStyle: "normal", halign: "center" },
      columnStyles: {
        0: { cellWidth: 12, fillColor: FONDO },
        1: { halign: "center", cellWidth: 24 },
        2: { halign: "center", cellWidth: 24 },
        3: { halign: "center", cellWidth: 22 },
        4: { halign: "center" },
        5: { cellWidth: 12 },
      },
      didDrawCell: (d) => {
        // casilla para tildar cada pieza cortada (como la columna PA de SketchCut)
        if (d.section === "body" && d.column.index === 5) {
          const s = 4;
          doc.setDrawColor(...TINTA).setLineWidth(0.3);
          doc.rect(d.cell.x + (d.cell.width - s) / 2, d.cell.y + (d.cell.height - s) / 2, s, s);
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  }

  // ---- pie en todas las páginas ----
  const nota =
    `Medidas en mm. Estimación generada desde el configurador para cotizar: confirmar al medir. ` +
    `Tableros de ${num(PLACA_MM.largo)} x ${num(PLACA_MM.ancho)} con ${Math.round(DESPERDICIO * 100)}% de desperdicio.`;
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    const PH = doc.internal.pageSize.getHeight();
    doc
      .setDrawColor(...DORADO)
      .setLineWidth(0.3)
      .line(M, PH - 14, PW - M, PH - 14);
    doc
      .setFont("helvetica", "normal")
      .setFontSize(7.5)
      .setTextColor(...GRIS);
    doc.text(doc.splitTextToSize(nota, PW - 2 * M - 20), M, PH - 10);
    doc.text(`${p}/${paginas}`, PW - M, PH - 10, { align: "right" });
  }

  const slug = f.mueble
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`despiece-${slug}-${id}.pdf`);
}
