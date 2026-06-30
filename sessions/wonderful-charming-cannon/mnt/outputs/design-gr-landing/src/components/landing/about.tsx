import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

export function About() {
  const { ref, isInView } = useInView();

  return (
    <section id="nosotros" className="bg-secondary px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div
            ref={ref}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted fade-in",
              isInView && "fade-in-visible",
            )}
          >
            <img
              src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&h=800&fit=crop"
              alt="Taller de carpintería trabajando la madera"
              width={1200}
              height={800}
              className="size-full object-cover"
              loading="lazy"
            />
          </div>
          <div
            className={cn("fade-in", isInView && "fade-in-visible")}
            style={{ transitionDelay: "150ms" }}
          >
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              Sobre nosotros
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Experiencia, calidad y atención al detalle
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                En Design.gr combinamos años de experiencia en carpintería con un enfoque moderno
                de diseño. Cada mueble que fabricamos es el resultado de un trabajo artesanal
                cuidadoso, materiales de primera calidad y una escucha activa de lo que necesita cada
                cliente.
              </p>
              <p>
                Nos especializamos en muebles a medida para cocinas, dormitorios, baños, livings y
                espacios de trabajo. Desde La Plata, trabajamos en todo CABA y AMBA, llevando
                proyectos personalizados a cada hogar.
              </p>
              <p>
                Nuestro objetivo es simple: transformar tus espacios con muebles funcionales,
                duraderos y con diseño.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
