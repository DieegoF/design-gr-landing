import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

const images = [
  {
    src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    alt: "Cocina moderna a medida",
    title: "Cocina integral",
  },
  {
    src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
    alt: "Placard con interior organizado",
    title: "Placard a medida",
  },
  {
    src: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&h=600&fit=crop",
    alt: "Escritorio de madera",
    title: "Escritorio de diseño",
  },
  {
    src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop",
    alt: "Mueble de baño",
    title: "Mueble de baño",
  },
  {
    src: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop",
    alt: "Mueble de living",
    title: "Mueble TV / Living",
  },
  {
    src: "https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=800&h=600&fit=crop",
    alt: "Detalle de carpintería en madera",
    title: "Detalle de acabado",
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
