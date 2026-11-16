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
  /** "taller": reglas de armado de Design.gr · "estimado": reglas estándar, a confirmar. */
  origen: z.enum(["taller", "estimado"]).optional(),
  config: z.string().max(600),
  piezas: z.array(piezaSchema).max(200),
  cantoM: z.number().min(0).max(1000),
  /** Metros de canto por tipo (2 mm en frentes y tapas, 0,4 mm en el resto). */
  cantos: z
    .array(z.object({ tipo: z.string().max(20), m: z.number().min(0).max(1000) }))
    .max(5)
    .optional(),
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
    // placas de 18 mm primero y los fondos de 3 mm al final, como en la lista del taller
    (a, b) =>
      b.esp - a.esp ||
      a.material.localeCompare(b.material) ||
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
const FAJA = 120; // faja superior de cada módulo del escritorio (mm)
const LUZ = 3; // luz de frentes y puertas por lado (mm)
const LUZ_CORREDERA = 13; // por lado (mm)
const CORREDERAS = [250, 300, 350, 400, 450, 500, 550];
// fondo de fibrofácil en surco (SketchCut de Design.gr: desplazamiento 15, profundidad 8, ancho 4)
const SURCO_PROF = 8;
const SURCO_DESP = 15;
const INTERIOR = "Melamina blanca";
const FONDO = "Fondo fibrofácil";

/** Arma la lista de piezas, cantos y herrajes de un mueble. */
class Lista {
  piezas: Pieza[] = [];
  herrajes = new Map<string, number>();
  canto2 = 0;
  canto04 = 0;

  /** `canto`: mm de canto por pieza; `grueso`: canto de 2 mm (frentes y tapas). */
  add(
    pieza: string,
    material: string,
    a: number,
    b: number,
    cant: number,
    canto = 0,
    grueso = false,
  ) {
    if (cant <= 0 || a <= 0 || b <= 0) return;
    const esp = material === FONDO ? 3 : E;
    this.piezas.push({
      pieza,
      material,
      esp,
      largo: Math.round(Math.max(a, b)),
      ancho: Math.round(Math.min(a, b)),
      cant,
    });
    if (grueso) this.canto2 += canto * cant;
    else this.canto04 += canto * cant;
  }

  herraje(nombre: string, cant: number) {
    if (cant > 0) this.herrajes.set(nombre, (this.herrajes.get(nombre) ?? 0) + cant);
  }

  /** Puertas superpuestas con bisagra cazoleta 35 mm. */
  puertas(material: string, ancho: number, alto: number, cant: number) {
    this.add("Puerta", material, ancho, alto, cant, 2 * (ancho + alto), true);
    const bisagras = alto <= 900 ? 2 : alto <= 1500 ? 3 : alto <= 2000 ? 4 : 5;
    this.herraje("Bisagras cazoleta 35 mm", bisagras * cant);
  }

  /** Cajones con corredera telescópica: frente, caja de 18 y fondo de 3 mm. */
  cajones(
    frente: string,
    anchoInt: number,
    prof: number,
    altoFrente: number,
    anchoFrente: number,
    cant: number,
  ) {
    if (cant <= 0) return;
    const largo = [...CORREDERAS].reverse().find((c) => c <= prof - 100) ?? CORREDERAS[0];
    const hb = Math.max(80, Math.min(150, altoFrente - 55));
    const intAncho = anchoInt - 2 * E - 2 * LUZ_CORREDERA;
    this.add(
      "Frente de cajón",
      frente,
      anchoFrente,
      altoFrente,
      cant,
      2 * (anchoFrente + altoFrente),
      true,
    );
    this.add("Lateral de cajón", INTERIOR, largo, hb, 2 * cant, largo);
    this.add("Interior de cajón", INTERIOR, intAncho, hb, 2 * cant, intAncho);
    this.add("Fondo de cajón", FONDO, intAncho + 2 * E, largo, cant);
    this.herraje(`Correderas telescópicas ${largo} mm (par)`, cant);
  }

