// Asistente "Armá tu mueble": una pregunta por pantalla y el 3D que cambia con cada respuesta.
// Pensado para gente que no se lleva bien con la tecnología: botones grandes, siempre hay
// una salida "No sé", y en el celu se abre a pantalla completa.
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  Bath,
  BookOpen,
  Check,
  CookingPot,
  DoorClosed,
  Download,
  MessageCircle,
  MessageSquarePlus,
  Minus,
  Monitor,
  Plus,
  SlidersHorizontal,
  Store,
  Tv,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { scrollToSection } from "@/lib/scroll";
import { configEscritorio, configGeneral } from "@/lib/config-texto";
import {
  ESCRITORIO_DEF,
  FurnitureScene,
  LIBRE_MIN_CM,
  MATERIALS,
  TYPES,
  ajustarEscritorio,
  ladoEntra,
  libreEscritorio,
  type FurnitureKind,
  type FurnitureState,
} from "@/lib/furniture3d";
import type { Ficha } from "@/lib/despiece";
import {
  OTRO,
  PLAZOS,
  TIPO_TO_KIND,
  WHATSAPP,
  ZONAS,
  armarMensaje,
  useQuote,
  type QuoteState,
} from "./quote-context";
import { compartirImagen, conTimeout, subirDiseno } from "./envio";

// ---------- datos ----------

const TIPOS_A: { tipo: string; icon: LucideIcon; desc?: string }[] = [
  { tipo: "Escritorio", icon: Monitor, desc: "Nuestra especialidad" },
  { tipo: "Cocina", icon: CookingPot },
  { tipo: "Placard / vestidor", icon: DoorClosed },
  { tipo: "Biblioteca / estantería", icon: BookOpen },
  { tipo: "Mueble de baño", icon: Bath },
  { tipo: "Mueble TV / living", icon: Tv },
  { tipo: "Diseño integral", icon: Store, desc: "Ambiente o local" },
  { tipo: OTRO, icon: MessageSquarePlus, desc: "¿No está? Contanos" },
];

type TamFijo = "chico" | "mediano" | "grande";
type Tam = TamFijo | "propias" | "medir" | "trabajo";
type Medida = { W: number; H: number; D: number; n?: number };

/** Tres tamaños típicos por mueble (dentro de los rangos de TYPES). */
const TAMS: Record<FurnitureKind, Record<TamFijo, Medida>> = {
  escritorio: {
    chico: { W: 120, H: 75, D: 50 },
    mediano: { W: 130, H: 75, D: 50 },
    grande: { W: 160, H: 75, D: 60 },
  },
  placard: {
    chico: { W: 160, H: 240, D: 60, n: 3 },
    mediano: { W: 240, H: 250, D: 60, n: 4 },
    grande: { W: 320, H: 260, D: 60, n: 6 },
  },
  cocina: {
    chico: { W: 180, H: 220, D: 60, n: 3 },
    mediano: { W: 260, H: 220, D: 60, n: 4 },
    grande: { W: 340, H: 230, D: 60, n: 6 },
  },
  biblio: {
    chico: { W: 120, H: 200, D: 30, n: 2 },
    mediano: { W: 200, H: 220, D: 35, n: 3 },
    grande: { W: 280, H: 240, D: 35, n: 4 },
  },
  rack: {
    chico: { W: 180, H: 200, D: 40, n: 2 },
    mediano: { W: 220, H: 240, D: 40, n: 3 },
    grande: { W: 300, H: 250, D: 45, n: 4 },
  },
  vanit: {
    chico: { W: 60, H: 50, D: 45, n: 1 },
    mediano: { W: 80, H: 50, D: 46, n: 2 },
    grande: { W: 120, H: 55, D: 46, n: 3 },
  },
};
const TAM_N: Record<TamFijo, string> = { chico: "Chico", mediano: "Mediano", grande: "Grande" };

type Clave = "izq" | "der" | "r" | "n" | "e";
type Pregunta = { id: Clave; q: string; r: string; c: [string | number, string][] };
const LADOS_C: [string, string][] = [
  ["cajonera", "Cajonera"],
  ["estantes", "Estantes"],
  ["pata", "Pata"],
];
const PREGUNTAS: Record<FurnitureKind, Pregunta[]> = {
  escritorio: [
    { id: "izq", q: "¿Qué va del lado izquierdo?", r: "Lado izquierdo", c: LADOS_C },
    { id: "der", q: "¿Y del lado derecho?", r: "Lado derecho", c: LADOS_C },
    {
      id: "r",
      q: "¿Repisas en la pared, arriba?",
      r: "Repisas en la pared",
      c: [
        [0, "No"],
        [1, "Una"],
        [2, "Dos"],
      ],
    },
  ],
  placard: [
    {
      id: "n",
      q: "¿Cuántas puertas?",
      r: "Puertas",
      c: [
        [2, "2"],
        [3, "3"],
        [4, "4"],
        [6, "6"],
      ],
    },
  ],
  cocina: [
    {
      id: "n",
      q: "¿Cuántas puertas abajo?",
      r: "Puertas por fila",
      c: [
        [3, "3"],
        [4, "4"],
        [5, "5"],
        [6, "6"],
      ],
    },
  ],
  biblio: [
    {
      id: "n",
      q: "¿Cuántas columnas?",
      r: "Columnas",
      c: [
        [2, "2"],
        [3, "3"],
        [4, "4"],
        [5, "5"],
      ],
    },
    {
      id: "e",
      q: "¿Cuántos estantes en cada columna?",
      r: "Estantes por columna",
      c: [
        [3, "3"],
        [4, "4"],
        [5, "5"],
        [6, "6"],
      ],
    },
  ],
  rack: [
    {
      id: "n",
      q: "¿Cuántas puertas abajo?",
      r: "Puertas",
      c: [
        [2, "2"],
        [3, "3"],
        [4, "4"],
      ],
    },
    {
      id: "e",
      q: "¿Estantes al costado de la tele?",
      r: "Estantes al costado",
      c: [
        [0, "No"],
        [1, "Uno de cada lado"],
        [2, "Dos de cada lado"],
      ],
    },
  ],
  vanit: [
    {
      id: "n",
      q: "¿Cuántas puertas?",
      r: "Puertas",
      c: [
        [1, "1"],
        [2, "2"],
        [3, "3"],
      ],
    },
  ],
};

