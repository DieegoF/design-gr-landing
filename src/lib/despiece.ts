// Despiece estimado que acompaña al pedido. Se arma en el navegador (FurnitureScene.despiece) y lo
// lee el taller en la página del diseño (/d/<id>), donde también se descarga en PDF.
// El escritorio sigue las reglas de armado reales de Design.gr (lista de SketchCut del 12/3/2026,
// escritorio 140×55); el resto de los muebles se estima desde las piezas de la maqueta 3D.
// Este archivo no usa three.js: lo importa también el servidor.
import { z } from "zod";

/** Placa que usa Design.gr (aglomerado 18 mm de 2820 × 1830). */
export const PLACA_MM = { largo: 2820, ancho: 1830 } as const;
/** Desperdicio estimado al cortar (sierra, saneo y sobrantes). */
export const DESPERDICIO = 0.15;

export const piezaSchema = z.object({
  pieza: z.string().max(60),
  material: z.string().max(60),
  esp: z.number().int().min(1).max(50),
  largo: z.number().int().min(1).max(5000),
  ancho: z.number().int().min(1).max(5000),
  cant: z.number().int().min(1).max(500),
});

export const fichaSchema = z.object({
  v: z.literal(1),
  mueble: z.string().max(60),
  /** Fecha del diseño (dd/mm/aaaa). */
  fecha: z.string().max(20).optional(),
  config: z.string().max(600),
  piezas: z.array(piezaSchema).max(200),
  cantoM: z.number().min(0).max(1000),
  placas: z
    .array(
      z.object({
        material: z.string().max(60),
        esp: z.number().int().min(1).max(50),
        m2: z.number().min(0).max(500),
        placas: z.number().int().min(0).max(100),
      }),
    )
    .max(20),
  herrajes: z
    .array(z.object({ nombre: z.string().max(60), cant: z.number().int().min(0).max(500) }))
    .max(20),
});

export type Pieza = z.infer<typeof piezaSchema>;
export type Ficha = z.infer<typeof fichaSchema>;

/** ¿La pieza sale de una sola placa? (si no, va en 2 o más partes). */
export function entraEnPlaca(p: Pick<Pieza, "largo" | "ancho">) {
  return p.largo <= PLACA_MM.largo && p.ancho <= PLACA_MM.ancho;
}

/** Agrupa piezas iguales (mismo nombre, material, espesor y medidas). */
export function agrupar(piezas: Pieza[]): Pieza[] {
  const map = new Map<string, Pieza>();
  for (const p of piezas) {
    const k = [p.pieza, p.material, p.esp, p.largo, p.ancho].join("|");
    const prev = map.get(k);
    if (prev) prev.cant += p.cant;
    else map.set(k, { ...p });
  }
  return [...map.values()].sort(
    (a, b) =>
      a.material.localeCompare(b.material) ||
      b.esp - a.esp ||
      b.largo * b.ancho - a.largo * a.ancho,
  );
}

/** Superficie por material y placas estimadas (con desperdicio). */
export function resumenPlacas(piezas: Pieza[]): Ficha["placas"] {
  const placaM2 = (PLACA_MM.largo * PLACA_MM.ancho) / 1e6;
  const map = new Map<string, { material: string; esp: number; m2: number }>();
  for (const p of piezas) {
    const k = `${p.material}|${p.esp}`;
    const m2 = ((p.largo * p.ancho) / 1e6) * p.cant;
    const prev = map.get(k);
    if (prev) prev.m2 += m2;
    else map.set(k, { material: p.material, esp: p.esp, m2 });
  }
  return [...map.values()]
    .sort((a, b) => b.esp - a.esp || b.m2 - a.m2)
    .map((r) => ({
      ...r,
      m2: Math.round(r.m2 * 100) / 100,
      placas: Math.max(1, Math.ceil((r.m2 * (1 + DESPERDICIO)) / placaM2)),
    }));
}

