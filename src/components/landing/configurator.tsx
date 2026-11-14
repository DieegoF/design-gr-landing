import { useEffect, useRef, useState } from "react";
import { Box, DoorOpen, Eye, Minus, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/scroll";
import { useQuote } from "./quote-context";
import type { FurnitureKind, FurnitureScene, FurnitureState, TypeDef, MaterialDef } from "@/lib/furniture3d";

type Lib = typeof import("@/lib/furniture3d");

const KINDS: FurnitureKind[] = ["placard", "cocina", "biblio", "rack", "vanit"];

export function Configurator() {
  const { update, cfgReq } = useQuote();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FurnitureScene | null>(null);
  const [lib, setLib] = useState<Lib | null>(null);
  const [st, setSt] = useState<FurnitureState>({ k: "placard", W: 240, H: 250, D: 60, n: 4, m: "Melamina blanca" });
  const [open, setOpen] = useState(false);
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
      const n = { ...s, ...p };
      sceneRef.current?.set(n);
      return n;
    });
  };

  const setKind = (k: FurnitureKind, preset?: Partial<FurnitureState>) => {
    if (!lib) return;
    const t = lib.TYPES[k];
    apply({ k, W: t.W[2], H: t.H[2], D: t.D[2], n: t.n[2], ...preset });
  };

  // pedidos desde el hero o la galería
  useEffect(() => {
    if (cfgReq && lib) setKind(cfgReq.kind, cfgReq.preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgReq, lib]);

  const usar = () => {
    if (!lib || !sceneRef.current) return;
    const t = lib.TYPES[st.k];
    update({
      tipo: t.tipo,
      material: lib.MATERIALS[st.m].grp,
      config: `${t.lab.toLowerCase()} de ${st.W}×${st.H}×${st.D} cm, ${st.n} ${t.nl.toLowerCase()}, ${st.m.toLowerCase()}`,
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
    <section id="armalo" className="bg-secondary px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Armalo en 3D</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Mirá cómo quedaría tu mueble
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Elegí el mueble, las medidas y el material. Arrastrá para girarlo y abrí las puertas para
          ver el interior.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr] lg:items-start">
          <div
            ref={stageRef}
            className="relative h-[clamp(360px,62vh,560px)] min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-[#efe8de] lg:sticky lg:top-24"
          >
            <canvas ref={canvasRef} className="block size-full cursor-grab touch-pan-y active:cursor-grabbing" aria-label="Maqueta 3D del mueble" />
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
                { on: open, label: open ? "Cerrar" : "Abrir puertas", icon: DoorOpen, fn: () => setOpen(!!sceneRef.current?.toggleOpen()) },
                { on: front, label: "Vista de frente", icon: Eye, fn: () => setFront(!!sceneRef.current?.toggleFront()) },
                { on: person, label: "Persona 1,70 m", icon: User, fn: () => setPerson(!!sceneRef.current?.togglePerson()) },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={b.fn}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors",
                    b.on ? "border-primary bg-primary text-primary-foreground" : "border-border/60 bg-card/95 text-foreground",
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
                    st.k === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground",
                  )}
                >
                  {lib ? lib.TYPES[k].lab : "…"}
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
                    <span className="font-medium tabular-nums text-accent-foreground/80">{st[key]} cm</span>
                  </span>
                  <input
                    type="range"
                    min={T[key][0]}
                    max={T[key][1]}
                    step={step}
                    value={st[key]}
                    onChange={(e) => apply({ [key]: +e.target.value })}
                    className="w-full accent-[var(--primary)]"
                  />
                </label>
              ))}

            {T && (
              <div className="mb-4">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">{T.nl}</span>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="icon" aria-label="menos" onClick={() => st.n > T.n[0] && apply({ n: st.n - 1 })}>
                    <Minus className="size-4" />
                  </Button>
                  <b className="min-w-7 text-center text-lg">{st.n}</b>
                  <Button type="button" variant="outline" size="icon" aria-label="más" onClick={() => st.n < T.n[1] && apply({ n: st.n + 1 })}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            <span className="mb-1.5 flex justify-between text-sm font-semibold text-foreground">
              Material <span className="font-medium text-muted-foreground">{st.m}</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {MATS.map(([name, m]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => apply({ m: name })}
                  className={cn(
                    "rounded-xl border bg-background p-1.5 text-left text-[12px] leading-tight text-foreground",
                    st.m === name ? "border-primary ring-2 ring-inset ring-primary" : "border-border",
                  )}
                >
                  <i className="mb-1.5 block h-7 rounded-md border border-black/10" style={{ background: m.css }} />
                  {name}
                </button>
              ))}
            </div>

            <Button type="button" size="lg" className="mt-5 h-auto w-full flex-col gap-0.5 py-3" onClick={usar} disabled={!lib}>
              <span className="flex items-center gap-2">
                <Box className="size-4" /> Usar este diseño en mi presupuesto
              </span>
              <small className="text-xs font-normal opacity-80">Se cargan las medidas y el material en el formulario</small>
            </Button>
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
