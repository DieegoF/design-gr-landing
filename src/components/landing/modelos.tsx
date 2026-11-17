import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";
import { ESCRITORIO_DEF, ajustarEscritorio, type FurnitureState } from "@/lib/furniture3d";
import { useQuote } from "./quote-context";

// Modelos de escritorio para elegir de un vistazo. Pensado para gente grande:
// scroll normal, letra grande, una sola acción por tarjeta.
// Las imágenes de maqueta salen del mismo 3D del asistente (public/images/modelos).

interface Modelo {
  id: string;
  nombre: string;
  bajada: string;
  medida: string;
  img: string;
  alt: string;
  foto: boolean;
  st: FurnitureState;
}

const base = { k: "escritorio", ...ESCRITORIO_DEF } as FurnitureState;
const st = (p: Partial<FurnitureState>) => ajustarEscritorio({ ...base, ...p });

const MODELOS: Modelo[] = [
  {
    id: "clasico",
    nombre: "El más pedido",
    bajada: "Cajones de un lado y estantes del otro. En blanco.",
    medida: "1,30 m de ancho",
    img: "/images/escritorio-1.jpeg",
    alt: "Escritorio a medida en melamina blanca con cajonera de 4 cajones y columna con estantes, hecho por Design.gr",
    foto: true,
    st: st({}),
  },
  {
    id: "home-office",
    nombre: "Con repisas",
    bajada: "Cajones de un lado y dos repisas en la pared. Tapa color madera.",
    medida: "1,50 m de ancho",
    img: "/images/modelos/home-office.webp",
    alt: "Maqueta de escritorio blanco con tapa de roble, cajonera de 3 cajones y dos repisas en la pared",
    foto: false,
    st: st({ W: 150, D: 55, n: 3, izq: "cajonera", der: "pata", mt: "Melamina roble", r: 2 }),
  },
  {
    id: "doble-cajonera",
    nombre: "Cajones de los dos lados",
    bajada: "Mucho guardado y lugar de sobra en el medio.",
    medida: "1,80 m de ancho",
    img: "/images/modelos/doble-cajonera.webp",
    alt: "Maqueta de escritorio gris oscuro con tapa nogal y una cajonera de 4 cajones a cada lado",
    foto: false,
    st: st({
      W: 180,
      D: 60,
      n: 4,
      izq: "cajonera",
      der: "cajonera",
      m: "Melamina gris grafito",
      mt: "Melamina nogal",
    }),
  },
  {
    id: "compacto",
    nombre: "Para un rincón",
    bajada: "Ocupa poco lugar. Con estantes al costado.",
    medida: "1 m de ancho",
    img: "/images/modelos/compacto.webp",
    alt: "Maqueta de escritorio chico color roble con columna de estantes",
    foto: false,
    st: st({ W: 100, n: 2, e: 2, izq: "estantes", der: "pata", m: "Melamina roble", mt: "" }),
  },
];

export function Modelos() {
  const { ref, isInView } = useInView();
  const { abrirAsistente } = useQuote();

  return (
    <section id="escritorios" className="bg-secondary px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div ref={ref} className={cn("mb-8 fade-in", isInView && "fade-in-visible")}>
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            ¿Qué escritorio te gusta?
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Elegí el que más se parezca a lo que buscás. Después lo hacemos a tu medida y en el
            color que quieras.
          </p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MODELOS.map((m, i) => (
            <li
              key={m.id}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border border-border bg-card fade-in",
                isInView && "fade-in-visible",
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="relative bg-[#efe8de]">
                <img
                  src={m.img}
                  alt={m.alt}
                  width={960}
                  height={720}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground">
                  {m.foto ? "Foto real" : "Dibujo de ejemplo"}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-2xl font-medium text-foreground">{m.nombre}</h3>
                <p className="mt-2 text-[17px] leading-snug text-muted-foreground">{m.bajada}</p>
                <p className="mt-2 text-[17px] font-semibold text-foreground">{m.medida}</p>
                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    onClick={() => abrirAsistente("Escritorio", { ...m.st })}
                    className="min-h-14 w-full rounded-xl bg-primary px-5 text-lg font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                    aria-label={`Quiero este: ${m.nombre}`}
                  >
                    Quiero este
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-[17px] text-muted-foreground">
          ¿No es ninguno?{" "}
          <button
            type="button"
            onClick={() => abrirAsistente("Escritorio")}
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Armalo desde cero
          </button>
        </p>
      </div>
    </section>
  );
}