/** Línea corta para el mensaje de WhatsApp. */
export function resumenFicha(f: Ficha) {
  const piezas = f.piezas.reduce((s, p) => s + p.cant, 0);
  const placas18 = f.placas.filter((p) => p.esp >= 15).reduce((s, p) => s + p.placas, 0);
  return [
    `${piezas} piezas`,
    placas18 ? `~${placas18} ${placas18 === 1 ? "placa" : "placas"} de 18 mm` : "",
    f.cantoM ? `${Math.round(f.cantoM)} m de canto` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Fecha de hoy en formato dd/mm/aaaa (hora de Argentina). */
export function hoy() {
  return new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}

export type LadoMod = "cajonera" | "estantes" | "pata";

export interface EscritorioParams {
  /** Medidas en cm. */
  W: number;
  H: number;
  D: number;
  /** Cajones por cajonera, estantes por columna, repisas en la pared. */
  n: number;
  e: number;
  r: number;
  izq: LadoMod;
  der: LadoMod;
  /** Ancho de cada módulo en cm. */
  modulo: number;
  /** Materiales: cuerpo, tapa y frentes ("" = igual al cuerpo). */
  m: string;
  mt: string;
  mf: string;
}

const E = 18; // espesor de placa (mm)
const FAJA = 120; // faja superior de cada módulo (mm)
const LUZ_CORREDERA = 13; // por lado (mm)
const CORREDERAS = [250, 300, 350, 400, 450, 500, 550];
const INTERIOR = "Melamina blanca";

/**
 * Despiece del escritorio con las reglas de Design.gr. Con 140 × 78 × 55, cajonera de 4 y
 * columna con 1 estante da la misma lista que su SketchCut: tapa 1400×550, laterales 762×514,
 * fajas 314×120, pisos y estante 314×514, frentes 308×155, laterales de cajón 400×100 e
 * interiores de cajón 252×100.
 */
export function despieceEscritorio(p: EscritorioParams, config: string): Ficha {
  const W = Math.round(p.W * 10),
    H = Math.round(p.H * 10),
    D = Math.round(p.D * 10);
  const cuerpo = p.m,
    tapa = p.mt || p.m,
    frente = p.mf || p.m;
  const alto = H - E; // laterales bajo la tapa
  const prof = D - 2 * E; // retirados de adelante y de atrás
  const iw = p.modulo * 10 - 2 * E; // ancho interior del módulo
  const piezas: Pieza[] = [];
  const herrajes: Ficha["herrajes"] = [];
  let canto = 0;
  const add = (
    pieza: string,
    material: string,
    largo: number,
    ancho: number,
    cant: number,
    cantoUno = 0,
  ) => {
    if (cant <= 0) return;
    piezas.push({ pieza, material, esp: material.startsWith("Fondo") ? 3 : E, largo, ancho, cant });
    canto += cantoUno * cant;
  };

  add("Tapa", tapa, W, D, 1, 2 * (W + D));
  const lados = [p.izq, p.der];
  const modulos = lados.filter((l) => l !== "pata").length;
  const patas = lados.filter((l) => l === "pata").length;
  add("Lateral", cuerpo, alto, prof, 2 * modulos + patas, alto);
  add("Faja superior", cuerpo, iw, FAJA, 2 * modulos, iw / 2); // canto solo en la de adelante
  const estantes = lados.filter((l) => l === "estantes").length * p.e;
  add("Piso y estante", cuerpo, iw, prof, modulos + estantes, iw);

  const cajoneras = lados.filter((l) => l === "cajonera").length;
  if (cajoneras) {
    const n = p.n * cajoneras;
    const hf = Math.floor((H - FAJA - 2 * E) / p.n) - 1;
    const largoCaj = [...CORREDERAS].reverse().find((c) => c <= prof - 100) ?? CORREDERAS[0];
    const hb = Math.max(80, Math.min(150, hf - 55));
    const intAncho = iw - 2 * E - 2 * LUZ_CORREDERA;
    add("Frente de cajón", frente, iw - 6, hf, n, 2 * (iw - 6 + hf));
    add("Lateral de cajón", INTERIOR, largoCaj, hb, 2 * n, largoCaj);
    add("Interior de cajón", INTERIOR, intAncho, hb, 2 * n, intAncho);
    add("Fondo de cajón", "Fondo fibrofácil", intAncho + 2 * E, largoCaj, n);
    herrajes.push({ nombre: `Correderas telescópicas ${largoCaj} mm (par)`, cant: n });
  }

  if (p.r > 0) {
    const sw = Math.round(Math.min(W * 0.7, 1200));
    add("Repisa", cuerpo, sw, 240, p.r, sw);
    herrajes.push({ nombre: "Soportes de repisa", cant: 2 * p.r });
  }

  const grupos = piezas.map((x) => ({
    ...x,
    largo: Math.max(x.largo, x.ancho),
    ancho: Math.min(x.largo, x.ancho),
  }));
  return {
    v: 1,
    mueble: "Escritorio",
    fecha: hoy(),
    config,
    piezas: grupos,
    cantoM: Math.round(canto / 100) / 10,
    placas: resumenPlacas(grupos),
    herrajes,
  };
}
