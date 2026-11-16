import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { FurnitureKind, FurnitureState } from "@/lib/furniture3d";
import { resumenFicha, type Ficha } from "@/lib/despiece";

export const WHATSAPP = "541164321329";

/** Mueble que no está en la lista: se manda como consulta con descripción libre. */
export const OTRO = "Otro mueble";

export const TIPOS = [
  "Escritorio",
  "Cocina",
  "Placard / vestidor",
  "Biblioteca / estantería",
  "Mueble de baño",
  "Mueble TV / living",
  "Diseño integral",
  OTRO,
] as const;

export const TIPO_TO_KIND: Partial<Record<string, FurnitureKind>> = {
  Escritorio: "escritorio",
  Cocina: "cocina",
  "Placard / vestidor": "placard",
  "Biblioteca / estantería": "biblio",
  "Mueble de baño": "vanit",
  "Mueble TV / living": "rack",
};

export interface QuoteState {
  tipo: string;
  ref: string;
  config: string;
  img: string;
  /** Despiece estimado del diseño 3D (viaja junto con la imagen al link del diseño). */
  ficha: Ficha | null;
  material: string;
  zona: string;
  plazo: string;
  an: string;
  al: string;
  pr: string;
  noMed: boolean;
  nombre: string;
  detalle: string;
  /** Descripción del mueble cuando eligió "Otro mueble". */
  consulta: string;
  fotos: number;
}

const empty: QuoteState = {
  tipo: "",
  ref: "",
  config: "",
  img: "",
  ficha: null,
  material: "",
  zona: "",
  plazo: "",
  an: "",
  al: "",
  pr: "",
  noMed: false,
  nombre: "",
  detalle: "",
  consulta: "",
  fotos: 0,
};

/** Pedido de "mostrar este mueble en 3D", consumido por el configurador. */
export interface ConfigRequest {
  kind: FurnitureKind;
  preset?: Partial<FurnitureState>;
  nonce: number;
}

interface Ctx {
  q: QuoteState;
  update: (p: Partial<QuoteState>) => void;
  cfgReq: ConfigRequest | null;
  showIn3D: (kind: FurnitureKind, preset?: Partial<FurnitureState>) => void;
}

const QuoteCtx = createContext<Ctx | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [q, setQ] = useState<QuoteState>(empty);
  const [cfgReq, setCfgReq] = useState<ConfigRequest | null>(null);
  const update = useCallback((p: Partial<QuoteState>) => setQ((s) => ({ ...s, ...p })), []);
  const showIn3D = useCallback(
    (kind: FurnitureKind, preset?: Partial<FurnitureState>) =>
      setCfgReq({ kind, preset, nonce: Date.now() }),
    [],
  );
  const value = useMemo(() => ({ q, update, cfgReq, showIn3D }), [q, update, cfgReq, showIn3D]);
  return <QuoteCtx.Provider value={value}>{children}</QuoteCtx.Provider>;
}

export function useQuote() {
  const c = useContext(QuoteCtx);
  if (!c) throw new Error("useQuote fuera de QuoteProvider");
  return c;
}

export function medidasTexto(q: QuoteState) {
  if (q.noMed) return "que vengan a medir";
  return (
    [
      [q.an, "ancho"],
      [q.al, "alto"],
      [q.pr, "prof."],
    ] as const
  )
    .filter(([v]) => v)
    .map(([v, n]) => `${v} cm de ${n}`)
    .join(", ");
}

/**
 * `link`: página con la imagen del 3D (WhatsApp muestra su miniatura en el chat).
 * `fotosRef`: links de las fotos de referencia ("Otro mueble"); `refAparte` cuenta las que no se pudieron subir.
 */
export function armarMensaje(q: QuoteState, link = "", fotosRef: string[] = [], refAparte = 0) {
  const L: string[] = [];
  const otro = q.tipo === OTRO;
  L.push(
    otro
      ? `Hola Design.gr! Soy ${q.nombre.trim() || "(tu nombre)"}. Quiero consultar por un mueble que no está en la lista:`
      : `Hola Design.gr! Soy ${q.nombre.trim() || "(tu nombre)"}. Quiero presupuesto para:`,
  );
  if (otro) {
    L.push(`• Lo que necesito: ${q.consulta.trim() || "…"}`);
    fotosRef.forEach((f, i) =>
      L.push(`• Foto de referencia${fotosRef.length > 1 ? ` ${i + 1}` : ""}: ${f}`),
    );
  } else L.push(`• Mueble: ${q.tipo || "…"}`);
  if (q.ref) L.push(`• Me gusta este trabajo: "${q.ref}"`);
  if (q.config) L.push(`• Lo armé en el 3D: ${q.config}`);
  if (link) L.push(`• Mi diseño 3D: ${link}`);
  if (q.config && q.ficha)
    L.push(
      `• Despiece estimado: ${resumenFicha(q.ficha)}${link ? " (detalle en el link del diseño)" : ""}`,
    );
  const m = medidasTexto(q);
  if (m) L.push(`• Medidas: ${m}`);
  if (q.material)
    L.push(`• Material: ${q.material === "Melamina" ? "Melamina 18 mm" : q.material}`);
  if (q.zona) L.push(`• Zona: ${q.zona}`);
  if (q.plazo) L.push(`• Para cuándo: ${q.plazo}`);
  if (q.detalle.trim()) L.push(`• Detalle: ${q.detalle.trim()}`);
  const imgAparte = !!q.config && !link;
  const refFalta = otro ? refAparte : 0;
  const fotosEsp = otro ? 0 : q.fotos; // en "Otro mueble" las fotos van como referencia
  if (imgAparte || fotosEsp || refFalta) {
    const parts = [
      imgAparte ? "la imagen del diseño 3D" : "",
      refFalta ? (refFalta > 1 ? "las fotos de referencia" : "la foto de referencia") : "",
      fotosEsp ? (fotosEsp > 1 ? "las fotos del espacio" : "la foto del espacio") : "",
    ].filter(Boolean);
    L.push(`Te mando ${parts.join(" y ")} acá abajo.`);
  }
  return L.join("\n");
}
