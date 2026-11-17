import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ESCRITORIO_DEF,
  FurnitureScene,
  ajustarEscritorio,
  type FurnitureState,
} from "@/lib/furniture3d";
import { scrollSuave } from "@/lib/smooth";
import { useQuote } from "./quote-context";

interface Modelo {
  id: string;
  nombre: string;
  bajada: string;
  st: FurnitureState;
  specs: string[];
  /** Foto real del mismo modelo, si la hay. */
  foto?: { src: string; alt: string };
}

const base = { k: "escritorio", ...ESCRITORIO_DEF } as FurnitureState;
const st = (p: Partial<FurnitureState>) => ajustarEscritorio({ ...base, ...p });

const MODELOS: Modelo[] = [
  {
    id: "clasico",
    nombre: "El más pedido",
    bajada:
      "Cajonera de un lado y columna con estantes del otro. Todo en blanco, para cualquier ambiente.",
    st: st({}),
    specs: ["130 × 75 × 50 cm", "Cajonera de 4", "Columna con 1 estante", "Melamina blanca"],
    foto: {
      src: "/images/escritorio-1.jpeg",
      alt: "Escritorio a medida en melamina blanca con cajonera de 4 cajones y columna con estantes, hecho por Design.gr",
    },
  },
  {
    id: "home-office",
    nombre: "Home office",
    bajada: "Más ancho, con dos repisas en la pared para tener todo a mano y la tapa en roble.",
    st: st({ W: 150, D: 55, n: 3, izq: "cajonera", der: "pata", mt: "Melamina roble", r: 2 }),
    specs: ["150 × 75 × 55 cm", "Cajonera de 3", "2 repisas", "Blanco con tapa roble"],
  },
  {
    id: "doble-cajonera",
    nombre: "Doble cajonera",
    bajada:
      "Guardado de los dos lados y espacio de sobra en el medio. Cuerpo grafito y tapa nogal.",
    st: st({
      W: 180,
      D: 60,
      n: 4,
      izq: "cajonera",
      der: "cajonera",
      m: "Melamina gris grafito",
      mt: "Melamina nogal",
    }),
    specs: ["180 × 75 × 60 cm", "2 cajoneras de 4", "Grafito con tapa nogal"],
  },
  {
    id: "compacto",
    nombre: "Compacto",
    bajada: "Para un rincón o un dormitorio: un metro de ancho con columna de estantes.",
    st: st({ W: 100, n: 2, e: 2, izq: "estantes", der: "pata", m: "Melamina roble", mt: "" }),
    specs: ["100 × 75 × 50 cm", "Columna con 2 estantes", "Melamina roble"],
  },
];

const N = MODELOS.length;