type PasoId = "tipo" | "tam" | "opts" | "color" | "texto" | "zona" | "fin";
const PASOS_3D: PasoId[] = ["tipo", "tam", "opts", "color", "zona", "fin"];
const PASOS_TEXTO: PasoId[] = ["tipo", "texto", "zona", "fin"];

interface Wiz {
  paso: number;
  tipo: string;
  st: FurnitureState;
  tam: Tam | null;
  /** Medidas del trabajo de la galería ("Como el de la foto"). */
  trab: Medida | null;
  med: [string, string, string];
  asesorar: boolean;
  colorNose: boolean;
  zona: string;
  plazo: string;
  nombre: string;
  /** Descripción libre ("Otro mueble" y "Diseño integral"). */
  texto: string;
  comentario: string;
  ref: string;
}

const ST0: FurnitureState = {
  k: "escritorio",
  W: 130,
  H: 75,
  D: 50,
  n: 4,
  e: 1,
  m: "Melamina blanca",
  izq: "cajonera",
  der: "estantes",
  mt: "",
  mf: "",
  r: 0,
};
const W0: Wiz = {
  paso: 0,
  tipo: "",
  st: ST0,
  tam: null,
  trab: null,
  med: ["", "", ""],
  asesorar: false,
  colorNose: false,
  zona: "",
  plazo: "",
  nombre: "",
  texto: "",
  comentario: "",
  ref: "",
};
const KEY = "dgr-asistente";
const VERSION = 1;

// ---------- utilidades ----------

const fmt = (cm: number) =>
  cm >= 100 ? `${(cm / 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })} m` : `${cm} cm`;

/** "Melamina gris grafito" → { n: "Gris grafito", sub: "Melamina" } */
function nombreMat(name: string) {
  const sub = name.startsWith("MDF") ? "MDF laqueado" : "Melamina";
  const n = name.replace(/^MDF laqueado /, "").replace(/^Melamina /, "");
  return { n: n[0].toUpperCase() + n.slice(1), sub };
}

const rangos = (k: FurnitureKind) => [TYPES[k].W, TYPES[k].H, TYPES[k].D] as const;

function medOk(k: FurnitureKind, med: [string, string, string]) {
  return rangos(k).every(([a, b], i) => {
    const v = Number(med[i]);
    return med[i] !== "" && v >= a && v <= b;
  });
}

function estado(st: FurnitureState) {
  return ajustarEscritorio(st);
}