  /** Fondo de fibrofácil que entra en el surco de laterales, techo y piso. */
  fondo(anchoInt: number, altoInt: number, cant = 1) {
    this.add("Fondo", FONDO, anchoInt + 2 * SURCO_PROF - 2, altoInt + 2 * SURCO_PROF - 2, cant);
  }

  ficha(mueble: string, config: string, origen: "taller" | "estimado"): Ficha {
    const piezas = agrupar(this.piezas);
    const m = (mm: number) => Math.round(mm / 100) / 10;
    return {
      v: 1,
      mueble,
      fecha: hoy(),
      origen,
      config,
      piezas,
      cantoM: m(this.canto2 + this.canto04),
      cantos: [
        { tipo: "2 mm", m: m(this.canto2) },
        { tipo: "0,4 mm", m: m(this.canto04) },
      ].filter((c) => c.m > 0),
      placas: resumenPlacas(piezas),
      herrajes: [...this.herrajes].map(([nombre, cant]) => ({ nombre, cant })),
    };
  }
}

interface Caja {
  ancho: number;
  alto: number;
  prof: number;
  cuerpo: string;
  /** Zócalo de melamina entre laterales (0 = sin zócalo). */
  zocalo?: number;
  /** Arriba: techo entero o dos fajas (bajo mesada / vanitory, que llevan mesada encima). */
  arriba?: "techo" | "fajas";
  conFondo?: boolean;
}

/**
 * Caja de melamina: laterales enteros, piso y techo entre laterales, fondo en surco.
 * Devuelve el ancho y el alto interiores.
 */
function caja(L: Lista, c: Caja) {
  const z = c.zocalo ?? 0;
  const iw = c.ancho - 2 * E;
  L.add("Lateral", c.cuerpo, c.alto, c.prof, 2, c.alto);
  L.add("Piso", c.cuerpo, iw, c.prof, 1, iw);
  if ((c.arriba ?? "techo") === "techo") L.add("Techo", c.cuerpo, iw, c.prof, 1, iw);
  else L.add("Faja superior", c.cuerpo, iw, 100, 2, iw / 2);
  if (z) L.add("Zócalo", c.cuerpo, iw, z, 1, iw);
  const ih = c.alto - z - E - ((c.arriba ?? "techo") === "techo" ? E : 0);
  if (c.conFondo ?? true) L.fondo(iw, ih);
  return { iw, ih, profEst: c.prof - SURCO_DESP - 5 };
}

/**
 * Divide el ancho total en módulos de hasta 2 puertas (así ninguna pieza pasa la placa).
 * Todas las puertas tienen el mismo ancho, como en el 3D.
 */
function modulos(W: number, puertas: number) {
  const mods = Math.max(1, Math.ceil(puertas / 2));
  const reparto = Array.from({ length: mods }, (_, i) =>
    i < mods - 1 ? 2 : puertas - 2 * (mods - 1),
  );
  const anchoPuerta = W / puertas;
  return { mods, reparto, anchos: reparto.map((r) => r * anchoPuerta), anchoPuerta };
}

/** Parámetros comunes del configurador (medidas en cm). */
export interface MuebleParams {
  k: "escritorio" | "placard" | "cocina" | "biblio" | "rack" | "vanit";
  W: number;
  H: number;
  D: number;
  n: number;
  e: number;
  m: string;
  /** Material de puertas y frentes ("" = igual al cuerpo). */
  mf: string;
  // solo escritorio
  r?: number;
  izq?: LadoMod;
  der?: LadoMod;
  modulo?: number;
  mt?: string;
}

