import { useEffect, useRef, useState } from "react";
import {
  Box,
  Boxes,
  DoorOpen,
  Eye,
  MessageSquarePlus,
  Minus,
  Plus,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/scroll";
import { OTRO, useQuote } from "./quote-context";
import { configEscritorio, configGeneral } from "@/lib/config-texto";
import type {
  FurnitureKind,
  FurnitureScene,
  FurnitureState,
  LadoEscritorio,
  TypeDef,
  MaterialDef,
} from "@/lib/furniture3d";

type Lib = typeof import("@/lib/furniture3d");

const KINDS: FurnitureKind[] = ["escritorio", "placard", "cocina", "biblio", "rack", "vanit"];

export function Configurator() {
  const { update, cfgReq } = useQuote();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FurnitureScene | null>(null);
  const [lib, setLib] = useState<Lib | null>(null);
  const [st, setSt] = useState<FurnitureState>({
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
  });
  const [open, setOpen] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [person, setPerson] = useState(false);
  const [front, setFront] = useState(false);
  const [hint, setHint] = useState(true);
  const [failed, setFailed] = useState(false);

  // three.js solo en el navegador
  useEffect(() => {
    let alive = true;
    let scene: FurnitureScene | null = null;
    import("@/lib/furniture3d")
      .then((L) => {
        if (!alive || !canvasRef.current || !stageRef.current) return;
        try {
          scene = new L.FurnitureScene(canvasRef.current, stageRef.current);
        } catch {
          setFailed(true);
          return;
        }
        scene.onInteract = () => setHint(false);
        scene.set(st);
        sceneRef.current = scene;
        setLib(L);
      })
      .catch(() => setFailed(true));
    const t = setTimeout(() => setHint(false), 6000);
    return () => {
      alive = false;
      clearTimeout(t);
      scene?.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = (p: Partial<FurnitureState>) => {
    setSt((s) => {
      let n = { ...s, ...p };
      if (lib) n = lib.ajustarEscritorio(n); // si no entran los módulos, pasa a pata
      sceneRef.current?.set(n);
      return n;
    });
  };

  const setKind = (k: FurnitureKind, preset?: Partial<FurnitureState>) => {
    if (!lib) return;
    const t = lib.TYPES[k];
    apply({
      k,
      W: t.W[2],
      H: t.H[2],
      D: t.D[2],
      n: t.n[2],
      e: t.e[2],
      mf: "",
      ...(k === "escritorio" ? lib.ESCRITORIO_DEF : {}),
      ...preset,
    });
  };

  // pedidos desde el hero o la galería
  useEffect(() => {
    if (cfgReq && lib) setKind(cfgReq.kind, cfgReq.preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgReq, lib]);

  const usar = () => {
    if (!lib || !sceneRef.current) return;
    const t = lib.TYPES[st.k];
    const config = (st.k === "escritorio" ? configEscritorio(st) : configGeneral(st, t)).join(", ");
    update({
      tipo: t.tipo,
      material: lib.MATERIALS[st.m].grp,
      config,
      ficha: sceneRef.current.despiece(t.tipo, config),
      an: String(st.W),
      al: String(st.H),
      pr: String(st.D),
      noMed: false,
      img: sceneRef.current.snapshot(),
    });
    scrollToSection("presupuesto");
  };

  const T: TypeDef | null = lib ? lib.TYPES[st.k] : null;
  const MATS: [string, MaterialDef][] = lib ? Object.entries(lib.MATERIALS) : [];

  return (
    <section id="avanzado" className="scroll-mt-16 bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
            <SlidersHorizontal className="size-3.5" /> Modo 2 · Avanzado
          </span>
          <button
            type="button"
            onClick={() => scrollToSection("armalo")}
            className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            ¿Te resulta mucho? Volvé al paso a paso
          </button>
        </div>
        <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Ajustá tu mueble <em className="italic text-accent">al centímetro</em>
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Acá decidís todo vos: medidas exactas, cantidad de cajones y estantes, material y colores.
          Arrastrá para girarlo, abrí cajones y puertas o miralo pieza por pieza. Abajo completás el
          pedido.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr] lg:items-start">
          <div
            ref={stageRef}
            className="relative h-[clamp(360px,62vh,560px)] min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-[#efe8de] lg:sticky lg:top-24"
          >
            <canvas
              ref={canvasRef}
              className="block size-full cursor-grab touch-pan-y active:cursor-grabbing"
              aria-label="Maqueta 3D del mueble"
            />
            {failed && (
              <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
                Tu navegador no pudo mostrar el 3D. Igual podés pedir tu presupuesto abajo.
              </p>
            )}
            {T && (
              <div className="absolute left-3 top-3 rounded-xl border border-border/60 bg-card/90 px-3 py-2 text-sm font-semibold text-foreground">
                {st.W} × {st.H} × {st.D} cm
                <small className="block text-[11px] font-normal text-muted-foreground">
                  ancho × {T.hl.toLowerCase()} × prof. · {st.m}
                </small>
              </div>
            )}
            <span className="absolute right-3 top-3 rounded-full bg-card/85 px-2.5 py-1 text-[11px] text-muted-foreground">
              Maqueta ilustrativa
            </span>
            <span
              className={cn(
                "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/60 px-4 py-2 text-sm text-primary-foreground transition-opacity duration-500",
                !hint && "opacity-0",
              )}
            >
              ↔ Arrastrá para girar
            </span>
            <div className="absolute inset-x-2 bottom-2 flex flex-wrap justify-center gap-1.5">
              {[
                {
                  on: open,
                  label: open
                    ? "Cerrar"
                    : st.k === "escritorio"
                      ? "Abrir cajones"
                      : "Abrir puertas",
                  icon: DoorOpen,
                  fn: () => {
                    setOpen(!!sceneRef.current?.toggleOpen());
                    setExploded(false);
                  },
                },
                {
                  on: exploded,
                  label: exploded ? "Armar" : "Ver pieza por pieza",
                  icon: Boxes,
                  fn: () => {
                    setExploded(!!sceneRef.current?.toggleExplode());
                    setOpen(false);
                  },
                },
                {
                  on: front,
                  label: "Vista de frente",
                  icon: Eye,
                  fn: () => setFront(!!sceneRef.current?.toggleFront()),
                },
                {
                  on: person,
                  label: "Persona 1,70 m",
                  icon: User,
                  fn: () => setPerson(!!sceneRef.current?.togglePerson()),
                },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={b.fn}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors",
                    b.on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-card/95 text-foreground",
                  )}
                >
                  <b.icon className="size-4" />
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-5">
            <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "flex-none rounded-xl border px-3 py-2 text-[13.5px] font-semibold transition-colors",
                    st.k === k
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground",
                  )}
                >
                  {lib ? lib.TYPES[k].lab : "…"}
                  {k === "escritorio" && (
                    <span
                      className={cn(
                        "ml-1.5 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide",
                        st.k === k
                          ? "bg-primary-foreground/20"
                          : "bg-accent text-primary-foreground",
                      )}
                    >
                      Especialidad
                    </span>
                  )}
                </button>
              ))}
            </div>

            {T &&
              (
                [
                  ["W", "Ancho", 10],
                  ["H", T.hl, 10],
                  ["D", "Profundidad", 5],
                ] as const
              ).map(([key, label, step]) => (
                <label key={key} className="mb-4 block">
                  <span className="mb-1.5 flex justify-between text-sm font-semibold text-foreground">
                    {label}
                    <span className="font-medium tabular-nums text-accent-foreground/80">
                      {st[key]} cm
                    </span>
                  </span>
                  <input
                    type="range"
                    min={T[key][0]}
                    max={T[key][1]}
                    step={T[key][1] - T[key][0] <= 20 ? 1 : step}
                    value={st[key]}
                    onChange={(e) => apply({ [key]: +e.target.value })}
                    className="w-full accent-[var(--primary)]"
                  />
                </label>
              ))}

            {T && st.k !== "escritorio" && (
              <div className="mb-4 grid grid-cols-2 gap-3">
                <Contador
                  label={T.nl}
                  value={st.n}
                  min={T.n[0]}
                  max={T.n[1]}
                  onChange={(n) => apply({ n })}
                />
                <Contador
                  label={T.el}
                  value={st.e}
                  min={T.e[0]}
                  max={T.e[1]}
                  onChange={(e) => apply({ e })}
                />
              </div>
            )}

            {T && lib && st.k === "escritorio" && (
              <div className="mb-4">
                {(["izq", "der"] as const).map((lado) => (
                  <div key={lado} className="mb-3">
                    <span className="mb-1.5 block text-sm font-semibold text-foreground">
                      {lado === "izq" ? "Lado izquierdo" : "Lado derecho"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(lib.LADOS) as LadoEscritorio[]).map((v) => {
                        const entra = st[lado] === v || lib.ladoEntra(st, lado, v);
                        return (
                          <button
                            key={v}
                            type="button"
                            disabled={!entra}
                            title={entra ? undefined : `Con ${st.W} cm de ancho no entra`}
                            onClick={() => apply({ [lado]: v })}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                              st[lado] === v
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground",
                            )}
                          >
                            {lib.LADOS[v]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <p className="mb-3 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  Espacio libre para las piernas:{" "}
                  <b className="text-foreground">{lib.libreEscritorio(st.W, st.izq, st.der)} cm</b>
                  {" · "}módulos de {lib.MODULO_CM} cm. Si no quedan {lib.LIBRE_MIN_CM} cm libres,
                  ese lado pasa a pata.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(st.izq === "cajonera" || st.der === "cajonera") && (
                    <Contador
                      label="Cajones"
                      value={st.n}
                      min={T.n[0]}
                      max={T.n[1]}
                      onChange={(n) => apply({ n })}
                    />
                  )}
                  {(st.izq === "estantes" || st.der === "estantes") && (
                    <Contador
                      label="Estantes de la columna"
                      value={st.e}
                      min={T.e[0]}
                      max={T.e[1]}
                      onChange={(e) => apply({ e })}
                    />
                  )}
                  <Contador
                    label="Repisas en la pared"
                    value={st.r ?? 0}
                    min={0}
                    max={3}
                    onChange={(r) => apply({ r })}
                  />
                </div>
              </div>
            )}

            <span className="mb-1.5 flex justify-between text-sm font-semibold text-foreground">
              {st.k === "escritorio" ? "Color del cuerpo" : "Material"}{" "}
              <span className="font-medium text-muted-foreground">
                {st.m}
                {lib?.MATERIALS[st.m]?.grp === "Melamina" ? ` · ${lib.ESPESOR_MM} mm` : ""}
              </span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {MATS.map(([name, m]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => apply({ m: name })}
                  className={cn(
                    "rounded-xl border bg-background p-1.5 text-left text-[12px] leading-tight text-foreground",
                    st.m === name
                      ? "border-primary ring-2 ring-inset ring-primary"
                      : "border-border",
                  )}
                >
                  <i
                    className="mb-1.5 block h-7 rounded-md border border-black/10"
                    style={{ background: m.css }}
                  />
                  {name}
                </button>
              ))}
            </div>

            {st.k === "escritorio" && (
              <ColorAlt
                label="Color de la tapa"
                value={st.mt ?? ""}
                mats={MATS}
                onChange={(mt) => apply({ mt })}
              />
            )}

            {(st.k !== "escritorio" || st.izq === "cajonera" || st.der === "cajonera") && (
              <ColorAlt
                label={
                  st.k === "escritorio"
                    ? "Color de los frentes de cajón"
                    : "Color de puertas y frentes"
                }
                value={st.mf ?? ""}
                mats={MATS}
                onChange={(mf) => apply({ mf })}
              />
            )}

            <Button
              type="button"
              size="lg"
              className="mt-5 h-auto w-full flex-col gap-0.5 py-3"
              onClick={usar}
              disabled={!lib}
            >
              <span className="flex items-center gap-2">
                <Box className="size-4" /> Usar este diseño en mi presupuesto
              </span>
              <small className="text-xs font-normal opacity-80">
                Se cargan las medidas y el material en el formulario
              </small>
            </Button>
            <button
              type="button"
              onClick={() => {
                update({ tipo: OTRO, ref: "", config: "", img: "", ficha: null });
                scrollToSection("presupuesto");
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/70 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <MessageSquarePlus className="size-4 text-accent" /> ¿No está tu mueble? Hacé una
              consulta
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Es una maqueta para darte una idea de proporciones y terminaciones. El diseño final lo
              definimos con vos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Color alternativo de una parte del mueble ("" = igual al cuerpo). */
function ColorAlt({
  label,
  value,
  mats,
  onChange,
}: {
  label: string;
  value: string;
  mats: [string, MaterialDef][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-4">
      <span className="mb-1.5 flex justify-between gap-2 text-sm font-semibold text-foreground">
        {label}
        <span className="text-right font-medium text-muted-foreground">
          {value || "Igual al cuerpo"}
        </span>
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[12.5px] font-medium",
            !value ? "border-primary ring-2 ring-inset ring-primary" : "border-border",
          )}
        >
          Igual al cuerpo
        </button>
        {mats.map(([name, m]) => (
          <button
            key={name}
            type="button"
            title={name}
            aria-label={`${label}: ${name}`}
            onClick={() => onChange(name)}
            className={cn(
              "size-9 rounded-full border-2",
              value === name
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-black/10",
            )}
            style={{ background: m.css }}
          />
        ))}
      </div>
    </div>
  );
}

function Contador({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold leading-tight text-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`menos ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus className="size-4" />
        </Button>
        <b className="min-w-6 text-center text-lg tabular-nums">{value}</b>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`más ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
