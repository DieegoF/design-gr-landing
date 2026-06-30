import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { scrollToSection } from "@/lib/scroll";

export function Hero() {
  const { ref, isInView } = useInView();

  return (
    <section
      id="inicio"
      ref={ref}
      className="relative overflow-hidden bg-background px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className={cn("fade-in", isInView && "fade-in-visible")}>
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
              Carpintería de autor
            </p>
            <h1 className="font-display text-5xl font-medium tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Design.gr
            </h1>
            <p className="mt-6 text-xl text-muted-foreground sm:text-2xl">
              Muebles a medida | Diseño & Carpintería
            </p>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Cocinas, placards, vestidores, escritorios, bibliotecas y muebles de baño diseñados
              y fabricados con precisión para hogares en La Plata, CABA y AMBA.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2">
                <a href="https://wa.me/541164321329" target="_blank" rel="noopener noreferrer">
                  Pedí tu presupuesto <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" onClick={() => scrollToSection("galeria")}>
                Ver trabajos
              </Button>
            </div>
          </div>
          <div
            className={cn("fade-in", isInView && "fade-in-visible")}
            style={{ transitionDelay: "150ms" }}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop"
                alt="Cocina moderna a medida en madera"
                width={1200}
                height={800}
                className="size-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
