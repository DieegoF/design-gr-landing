// Despiece estimado que acompaña al pedido. Se arma en el navegador a partir de la maqueta 3D
// (FurnitureScene.despiece) y lo lee el taller en la página del diseño (/d/<id>).
// Este archivo no usa three.js: lo importa también el servidor.
import { z } from "zod";

/** Placa estándar de melamina y de fondo en Argentina (mm). */
export const PLACA_MM = { largo: 2600, ancho: 1830 } as const;
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
