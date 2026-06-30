import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

const images = [
  {
    src: "/images/gallery-1.jpeg",
    alt: "Placard con puertas corredizas",
    title: "Placard a medida",
  },
  {
    src: "/images/gallery-2.jpeg",
    alt: "Interior de vestidor con cajonera",
    title: "Vestidor con cajonera",
  },
  {
    src: "/images/gallery-3.jpeg",
    alt: "Biblioteca y estantería en madera",
    title: "Biblioteca / Estantería",
  },
  {
    src: "/images/gallery-4.jpeg",
    alt: "Revestimiento decorativo en listones de madera",
    title: "Revestimiento en listones",
  },
  {
    src: "/images/gallery-5.jpeg",
    alt: "Diseño integral de mobiliario comercial",
    title: "Diseño integral de local",
  },
  {
    src: "/images/gallery-6.jpeg",
    alt: "Mobiliario comercial a medida",
    title: "Mobiliario comercial",
  },
];

export function Gallery() {
  const { ref, isInView } = useInView();

  return (
    <section id="galeria" className="bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div
          ref={ref}
          className={cn("mb-12 text-center fade-in", isInView && "fade-in-visible")}
        >
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Galería</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Trabajos realizados
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Cada proyecto es único. Estos son algunos ejemplos de muebles a medida que diseñamos y
            fabricamos.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.title}
              className={cn(
                "group relative overflow-hidden rounded-xl bg-muted fade-in",
                isInView && "fade-in-visible",
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <img
                src={image.src}
                alt={image.alt}
                width={800}
                height={600}
                className="aspect-[4/3] size-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/60 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="font-display text-lg font-medium text-primary-foreground">
                  {image.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
