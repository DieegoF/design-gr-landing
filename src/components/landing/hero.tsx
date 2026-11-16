import {
  Bath,
  BookOpen,
  CookingPot,
  DoorClosed,
  MessageSquarePlus,
  Monitor,
  Store,
  Tv,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";
import { scrollToSection } from "@/lib/scroll";
import { OTRO, TIPO_TO_KIND, useQuote } from "./quote-context";

const cats: { tipo: string; desc: string; icon: LucideIcon }[] = [
  { tipo: "Cocina", desc: "Bajo mesada y alacenas", icon: CookingPot },
  { tipo: "Placard / vestidor", desc: "Interiores a medida", icon: DoorClosed },
  { tipo: "Biblioteca / estantería", desc: "Estantes y guardado", icon: BookOpen },
  { tipo: "Mueble de baño", desc: "Vanitory y guardado", icon: Bath },
  { tipo: "Mueble TV / living", desc: "Racks y paneles", icon: Tv },
  { tipo: "Diseño integral", desc: "Ambiente o local", icon: Store },
  { tipo: OTRO, desc: "¿No está? Consultanos", icon: MessageSquarePlus },
];

export function Hero() {
  const { ref, isInView } = useInView();
  const { update, showIn3D } = useQuote();

  const pick = (tipo: string) => {
    update({ tipo, ref: "" });
    const k = TIPO_TO_KIND[tipo];
    if (k) {
      showIn3D(k);
      scrollToSection("armalo");
    } else scrollToSection("presupuesto");
  };

  return (
    <section
      id="inicio"
      ref={ref}
      className="relative overflow-hidden bg-background px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className={cn("fade-in", isInView && "fade-in-visible")}>
          <h1 className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
            Muebles y escritorios a medida en La Plata, CABA y AMBA
          </h1>
          <p className="font-display text-5xl font-medium tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            ¿Qué mueble <em className="text-accent">necesitás?</em>
          </p>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Elegí uno, armalo en 3D con tus medidas y el material, y mandanos el pedido de
            presupuesto listo por WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => pick("Escritorio")}
            className="mt-7 flex w-full items-center gap-4 rounded-2xl border-2 border-accent bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
          >
            <Monitor className="size-11 flex-none text-accent" strokeWidth={1.4} />
            <span className="min-w-0 flex-1">
              <span className="mb-1 inline-block rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                Nuestra especialidad
              </span>
              <b className="block font-display text-2xl font-medium text-foreground">
                Escritorios a medida
              </b>
              <small className="text-[13px] text-muted-foreground">
                Home office, estudio u oficina · con cajonera y repisas
              </small>
            </span>
            <span className="hidden flex-none rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:block">
              Armalo en 3D
            </span>
          </button>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {cats.map((c) => (
              <button
                key={c.tipo}
                type="button"
                onClick={() => pick(c.tipo)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition hover:-translate-y-0.5 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  c.tipo === OTRO && "col-span-2 border-dashed sm:col-span-3",
                )}
              >
                <c.icon className="size-8 flex-none text-accent" strokeWidth={1.5} />
                <span>
                  <b className="block text-[15px] font-semibold text-foreground">{c.tipo}</b>
                  <small className="text-[12.5px] text-muted-foreground">{c.desc}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {[
              "Diseño, fabricación e instalación",
              "Melamina 18 mm o MDF",
              "Respondemos por WhatsApp",
            ].map((t) => (
              <span key={t}>
                <span className="font-bold text-accent">✓ </span>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div
          className={cn("hidden fade-in lg:block", isInView && "fade-in-visible")}
          style={{ transitionDelay: "150ms" }}
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
            <img
              src="/images/hero.jpeg"
              alt="Mueble de TV a medida con panel de listones de madera, hecho por Design.gr en La Plata"
              width={1200}
              height={1600}
              fetchPriority="high"
              className="size-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
