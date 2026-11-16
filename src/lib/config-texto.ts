// Texto del diseño 3D que viaja en el mensaje de WhatsApp ("Lo armé en el 3D: …").
// Lo usan el configurador (modo avanzado) y el asistente paso a paso.
import {
  ESPESOR_MM,
  MATERIALS,
  MODULO_CM,
  type FurnitureState,
  type LadoEscritorio,
  type TypeDef,
} from "./furniture3d";

export interface OpcionesTexto {
  /** El cliente pidió que vayan a medir: no se mandan las medidas de la maqueta. */
  sinMedidas?: boolean;
  /** El cliente pidió que le recomienden el color: no se mandan los materiales. */
  sinColor?: boolean;
}

export const mm = (m: string) =>
  `${m.toLowerCase()}${MATERIALS[m]?.grp === "Melamina" ? ` ${ESPESOR_MM} mm` : ""}`;

export function configGeneral(st: FurnitureState, t: TypeDef, o: OpcionesTexto = {}) {
  return [
    o.sinMedidas
      ? `${t.lab.toLowerCase()} (medidas a confirmar)`
      : `${t.lab.toLowerCase()} de ${st.W}×${st.H}×${st.D} cm`,
    st.n ? `${st.n} ${t.nl.toLowerCase()}` : `sin ${t.nl.toLowerCase()}`,
    st.e ? `${st.e} ${st.e === 1 ? "estante" : "estantes"}` : "sin estantes",
    ...(o.sinColor ? [] : [mm(st.m), ...(st.mf ? [`puertas y frentes ${mm(st.mf)}`] : [])]),
  ];
}

export function configEscritorio(st: FurnitureState, o: OpcionesTexto = {}) {
  const lado = (l?: LadoEscritorio) =>
    l === "cajonera"
      ? `cajonera de ${st.n} cajones (${MODULO_CM} cm)`
      : l === "estantes"
        ? `columna con ${st.e} ${st.e === 1 ? "estante" : "estantes"} (${MODULO_CM} cm)`
        : "pata lateral";
  const r = st.r ?? 0;
  return [
    o.sinMedidas ? "escritorio (medidas a confirmar)" : `escritorio de ${st.W}×${st.H}×${st.D} cm`,
    `izquierda: ${lado(st.izq)}`,
    `derecha: ${lado(st.der)}`,
    ...(r ? [`${r} ${r === 1 ? "repisa" : "repisas"} en la pared`] : []),
    ...(o.sinColor
      ? []
      : [
          `cuerpo ${mm(st.m)}`,
          `tapa ${st.mt ? mm(st.mt) : "igual al cuerpo"}`,
          ...((st.izq === "cajonera" || st.der === "cajonera") && st.mf
            ? [`frentes de cajón ${mm(st.mf)}`]
            : []),
        ]),
  ];
}
