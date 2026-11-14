import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { FurnitureKind, FurnitureState } from "@/lib/furniture3d";

export const WHATSAPP = "541164321329";

export const TIPOS = [
  "Cocina",
  "Placard / vestidor",
  "Escritorio / biblioteca",
  "Mueble de baño",
  "Mueble TV / living",
  "Diseño integral",
] as const;

export const TIPO_TO_KIND: Partial<Record<string, FurnitureKind>> = {
  Cocina: "cocina",
  "Placard / vestidor": "placard",
  "Escritorio / biblioteca": "biblio",
  "Mueble de baño": "vanit",
  "Mueble TV / living": "rack",
};

export interface QuoteState {
  tipo: string;
  ref: string;
  config: string;
  img: string;
  material: string;
  zona: string;
  plazo: string;
  an: string;
  al: string;
  pr: string;
  noMed: boolean;
  nombre: string;
  detalle: string;
  fotos: number;
}

const empty: QuoteState = {
  tipo: "",
  ref: "",
  config: "",
  img: "",
  material: "",
  zona: "",
  plazo: "",
  an: "",
  al: "",
  pr: "",
  noMed: false,
  nombre: "",
  detalle: "",
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

/** `adjunto`: la imagen viaja en el mismo envío (compartir nativo), no "acá abajo". */
export function armarMensaje(q: QuoteState, adjunto = false) {
  const L: string[] = [];
  L.push(`Hola Design.gr! Soy ${q.nombre.trim() || "…"}. Quiero presupuesto para:`);
  L.push(`• Mueble: ${q.tipo || "…"}`);
  if (q.ref) L.push(`• Me gusta este trabajo: "${q.ref}"`);
  if (q.config) L.push(`• Lo armé en el 3D: ${q.config}`);
  const m = medidasTexto(q);
  if (m) L.push(`• Medidas: ${m}`);
  if (q.material) L.push(`• Material: ${q.material}`);
  if (q.zona) L.push(`• Zona: ${q.zona}`);
  if (q.plazo) L.push(`• Para cuándo: ${q.plazo}`);
  if (q.detalle.trim()) L.push(`• Detalle: ${q.detalle.trim()}`);
  if (q.config || q.fotos) {
    const parts = [q.config ? "la imagen del diseño 3D" : "", q.fotos ? (q.fotos > 1 ? "las fotos del espacio" : "la foto del espacio") : ""].filter(Boolean);
    L.push(adjunto ? `Te adjunto ${parts.join(" y ")}.` : `Te mando ${parts.join(" y ")} acá abajo.`);
  }
  return L.join("\n");
}