/** Despiece de cualquier mueble del configurador. */
export function despieceMueble(p: MuebleParams, mueble: string, config: string): Ficha {
  if (p.k === "escritorio")
    return despieceEscritorio(
      {
        W: p.W,
        H: p.H,
        D: p.D,
        n: p.n,
        e: p.e,
        r: p.r ?? 0,
        izq: p.izq ?? "cajonera",
        der: p.der ?? "estantes",
        modulo: p.modulo ?? 35,
        m: p.m,
        mt: p.mt ?? "",
        mf: p.mf,
      },
      config,
    );
  const W = Math.round(p.W * 10),
    H = Math.round(p.H * 10),
    D = Math.round(p.D * 10);
  const cuerpo = p.m,
    frente = p.mf || p.m;
  const L = new Lista();

  if (p.k === "placard") {
    // módulos de 2 puertas; columnas que se repiten: colgar · estantes · colgar con cajones
    const Z = 80;
    const { mods, anchos, reparto, anchoPuerta } = modulos(W, p.n);
    const prof = D - E;
    let barral = 0,
      colgar = 0;
    for (let i = 0; i < mods; i++) {
      const { iw, profEst } = caja(L, { ancho: anchos[i], alto: H, prof, cuerpo, zocalo: Z });
      const tipo = i % 3;
      if (tipo === 0) {
        L.add("Estante", INTERIOR, iw - 2, profEst, 1 + p.e, iw - 2);
        barral += iw;
        colgar++;
      } else if (tipo === 1) {
        L.add("Estante", INTERIOR, iw - 2, profEst, p.e + 4, iw - 2);
      } else {
        L.add("Estante", INTERIOR, iw - 2, profEst, 2, iw - 2);
        barral += iw;
        colgar++;
        L.cajones(INTERIOR, iw, profEst, 200, iw - 4, 3);
      }
      L.puertas(frente, anchoPuerta - 2 * LUZ, H - Z - LUZ, reparto[i]);
    }
    if (barral) {
      L.herraje("Barral (metros)", Math.ceil(barral / 1000));
      L.herraje("Soportes de barral", 2 * colgar);
    }
    return L.ficha(mueble, config, "estimado");
  }

  if (p.k === "cocina") {
    // bajo mesada en módulos de 2 puertas + alacenas si el alto llega
    const Z = 100,
      altoBajo = 860,
      prof = D - 40;
    const { mods, anchos, reparto, anchoPuerta } = modulos(W, p.n);
    for (let i = 0; i < mods; i++) {
      const { iw, profEst } = caja(L, {
        ancho: anchos[i],
        alto: altoBajo,
        prof,
        cuerpo,
        zocalo: Z,
        arriba: "fajas",
      });
      L.add("Estante", INTERIOR, iw - 2, profEst, p.e, iw - 2);
      L.puertas(frente, anchoPuerta - 2 * LUZ, altoBajo - Z - LUZ, reparto[i]);
    }
    if (H >= 2000) {
      const altoAl = Math.min(900, H - 1450),
        profAl = 330;
      for (let i = 0; i < mods; i++) {
        const { iw, profEst } = caja(L, { ancho: anchos[i], alto: altoAl, prof: profAl, cuerpo });
        L.add("Estante de alacena", INTERIOR, iw - 2, profEst, p.e, iw - 2);
        L.puertas(frente, anchoPuerta - 2 * LUZ, altoAl - LUZ, reparto[i]);
      }
      L.herraje("Colgadores de alacena (par)", mods);
    }
    return L.ficha(mueble, config, "estimado");
  }

  if (p.k === "biblio") {
    // un módulo por columna; abajo puertas hasta 720 mm con estante fijo, arriba estantes
    const prof = D - E,
      bajo = 720,
      cw = W / p.n;
    for (let i = 0; i < p.n; i++) {
      const { iw, profEst } = caja(L, { ancho: cw, alto: H, prof, cuerpo });
      L.add("Estante fijo", cuerpo, iw, profEst, 1, iw);
      L.add("Estante", cuerpo, iw - 2, profEst, p.e, iw - 2);
      L.puertas(frente, cw - 2 * LUZ, bajo - LUZ, 1);
    }
    return L.ficha(mueble, config, "estimado");
  }

  if (p.k === "rack") {
    // panel de listones de 30 mm + mueble bajo colgado de 420 mm en módulos de 2 puertas
    const listones = Math.floor((W + 16) / 46);
    L.add("Listón", cuerpo, H, 30, listones);
    L.add("Panel de fondo de listones", "Melamina negra", W, H, 1);
    const alto = 420,
      prof = D - E;
    const { mods, anchos, reparto, anchoPuerta } = modulos(W, p.n);
    for (let i = 0; i < mods; i++) {
      const { iw, profEst } = caja(L, { ancho: anchos[i], alto, prof, cuerpo });
      L.add("Estante", INTERIOR, iw - 2, profEst, 1, iw - 2);
      L.puertas(frente, anchoPuerta - 2 * LUZ, alto - LUZ, reparto[i]);
    }
    L.herraje("Soportes para mueble colgado", 2 * mods);
    if (p.e > 0) {
      const lado = Math.min(500, Math.round((W - Math.min(1450, W * 0.55)) / 2 - 100));
      if (lado >= 200) L.add("Estante flotante", cuerpo, lado, 220, 2 * p.e, lado);
      else
        L.add(
          "Estante flotante",
          cuerpo,
          Math.min(W - 100, 1200),
          220,
          p.e,
          Math.min(W - 100, 1200),
        );
      L.herraje("Soportes ocultos de estante", (lado >= 200 ? 4 : 2) * p.e);
    }
    return L.ficha(mueble, config, "estimado");
  }

  // vanitory colgado: sin fondo atrás (pasan los caños), fajas arriba para la bacha
  const prof = D - E;
  const { iw, profEst } = caja(L, {
    ancho: W,
    alto: H,
    prof,
    cuerpo,
    arriba: "fajas",
    conFondo: false,
  });
  L.add("Estante", INTERIOR, iw - 2, Math.round(profEst * 0.6), p.e, iw - 2);
  L.puertas(frente, W / p.n - 2 * LUZ, H - LUZ, p.n);
  L.herraje("Soportes para mueble colgado", 2);
  return L.ficha(mueble, config, "estimado");
}

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
  const L = new Lista();

  L.add("Tapa", tapa, W, D, 1, 2 * (W + D), true);
  const lados = [p.izq, p.der];
  const mods = lados.filter((l) => l !== "pata").length;
  const patas = lados.filter((l) => l === "pata").length;
  L.add("Lateral", cuerpo, alto, prof, 2 * mods + patas, alto);
  L.add("Faja superior", cuerpo, iw, FAJA, 2 * mods, iw / 2); // canto solo en la de adelante
  const estantes = lados.filter((l) => l === "estantes").length * p.e;
  L.add("Piso y estante", cuerpo, iw, prof, mods + estantes, iw);

  const cajoneras = lados.filter((l) => l === "cajonera").length;
  if (cajoneras) {
    const hf = Math.floor((H - FAJA - 2 * E) / p.n) - 1;
    L.cajones(frente, iw, prof, hf, iw - 2 * LUZ, p.n * cajoneras);
  }

  if (p.r > 0) {
    const sw = Math.round(Math.min(W * 0.7, 1200));
    L.add("Repisa", cuerpo, sw, 240, p.r, sw);
    L.herraje("Soportes de repisa", 2 * p.r);
  }
  return L.ficha("Escritorio", config, "taller");
}

/** De dónde salen las medidas (para la página y el PDF). */
export function textoOrigen(f: Ficha) {
  return f.origen === "taller"
    ? "Medidas con las reglas de armado del taller."
    : "Medidas estimadas con reglas estándar de melamina: confirmar con el taller antes de cortar.";
}

/** Canto por tipo; los despieces viejos solo traen el total. */
export function cantosFicha(f: Ficha) {
  return f.cantos?.length ? f.cantos : [{ tipo: "", m: f.cantoM }];
}
