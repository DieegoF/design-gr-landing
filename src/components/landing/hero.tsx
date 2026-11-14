import { Bath, BookOpen, CookingPot, DoorClosed, Store, Tv, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";
import { scrollToSection } from "@/lib/scroll";
import { TIPO_TO_KIND, useQuote } from "./quote-context";

const cats: { tipo: string; desc: string; icon: LucideIcon }[] = [
  { tipo: "Cocina", desc: "Bajo mesada y alacenas", icon: CookingPot },
  { tipo: "Placard / vestidor", desc: "Interiores a medida", icon: DoorClosed },
  { tipo: "Escritorio / biblioteca", desc: "Trabajo y estantes", icon: BookOpen },
  { tipo: "Mueble de baño", desc: "Vanitory y guardado", icon: Bath },
  { tipo: "Mueble TV / living", desc: "Racks y paneles", icon: Tv },
  { tipo: "Diseño integral", desc: "Ambiente o local", icon: Store },
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
    <section id="inicio" ref={ref} className="relative overflow-hidden bg-background px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className={cn("fade-in", isInView && "fade-in-visible")}>
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
            Carpintería a medida · La Plata, CABA y AMBA
          </p>
          <h1 className="font-display text-5xl font-medium tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            ¿Qué mueble <em className="text-accent">necesitás?</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Elegí uno, armalo en 3D con tus medidas y el material, y mandanos el pedido de
            presupuesto listo por WhatsApp.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {cats.map((c) => (
              <button
                key={c.tipo}
                type="button"
                onClick={() => pick(c.tipo)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition hover:-translate-y-0.5 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            {["Diseño, fabricación e instalación", "Melamina, laqueado o madera maciza", "Respondemos por WhatsApp"].map((t) => (
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
              alt="Mueble TV con panel de listones en madera"
              width={1200}
              height={800}
              className="size-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
