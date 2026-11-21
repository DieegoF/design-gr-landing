import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

const images: {
  src: string;
  alt: string;
  title: string;
  featured?: boolean;
}[] = [
  {
    src: "/images/gallery-escritorio.jpeg",
    alt: "Escritorio a medida en melamina blanca con cajonera de 4 cajones y columna con estantes",
    title: "Escritorio con cajonera y estantes",
    featured: true,
  },
  {
    src: "/images/gallery-1.jpeg",
    alt: "Placard a medida con puertas corredizas, trabajo de Design.gr",
    title: "Placard a medida",
  },
  {
    src: "/images/gallery-2.jpeg",
    alt: "Interior de vestidor a medida con cajonera",
    title: "Vestidor con cajonera",
  },
  {
    src: "/images/gallery-3.jpeg",
    alt: "Revestimiento decorativo a medida en listones de madera",
    title: "Revestimiento en listones",
  },
  {
    src: "/images/gallery-4.jpeg",
    alt: "Biblioteca y estantería a medida en madera",
    title: "Biblioteca / Estantería",
  },
  {
    src: "/images/gallery-5.jpeg",
    alt: "Diseño integral de mobiliario a medida para local comercial",
    title: "Diseño integral de local",
  },
  {
    src: "/images/gallery-6.jpeg",
    alt: "Mobiliario comercial a medida fabricado por Design.gr",
    title: "Mobiliario comercial",
  },
];

export function Gallery() {
  const { ref, isInView } = useInView();

  return (
    <section id="galeria" className="bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div ref={ref} className={cn("mb-10 fade-in", isInView && "fade-in-visible")}>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Trabajos realizados
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Muebles que ya hicimos
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Fotos reales de trabajos fabricados e instalados por Design.gr.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {images.map((image, index) =>
            image.featured ? (
              <div
                key={image.title}
                className={cn(
                  "col-span-2 grid overflow-hidden rounded-xl border-2 border-accent bg-card fade-in sm:grid-cols-2 lg:col-span-3",
                  isInView && "fade-in-visible",
                )}
              >
                <div className="overflow-hidden bg-muted">
                  <img
                    src={image.src}
                    alt={image.alt}
                    width={800}
                    height={1067}
                    className="aspect-[4/3] size-full object-cover transition-transform duration-500 hover:scale-105 sm:aspect-auto sm:max-h-[460px]"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col justify-center gap-3 p-5 sm:p-8">
                  <span className="w-fit rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Nuestra especialidad
                  </span>
                  <b className="font-display text-2xl font-medium text-foreground sm:text-3xl">
                    {image.title}
                  </b>
                  <p className="text-[15px] text-muted-foreground">
                    Melamina blanca, cajonera de 4 cajones a la izquierda y columna con estantes a
                    la derecha. Es el modelo que más nos piden.
                  </p>
                </div>
              </div>
            ) : (
              <div
                key={image.title}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card fade-in",
                  isInView && "fade-in-visible",
                )}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="overflow-hidden bg-muted">
                  <img
                    src={image.src}
                    alt={image.alt}
                    width={800}
                    height={600}
                    className="aspect-[4/5] size-full object-cover transition-transform duration-500 hover:scale-105 sm:aspect-[4/3]"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
                  <b className="text-[14.5px] font-semibold text-foreground">{image.title}</b>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