/** Pantalla completa en el celu y en tablets chicas. */
function useCelu() {
  const [celu, setCelu] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const f = () => setCelu(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return celu;
}

// ---------- componentes chicos ----------

function Op({
  sel,
  onClick,
  children,
  className,
  disabled,
  title,
}: {
  sel: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={sel}
      className={cn(
        "relative flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-2 bg-background px-3 py-3 text-center text-[17px] font-semibold text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        sel ? "border-accent bg-accent/10" : "border-border hover:border-accent/60",
        className,
      )}
    >
      {children}
      {sel && (
        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-accent text-primary-foreground">
          <Check className="size-4" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function Titulo({ t, em, sub }: { t: string; em: string; sub?: string }) {
  return (
    <>
      <h3 className="font-display text-[28px] font-medium leading-tight text-foreground sm:text-3xl">
        {t} <em className="text-accent">{em}</em>
      </h3>
      {sub && <p className="mt-1.5 text-[16px] text-muted-foreground">{sub}</p>}
    </>
  );
}

function Pregunta({ children }: { children: ReactNode }) {
  return <p className="mb-2.5 mt-6 text-[18px] font-bold text-foreground">{children}</p>;
}

// ---------- asistente ----------

type Subida = { estado: "subiendo" | "listo" | "error"; link: string };

export function Asistente() {
  const { wizReq, abrirAvanzado } = useQuote();
  const [w, setW] = useState<Wiz>(W0);
  const [cargado, setCargado] = useState(false);
  const [full, setFull] = useState(false);
  const celu = useCelu();
  const [falta, setFalta] = useState("");
  const [failed, setFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FurnitureScene | null>(null);
  const [diseno, setDiseno] = useState<{ img: string; ficha: Ficha | null } | null>(null);
  const [subida, setSubida] = useState<Subida | null>(null);
  const subidaRef = useRef<Promise<string> | null>(null);
  const [esperando, setEsperando] = useState(false);

  const kind = TIPO_TO_KIND[w.tipo];
  const pasos = w.tipo && !kind ? PASOS_TEXTO : PASOS_3D;
  const iPaso = Math.min(w.paso, pasos.length - 1);
  const paso = pasos[iPaso];
  const ultimo = paso === "fin";

  // Retoma lo que dejó a medias (si cierra la página y vuelve).
  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(KEY) || "null");
      if (g?.v === VERSION && g.w) setW({ ...W0, ...g.w, st: estado({ ...ST0, ...g.w.st }) });
    } catch {
      /* sin guardado */
    }
    setCargado(true);
  }, []);
  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, w }));
    } catch {
      /* modo privado */
    }
  }, [w, cargado]);

  // three.js solo en el navegador
  useEffect(() => {
    let scene: FurnitureScene | null = null;
    try {
      scene = new FurnitureScene(canvasRef.current!, stageRef.current!);
      scene.set(w.st);
      sceneRef.current = scene;
    } catch {
      setFailed(true);
    }
    return () => {
      scene?.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    sceneRef.current?.set({ ...w.st });
  }, [w.st]);

  // Pantalla completa: sin scroll de fondo y con Escape para salir.
  const enPantalla = full && celu;
  useEffect(() => {
    if (!enPantalla) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [enPantalla]);

  const arriba = () => panelRef.current?.scrollTo({ top: 0 });

  const elegir = (tipo: string, preset?: Partial<FurnitureState>, ref = "") => {
    const k = TIPO_TO_KIND[tipo];
    setW((p) => {
      const mismo = p.tipo === tipo && !preset;
      let st = p.st;
      let trab: Medida | null = mismo ? p.trab : null;
      if (k && !mismo) {
        const base = TAMS[k].mediano;
        st = estado({
          ...p.st,
          ...(k === "escritorio" ? ESCRITORIO_DEF : {}),
          k,
          W: base.W,
          H: base.H,
          D: base.D,
          n: base.n ?? TYPES[k].n[2],
          e: TYPES[k].e[2],
          m: p.st.m,
          mf: p.st.mf,
          mt: k === "escritorio" ? p.st.mt : "",
          ...preset,
        } as FurnitureState);
        if (preset) trab = { W: st.W, H: st.H, D: st.D, n: st.n };
      }
      return {
        ...p,
        tipo,
        st,
        trab,
        ref: mismo ? p.ref : ref,
        tam: mismo ? p.tam : preset && k ? "trabajo" : null,
        asesorar: mismo ? p.asesorar : false,
        texto: mismo ? p.texto : "",
        paso: 1,
      };
    });
    setFalta("");
    arriba();
  };

  // Hero, trabajos y menú abren el asistente con un mueble ya elegido.
  useEffect(() => {
    if (!wizReq) return;
    elegir(wizReq.tipo, wizReq.preset, wizReq.ref);
    if (window.matchMedia("(max-width: 1023px)").matches) setFull(true);
    else scrollToSection("armalo-app");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizReq]);

  const cambiarSt = (p: Partial<FurnitureState>, extra: Partial<Wiz> = {}) => {
    setW((s) => ({ ...s, ...extra, st: estado({ ...s.st, ...p }) }));
    setFalta("");
  };
  const set = (p: Partial<Wiz>) => {
    setW((s) => ({ ...s, ...p }));
    setFalta("");
  };

  const empezarDeNuevo = () => {
    setW({ ...W0, st: ST0 });
    setFalta("");
    arriba();
  };
  const hayAlgo = !!w.tipo || w.paso > 0;

  const ir = (i: number) => {
    setW((s) => ({ ...s, paso: Math.max(0, Math.min(pasos.length - 1, i)) }));
    setFalta("");
    arriba();
  };

  const validar = (): string => {
    switch (paso) {
      case "tipo":
        return w.tipo ? "" : "Tocá un mueble para seguir.";
      case "tam":
        if (!w.tam) return "Elegí un tamaño, o «Que vengan a medir».";
        if (w.tam === "propias" && kind && !medOk(kind, w.med))
          return "Revisá las medidas marcadas en rojo.";
        return "";
      case "texto":
        return w.texto.trim() ? "" : "Contanos en una frase qué necesitás.";
      case "zona":
        if (!w.zona) return "Tocá la zona donde vivís.";
        return w.plazo ? "" : "Contanos para cuándo lo necesitás.";
      case "fin":
        return w.nombre.trim() ? "" : "Escribí tu nombre para enviarlo.";
      default:
        return "";
    }
  };
  const avisar = (t: string) => {
    setFalta("");
    requestAnimationFrame(() => setFalta(t));
    if (paso === "fin") document.getElementById("asistente-nombre")?.focus();
  };
  const siguiente = () => {
    const e = validar();
    if (e) return avisar(e);
    ir(iPaso + 1);
  };

  // ---------- textos del pedido ----------
  const medir = w.tam === "medir";
  const config = kind
    ? (kind === "escritorio"
        ? configEscritorio(w.st, { sinMedidas: medir, sinColor: w.colorNose })
        : configGeneral(w.st, TYPES[kind], { sinMedidas: medir, sinColor: w.colorNose })
      ).join(", ")
    : "";

  // Al llegar al resumen: foto del 3D + despiece, y se sube en segundo plano.
  const claveFin = ultimo && kind ? JSON.stringify([w.st, w.tam, w.colorNose]) : "";
  useEffect(() => {
    if (!claveFin || !kind) return;
    let vivo = true;
    const t = setTimeout(() => {
      const sc = sceneRef.current;
      if (!sc || !vivo) return;
      let img = "";
      try {
        img = sc.snapshot();
      } catch {
        return;
      }
      const ficha = medir ? null : sc.despiece(TYPES[kind].tipo, config);
      setDiseno({ img, ficha });
      setSubida({ estado: "subiendo", link: "" });
      subidaRef.current = subirDiseno(img, ficha).then(
        (link) => {
          if (vivo) setSubida({ estado: "listo", link });
          return link;
        },
        (err) => {
          console.error(err);
          if (vivo) setSubida({ estado: "error", link: "" });
          return "";
        },
      );
    }, 700); // que la cámara termine de acomodarse
    return () => {
      vivo = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveFin]);

  const detalle = [
    w.tipo === "Diseño integral" ? w.texto.trim() : "",
    w.asesorar ? "Quiero que me asesoren con el diseño" : "",
    kind && w.colorNose ? "El color, que me lo recomienden" : "",
    w.comentario.trim(),
  ]
    .filter(Boolean)
    .join(". ");
  const q: QuoteState = {
    tipo: w.tipo,
    ref: w.ref,
    config,
    img: kind && diseno ? diseno.img : "",
    ficha: kind && diseno ? diseno.ficha : null,
    material: kind ? (w.colorNose ? "No sé, que me asesoren" : (MATERIALS[w.st.m]?.grp ?? "")) : "",
    zona: w.zona,
    plazo: w.plazo,
    an: kind && !medir ? String(w.st.W) : "",
    al: kind && !medir ? String(w.st.H) : "",
    pr: kind && !medir ? String(w.st.D) : "",
    noMed: medir,
    nombre: w.nombre,
    detalle,
    consulta: w.tipo === OTRO ? w.texto : "",
    fotos: 0,
  };
  const link = subida?.estado === "listo" ? subida.link : "";
  const waLink = (texto: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
  const waUrl = waLink(armarMensaje(q, link));

  const enviar = async (e: MouseEvent<HTMLAnchorElement>) => {
    const err = validar();
    if (err) {
      e.preventDefault();
      return avisar(err);
    }
    if (subida?.estado !== "subiendo" || !subidaRef.current) return; // sigue el link wa.me
    e.preventDefault();
    setEsperando(true);
    const l = await conTimeout(subidaRef.current, 10000, "");
    setEsperando(false);
    window.location.href = waLink(armarMensaje(q, l));
  };

  const irAvanzado = () => {
    abrirAvanzado(kind ?? "escritorio", { ...w.st });
    setFull(false);
    setTimeout(() => scrollToSection("avanzado"), 120);
  };

  // ---------- resúmenes ----------
  const txtMedidas = () =>
    medir
      ? "Que vengan a medir"
      : `${fmt(w.st.W)} de ancho · ${fmt(w.st.H)} de alto · ${fmt(w.st.D)} de fondo`;
  const txtLleva = () =>
    !kind
      ? ""
      : w.asesorar
        ? "Que me asesoren"
        : PREGUNTAS[kind]
            .map((p) => {
              const v = w.st[p.id];
              const c = p.c.find(([k]) => k === v);
              return `${p.r}: ${(c ? c[1] : String(v ?? "")).toLowerCase()}`;
            })
            .join(" · ");
  const tieneFrentes = kind !== "escritorio" || w.st.izq === "cajonera" || w.st.der === "cajonera";
  const txtColor = () => {
    if (w.colorNose) return "Que me recomienden";
    const p = [`Cuerpo: ${w.st.m}`];
    if (kind === "escritorio") p.push(`Tapa: ${w.st.mt || "igual al cuerpo"}`);
    if (tieneFrentes)
      p.push(
        `${kind === "escritorio" ? "Frentes de cajón" : "Puertas y frentes"}: ${w.st.mf || "igual al cuerpo"}`,
      );
    return p.join(" · ");
  };

  // ---------- pantallas ----------
  const tarjetasTipo = (alTocar: (tipo: string) => void, marcado: string) => (
    <div className="grid grid-cols-2 gap-3">
      {TIPOS_A.map((t) => (
        <Op
          key={t.tipo}
          sel={marcado === t.tipo}
          onClick={() => alTocar(t.tipo)}
          className={cn("min-h-[112px] flex-col px-2", t.tipo === OTRO && "border-dashed")}
        >
          <t.icon className="size-9 text-accent" strokeWidth={1.5} />
          <span className="leading-tight">{t.tipo}</span>
          {t.desc && (
            <small className="-mt-1 text-[13px] font-normal text-muted-foreground">{t.desc}</small>
          )}
        </Op>
      ))}
    </div>
  );

  const grillaMat = (actual: string, alTocar: (v: string) => void, conIgual: boolean) => (
    <div className="grid grid-cols-3 gap-2.5">
      {conIgual && (
        <Op sel={actual === ""} onClick={() => alTocar("")} className="min-h-[104px] flex-col px-1">
          <span
            className="grid size-11 place-items-center rounded-full border border-black/10 text-xl font-bold text-accent"
            style={{ background: MATERIALS[w.st.m]?.css }}
          >
            =
          </span>
          <span className="text-[14px] leading-tight">Igual al mueble</span>
        </Op>
      )}
      {Object.entries(MATERIALS).map(([name, m]) => {
        const nm = nombreMat(name);
        return (
          <Op
            key={name}
            sel={actual === name}
            onClick={() => alTocar(name)}
            className="min-h-[104px] flex-col px-1"
          >
            <span
              className="size-11 rounded-full border border-black/10"
              style={{ background: m.css }}
            />
            <span className="text-[14px] leading-tight">
              {nm.n}
              <small className="block text-[11.5px] font-normal text-muted-foreground">
                {nm.sub}
              </small>
            </span>
          </Op>
        );
      })}
    </div>
  );

  const pantalla = () => {
    switch (paso) {
      case "tipo":
        return (
          <>
            <Titulo t="¿Qué mueble" em="necesitás?" sub="Tocá el que quieras y miralo en 3D." />
            <div className="mt-5">{tarjetasTipo((t) => elegir(t), w.tipo)}</div>
          </>
        );

      case "tam": {
        if (!kind) return null;
        const r = rangos(kind);
        const nombres = ["Ancho", TYPES[kind].hl, "Fondo"];
        return (
          <>
            <Titulo t="¿De qué" em="tamaño?" sub="Si no sabés, elegí «Que vengan a medir»." />
            <div className="mt-5 grid gap-3">
              {w.trab && (
                <Op
                  sel={w.tam === "trabajo"}
                  onClick={() => cambiarSt(w.trab!, { tam: "trabajo" })}
                  className="flex-col items-start pr-10 text-left"
                >
                  <span>{w.ref ? "Como el de la foto" : "Como el modelo que elegiste"}</span>
                  <small className="text-[14.5px] font-normal text-muted-foreground">
                    {w.ref ? `«${w.ref}» · ` : ""}
                    {fmt(w.trab.W)} de ancho · {fmt(w.trab.H)} de alto
                  </small>
                </Op>
              )}
              {(["chico", "mediano", "grande"] as const).map((t) => {
                const d = TAMS[kind][t];
                return (
                  <Op
                    key={t}
                    sel={w.tam === t}
                    onClick={() => cambiarSt(d, { tam: t })}
                    className="flex-col items-start pr-10 text-left"
                  >
                    <span>{TAM_N[t]}</span>
                    <small className="text-[14.5px] font-normal text-muted-foreground">
                      Ancho {fmt(d.W)} · Alto {fmt(d.H)} · Fondo {fmt(d.D)}
                    </small>
                  </Op>
                );
              })}
              <Op
                sel={w.tam === "propias"}
                onClick={() =>
                  set({
                    tam: "propias",
                    med:
                      w.tam === "propias"
                        ? w.med
                        : [String(w.st.W), String(w.st.H), String(w.st.D)],
                  })
                }
                className="flex-col items-start pr-10 text-left"
              >
                <span>Tengo mis medidas</span>
                <small className="text-[14.5px] font-normal text-muted-foreground">
                  Las escribo yo, en centímetros
                </small>
              </Op>
              {w.tam === "propias" && (
                <div className="grid gap-3 rounded-2xl border-2 border-accent bg-background p-3.5">
                  {nombres.map((nom, i) => {
                    const [a, b] = r[i];
                    const v = w.med[i];
                    const ok = v !== "" && Number(v) >= a && Number(v) <= b;
                    const poner = (txt: string) => {
                      const med = [...w.med] as [string, string, string];
                      med[i] = txt;
                      const n = Number(txt);
                      const key = (["W", "H", "D"] as const)[i];
                      if (txt !== "" && n >= a && n <= b) cambiarSt({ [key]: n }, { med });
                      else set({ med });
                    };
                    const paso5 = (dl: number) => {
                      const n = Math.min(
                        b,
                        Math.max(
                          a,
                          (Number(v) || TYPES[kind][(["W", "H", "D"] as const)[i]][2]) + dl,
                        ),
                      );
                      poner(String(n));
                    };
                    return (
                      <div key={nom} className="flex items-center gap-2.5">
                        <label htmlFor={`med-${i}`} className="flex-1 font-semibold">
                          {nom}
                          <small className="block text-[13px] font-normal text-muted-foreground">
                            entre {a} y {b} cm
                          </small>
                        </label>
                        <button
                          type="button"
                          aria-label={`Menos ${nom.toLowerCase()}`}
                          onClick={() => paso5(-5)}
                          className="grid size-12 place-items-center rounded-full border-2 border-foreground bg-card"
                        >
                          <Minus className="size-5" />
                        </button>
                        <input
                          id={`med-${i}`}
                          inputMode="numeric"
                          value={v}
                          onChange={(e) => poner(e.target.value.replace(/\D/g, ""))}
                          className={cn(
                            "h-12 w-20 rounded-xl border-2 bg-card text-center text-xl font-bold outline-none focus:border-accent",
                            ok ? "border-border" : "border-destructive bg-destructive/10",
                          )}
                        />
                        <button
                          type="button"
                          aria-label={`Más ${nom.toLowerCase()}`}
                          onClick={() => paso5(5)}
                          className="grid size-12 place-items-center rounded-full border-2 border-foreground bg-card"
                        >
                          <Plus className="size-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <Op
                sel={w.tam === "medir"}
                onClick={() => cambiarSt(TAMS[kind].mediano, { tam: "medir" })}
                className="flex-col items-start border-dashed pr-10 text-left"
              >
                <span>No sé, que vengan a medir</span>
                <small className="text-[14.5px] font-normal text-muted-foreground">
                  Te visitan y toman las medidas
                </small>
              </Op>
            </div>
            <button
              type="button"
              onClick={irAvanzado}
              className="mt-6 flex items-center gap-2 text-[14px] font-medium text-muted-foreground underline underline-offset-4"
            >
              <SlidersHorizontal className="size-4" /> ¿Querés ajustar todo al detalle? Usá el modo
              avanzado
            </button>
          </>
        );
      }

      case "opts": {
        if (!kind) return null;
        return (
          <>
            <Titulo
              t="¿Qué querés que"
              em="tenga?"
              sub="Ya dejamos marcado lo más común. Cambiá lo que quieras."
            />
            {PREGUNTAS[kind].map((p) => (
              <div key={p.id}>
                <Pregunta>{p.q}</Pregunta>
                <div
                  className={cn("grid gap-2.5", p.c.length === 4 ? "grid-cols-4" : "grid-cols-3")}
                >
                  {p.c.map(([v, l]) => {
                    const lado = p.id === "izq" || p.id === "der" ? p.id : null;
                    const entra =
                      !lado ||
                      w.st[lado] === v ||
                      ladoEntra(w.st, lado, v as "cajonera" | "estantes" | "pata");
                    return (
                      <Op
                        key={String(v)}
                        sel={!w.asesorar && w.st[p.id] === v}
                        disabled={!entra}
                        title={entra ? undefined : `Con ${w.st.W} cm de ancho no entra`}
                        onClick={() => cambiarSt({ [p.id]: v }, { asesorar: false })}
                        className="px-1 text-[16px]"
                      >
                        {l}
                      </Op>
                    );
                  })}
                </div>
              </div>
            ))}
            {kind === "escritorio" && (
              <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-[14px] text-muted-foreground">
                Quedan{" "}
                <b className="text-foreground">{libreEscritorio(w.st.W, w.st.izq, w.st.der)} cm</b>{" "}
                libres para las piernas. Si un lado no entra con este ancho, aparece apagado (hacen
                falta {LIBRE_MIN_CM} cm).
              </p>
            )}
            <Pregunta>¿Tenés dudas?</Pregunta>
            <Op
              sel={w.asesorar}
              onClick={() => set({ asesorar: !w.asesorar })}
              className="w-full flex-col items-start border-dashed pr-10 text-left"
            >
              <span>No sé, que me asesoren</span>
              <small className="text-[14.5px] font-normal text-muted-foreground">
                Lo charlás con Design.gr
              </small>
            </Op>
          </>
        );
      }

      case "color":
        return (
          <>
            <Titulo t="¿De qué" em="color?" sub="Tocá un color y miralo en el mueble." />
            <Pregunta>Color del mueble</Pregunta>
            {grillaMat(
              w.colorNose ? "-" : w.st.m,
              (v) => cambiarSt({ m: v }, { colorNose: false }),
              false,
            )}
            <Op
              sel={w.colorNose}
              onClick={() => set({ colorNose: !w.colorNose })}
              className="mt-3 w-full border-dashed"
            >
              No sé, que me recomienden
            </Op>
            {!w.colorNose && kind === "escritorio" && (
              <>
                <Pregunta>Color de la tapa</Pregunta>
                {grillaMat(w.st.mt ?? "", (v) => cambiarSt({ mt: v }), true)}
              </>
            )}
            {!w.colorNose && tieneFrentes && (
              <>
                <Pregunta>
                  {kind === "escritorio"
                    ? "Color de los frentes de cajón"
                    : "Color de puertas y frentes"}
                </Pregunta>
                {grillaMat(w.st.mf ?? "", (v) => cambiarSt({ mf: v }), true)}
              </>
            )}
          </>
        );

      case "texto":
        return (
          <>
            <Titulo
              t={w.tipo === OTRO ? "Contanos qué" : "Contanos qué querés"}
              em={w.tipo === OTRO ? "mueble es" : "armar"}
              sub="Con tus palabras, como se lo contarías a alguien."
            />
            <Textarea
              rows={5}
              value={w.texto}
              onChange={(e) => set({ texto: e.target.value })}
              placeholder={
                w.tipo === OTRO
                  ? "Ej.: un mueble para la entrada con zapatero y perchero, va en un hueco de 120 cm."
                  : "Ej.: el mostrador y las estanterías de mi local, de unos 4 metros."
              }
              className="mt-5 min-h-36 rounded-2xl border-2 text-[18px]"
            />
          </>
        );

      case "zona":
        return (
          <>
            <Titulo
              t="¿Dónde vivís y"
              em="para cuándo?"
              sub="Así te pasan el presupuesto con el envío."
            />
            <Pregunta>¿Dónde vivís?</Pregunta>
            <div className="grid grid-cols-3 gap-2.5">
              {ZONAS.map((z) => (
                <Op
                  key={z}
                  sel={w.zona === z}
                  onClick={() => set({ zona: z })}
                  className="px-1 text-[16px]"
                >
                  {z}
                </Op>
              ))}
            </div>
            <Pregunta>¿Para cuándo lo necesitás?</Pregunta>
            <div className="grid gap-2.5">
              {PLAZOS.map((p) => (
                <Op
                  key={p}
                  sel={w.plazo === p}
                  onClick={() => set({ plazo: p })}
                  className="justify-start pr-10 text-left"
                >
                  {p}
                </Op>
              ))}
            </div>
          </>
        );

      case "fin": {
        const fila = (b: string, v: string, id: PasoId) => (
          <div key={b} className="flex items-start gap-3 border-b border-border py-3 last:border-0">
            <div className="min-w-0 flex-1">
              <b className="block text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                {b}
              </b>
              <span className="text-[16px] text-foreground [overflow-wrap:anywhere]">{v}</span>
            </div>
            <button
              type="button"
              onClick={() => ir(pasos.indexOf(id))}
              className="py-1 text-[15px] font-bold text-accent underline underline-offset-4"
            >
              Cambiar
            </button>
          </div>
        );
        const nom = w.tipo === OTRO ? "mueble" : w.tipo.split(" /")[0].toLowerCase();
        return (
          <>
            <Titulo
              t="¡Listo! Así quedaría tu"
              em={`${nom}`}
              sub="Revisá que esté todo bien. Si algo no te gusta, tocá «Cambiar»."
            />
            <div className="mt-4 rounded-2xl border border-border bg-background px-4">
              {fila("Mueble", w.tipo, "tipo")}
              {kind ? (
                <>
                  {fila("Medidas", txtMedidas(), "tam")}
                  {fila("Lleva", txtLleva(), "opts")}
                  {fila("Color", txtColor(), "color")}
                </>
              ) : (
                fila("Lo que necesitás", w.texto.trim(), "texto")
              )}
              {fila("Zona y plazo", `${w.zona} · ${w.plazo}`, "zona")}
            </div>
            <label htmlFor="asistente-nombre" className="mb-2.5 mt-6 block text-[18px] font-bold">
              ¿Cómo te llamás?
            </label>
            <Input
              id="asistente-nombre"
              value={w.nombre}
              onChange={(e) => set({ nombre: e.target.value })}
              placeholder="Tu nombre"
              autoComplete="given-name"
              enterKeyHint="send"
              className="h-14 rounded-2xl border-2 text-[18px]"
            />
            {kind && (
              <>
                <label
                  htmlFor="asistente-comentario"
                  className="mb-2.5 mt-6 block text-[18px] font-bold"
                >
                  ¿Querés agregar algo?{" "}
                  <small className="font-normal text-muted-foreground">(si no, dejalo vacío)</small>
                </label>
                <Textarea
                  id="asistente-comentario"
                  rows={3}
                  value={w.comentario}
                  onChange={(e) => set({ comentario: e.target.value })}
                  placeholder="Ej.: es para el cuarto de mi nieta"
                  className="rounded-2xl border-2 text-[17px]"
                />
              </>
            )}
            {kind && subida?.estado === "error" && diseno && (
              <button
                type="button"
                onClick={() => void compartirImagen(diseno.img)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold"
              >
                <Download className="size-4" /> Guardar la imagen del diseño para mandarla
              </button>
            )}
            {kind && (
              <button
                type="button"
                onClick={irAvanzado}
                className="mt-6 flex items-center gap-2 text-[14px] font-medium text-muted-foreground underline underline-offset-4"
              >
                <SlidersHorizontal className="size-4" /> Ajustar al detalle en el modo avanzado
              </button>
            )}
          </>
        );
      }
    }
  };

  const chip = !w.tipo
    ? "Así va a ir quedando tu mueble"
    : medir
      ? "Medidas a confirmar"
      : `${fmt(w.st.W)} de ancho · ${fmt(w.st.H)} de alto`;

  return (
    <section id="armalo" className="bg-secondary px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Presupuesto en 1 minuto
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Armá tu mueble y miralo en 3D
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Contestá unas preguntas cortas: el mueble se va armando solo. Al final nos llega tu pedido
          completo por WhatsApp.
        </p>

        {/* Celu: las tarjetas en la página; al tocar una se abre a pantalla completa. */}
        {celu && !full && (
          <div className="mt-6 lg:hidden">
            {w.tipo && w.paso > 0 && (
              <button
                type="button"
                onClick={() => setFull(true)}
                className="mb-4 w-full rounded-2xl bg-primary px-4 py-4 text-[18px] font-bold text-primary-foreground"
              >
                Seguir armando: {w.tipo}
              </button>
            )}
            {w.tipo && w.paso > 0 && (
              <button
                type="button"
                onClick={empezarDeNuevo}
                className="-mt-1 mb-4 w-full py-2 text-[15px] font-semibold text-muted-foreground underline underline-offset-4"
              >
                Empezar de nuevo
              </button>
            )}
            {tarjetasTipo((t) => {
              elegir(t);
              setFull(true);
            }, w.tipo)}
          </div>
        )}

        <div
          className={cn(
            enPantalla
              ? "fixed inset-0 z-[60] flex flex-col bg-card"
              : "mt-8 scroll-mt-20 grid-cols-[1.35fr_1fr] gap-5",
            !enPantalla && (celu ? "hidden" : "grid"),
          )}
          id="armalo-app"
          role={enPantalla ? "dialog" : undefined}
          aria-modal={enPantalla || undefined}
          aria-label={enPantalla ? "Armá tu mueble" : undefined}
        >
          {enPantalla && (
            <div className="flex flex-none items-center justify-between gap-3 border-b border-border bg-background px-4 py-2.5">
              {hayAlgo ? (
                <button
                  type="button"
                  onClick={empezarDeNuevo}
                  className="py-2 text-[15px] font-semibold text-muted-foreground underline underline-offset-4"
                >
                  Empezar de nuevo
                </button>
              ) : (
                <b className="font-display text-xl font-semibold">Design.gr</b>
              )}
              <span className="text-[15px] font-semibold text-muted-foreground">
                Paso {iPaso + 1} de {pasos.length}
              </span>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setFull(false)}
                className="grid size-11 place-items-center rounded-full border border-border"
              >
                <X className="size-5" />
              </button>
            </div>
          )}
          {enPantalla && (
            <div className="h-1.5 flex-none bg-border">
              <div
                className="h-full bg-accent transition-[width] duration-300"
                style={{ width: `${((iPaso + 1) / pasos.length) * 100}%` }}
              />
            </div>
          )}

          <div
            ref={stageRef}
            className={cn(
              "relative min-w-0 overflow-hidden bg-[#efe8de]",
              enPantalla
                ? "h-[34vh] min-h-[210px] flex-none"
                : "h-[min(640px,calc(100svh-6rem))] min-h-[520px] rounded-2xl border border-border/60",
            )}
          >
            <canvas
              ref={canvasRef}
              className={cn(
                "block size-full cursor-grab touch-pan-y active:cursor-grabbing",
                w.tipo && !kind && "invisible",
              )}
              aria-label="Maqueta 3D del mueble"
            />
            {w.tipo && !kind && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <span>
                  <MessageSquarePlus
                    className="mx-auto mb-3 size-12 text-accent"
                    strokeWidth={1.4}
                  />
                  <b className="block font-display text-2xl font-medium">Lo diseñamos con vos</b>
                  <span className="text-muted-foreground">
                    Contanos qué necesitás y te pasamos una propuesta.
                  </span>
                </span>
              </div>
            )}
            {failed && (
              <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
                Tu navegador no pudo mostrar el 3D. Igual podés armar tu pedido.
              </p>
            )}
            <span className="absolute left-3 top-3 rounded-full bg-card/85 px-2.5 py-1 text-[12px] text-muted-foreground">
              Maqueta ilustrativa
            </span>
            {(!w.tipo || kind) && (
              <span className="absolute bottom-3 right-3 max-w-[calc(100%-1.5rem)] rounded-full bg-foreground px-3.5 py-1.5 text-[14px] font-semibold text-background">
                {chip}
              </span>
            )}
          </div>

          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-col bg-card",
              enPantalla
                ? "flex-1"
                : "h-[min(640px,calc(100svh-6rem))] min-h-[520px] rounded-2xl border border-border/60",
            )}
          >
            {!enPantalla && (
              <div className="flex-none px-6 pt-5">
                <div className="flex items-center justify-between text-[14px] font-semibold text-muted-foreground">
                  <span>
                    Paso {iPaso + 1} de {pasos.length}
                  </span>
                  {hayAlgo && (
                    <button
                      type="button"
                      onClick={empezarDeNuevo}
                      className="underline underline-offset-4"
                    >
                      Empezar de nuevo
                    </button>
                  )}
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-300"
                    style={{ width: `${((iPaso + 1) / pasos.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <div ref={panelRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-5 sm:px-6">
              {pantalla()}
            </div>
            {falta && (
              <p
                role="alert"
                className="mx-4 mb-1 rounded-xl bg-[#fdf1de] px-3.5 py-2.5 text-[16px] font-semibold text-[#7a4b00] sm:mx-6"
              >
                {falta}
              </p>
            )}
            <div className="flex flex-none gap-3 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
              <button
                type="button"
                onClick={() => ir(iPaso - 1)}
                className={cn(
                  "h-[60px] rounded-2xl border-2 border-foreground px-5 text-[18px] font-bold",
                  iPaso === 0 && "invisible",
                )}
              >
                Volver
              </button>
              {ultimo ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={enviar}
                  className="flex h-[60px] flex-1 items-center justify-center gap-2 rounded-2xl bg-whatsapp px-4 text-[18px] font-bold text-[#073b1c]"
                >
                  <MessageCircle className="size-5 fill-current" />
                  {esperando ? "Preparando la imagen…" : "Enviar por WhatsApp"}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={siguiente}
                  className="h-[60px] flex-1 rounded-2xl bg-primary px-4 text-[18px] font-bold text-primary-foreground"
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