export function Modelos() {
  const { abrirAsistente } = useQuote();
  const secRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FurnitureScene | null>(null);
  const idxRef = useRef(0);
  const [idx, setIdx] = useState(0);
  const [sin3d, setSin3d] = useState(false);

  // three.js solo en el navegador
  useEffect(() => {
    let scene: FurnitureScene | null = null;
    try {
      scene = new FurnitureScene(canvasRef.current!, stageRef.current!);
      scene.set({ ...MODELOS[0].st });
      scene.aim(-0.7);
      sceneRef.current = scene;
    } catch {
      setSin3d(true);
    }
    return () => {
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      ScrollTrigger.create({
        trigger: secRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.8,
        onUpdate: (self) => {
          const p = self.progress * N;
          const i = Math.min(N - 1, Math.floor(p));
          const t = Math.min(1, p - i); // avance dentro del modelo
          if (i !== idxRef.current) {
            idxRef.current = i;
            setIdx(i);
            sceneRef.current?.set({ ...MODELOS[i].st });
            if (stageRef.current && !quieto)
              gsap.fromTo(
                stageRef.current,
                { opacity: 0.25, scale: 0.96 },
                { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", overwrite: true },
              );
          }
          const sc = sceneRef.current;
          if (!sc) return;
          if (quieto) {
            sc.aim(-0.5);
            return;
          }
          // gira de izquierda a derecha y abre los cajones en el medio del recorrido
          sc.aim(-0.95 + t * 1.4, 0.18 - t * 0.08);
          sc.setOpen(t > 0.38 && t < 0.78 ? 1 : 0);
        },
      });
    },
    { scope: secRef },
  );

  // entrada del texto cuando cambia el modelo
  useGSAP(
    () => {
      if (!textRef.current) return;
      gsap.fromTo(
        textRef.current.querySelectorAll("[data-anim]"),
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" },
      );
    },
    { dependencies: [idx], scope: textRef },
  );

  const irA = (i: number) => {
    const s = secRef.current;
    if (!s) return;
    const top = s.getBoundingClientRect().top + window.scrollY;
    const recorrido = s.offsetHeight - window.innerHeight;
    scrollSuave(top + ((i + 0.5) / N) * recorrido);
  };

  const m = MODELOS[idx];

  return (
    <section
      id="escritorios"
      ref={secRef}
      className="relative bg-[#efe8de]"
      style={{ height: `${N * 110 + 20}svh` }}
      aria-label="Modelos de escritorio"
    >
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col overflow-hidden lg:flex-row">
        {/* 3D */}
        <div className="relative h-[46%] flex-none lg:order-2 lg:h-full lg:flex-1">
          <div ref={stageRef} className="absolute inset-0">
            <canvas
              ref={canvasRef}
              className="pointer-events-none block size-full"
              aria-label={`Vista 3D del escritorio ${m.nombre}`}
              role="img"
            />
          </div>
          {sin3d && (
            <img
              src="/images/escritorio-1.jpeg"
              alt={MODELOS[0].foto!.alt}
              className="absolute inset-0 size-full object-cover"
            />
          )}
          {/* índice lateral */}
          <ol className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2.5 lg:hidden">
            {MODELOS.map((x, i) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => irA(i)}
                  className="group flex items-center justify-end gap-2 text-right"
                  aria-current={i === idx}
                >
                  <span
                    className={cn(
                      "hidden text-xs font-medium uppercase tracking-wider transition-colors",
                      i === idx
                        ? "text-foreground"
                        : "text-foreground/40 group-hover:text-foreground/70",
                    )}
                  >
                    {x.nombre}
                  </span>
                  <span
                    className={cn(
                      "block h-2 rounded-full transition-all",
                      i === idx ? "w-6 bg-accent" : "w-2 bg-foreground/25",
                    )}
                  />
                </button>
              </li>
            ))}
          </ol>
          <p className="absolute bottom-3 left-4 text-[11px] text-foreground/50 lg:left-8">
            Maqueta 3D ilustrativa · se ajusta a tu medida
          </p>
        </div>

        {/* texto */}
        <div
          ref={textRef}
          className="flex flex-1 flex-col justify-center px-5 py-5 sm:px-8 lg:order-1 lg:w-[42%] lg:flex-none lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-10"
        >
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-accent sm:mb-3 sm:text-sm">
            Escritorios a medida · {idx + 1}/{N}
          </p>
          <h2
            data-anim
            className="font-display text-4xl font-medium leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            {m.nombre}
          </h2>
          <p
            data-anim
            className="mt-3 max-w-md text-[15px] text-muted-foreground sm:mt-4 sm:text-lg"
          >
            {m.bajada}
          </p>
          <ul data-anim className="mt-3 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
            {m.specs.map((s) => (
              <li
                key={s}
                className="rounded-full border border-foreground/15 bg-background/60 px-3 py-1 text-[12.5px] text-foreground sm:text-sm"
              >
                {s}
              </li>
            ))}
          </ul>
          <div data-anim className="mt-4 flex flex-wrap items-center gap-3 sm:mt-7">
            <button
              type="button"
              onClick={() => abrirAsistente("Escritorio", { ...m.st })}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Armalo con tus medidas <ArrowRight className="size-4" />
            </button>
            {m.foto && (
              <figure className="hidden items-center gap-2.5 sm:flex">
                <img
                  src={m.foto.src}
                  alt={m.foto.alt}
                  width={56}
                  height={70}
                  loading="lazy"
                  className="h-[70px] w-14 rounded-lg object-cover"
                />
                <figcaption className="text-xs leading-snug text-muted-foreground">
                  Uno real,
                  <br />
                  ya entregado
                </figcaption>
              </figure>
            )}
          </div>
          <ol className="mt-12 hidden gap-x-6 gap-y-2 border-t border-foreground/10 pt-5 lg:flex lg:flex-wrap">
            {MODELOS.map((x, i) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => irA(i)}
                  aria-current={i === idx}
                  className={cn(
                    "text-sm transition-colors",
                    i === idx
                      ? "font-semibold text-foreground"
                      : "text-foreground/45 hover:text-foreground/80",
                  )}
                >
                  <span className="mr-1.5 tabular-nums text-accent">0{i + 1}</span>
                  {x.nombre}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
