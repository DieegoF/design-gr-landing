import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";
import { scrollToSection } from "@/lib/scroll";
import type { FurnitureKind, FurnitureState } from "@/lib/furniture3d";
import { useQuote } from "./quote-context";

const images: {
  src: string;
  alt: string;
  title: string;
  tipo: string;
  preset?: Partial<FurnitureState> & { k: FurnitureKind };
}[] = [
  { src: "/images/gallery-1.jpeg", alt: "Placard con puertas corredizas", title: "Placard a medida", tipo: "Placard / vestidor", preset: { k: "placard", W: 240, H: 260, D: 60, n: 4, m: "Melamina blanca" } },
  { src: "/images/gallery-2.jpeg", alt: "Interior de vestidor con cajonera", title: "Vestidor con cajonera", tipo: "Placard / vestidor", preset: { k: "placard", W: 300, H: 250, D: 60, n: 6, m: "Melamina roble" } },
  { src: "/images/gallery-3.jpeg", alt: "Biblioteca y estantería en madera", title: "Biblioteca / Estantería", tipo: "Biblioteca / estantería", preset: { k: "biblio", W: 220, H: 230, D: 35, n: 3, m: "Madera maciza nogal" } },
  { src: "/images/gallery-4.jpeg", alt: "Revestimiento decorativo en listones de madera", title: "Revestimiento en listones", tipo: "Mueble TV / living", preset: { k: "rack", W: 240, H: 250, D: 40, n: 3, m: "Melamina roble" } },
  { src: "/images/gallery-5.jpeg", alt: "Diseño integral de mobiliario comercial", title: "Diseño integral de local", tipo: "Diseño integral" },
  { src: "/images/gallery-6.jpeg", alt: "Mobiliario comercial a medida", title: "Mobiliario comercial", tipo: "Diseño integral" },
];

export function Gallery() {
  const { ref, isInView } = useInView();
  const { update, showIn3D } = useQuote();

  const pick = (img: (typeof images)[number]) => {
    update({ tipo: img.tipo, ref: img.title });
    if (img.preset) {
      const { k, ...rest } = img.preset;
      showIn3D(k, rest);
      scrollToSection("armalo");
    } else scrollToSection("presupuesto");
  };

  return (
    <section id="galeria" className="bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div ref={ref} className={cn("mb-10 fade-in", isInView && "fade-in-visible")}>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Trabajos realizados</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            ¿Te gusta alguno?
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Tocá “Quiero algo así” y lo ves en 3D con tus medidas, o arrancás el presupuesto con ese
            trabajo como referencia.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.title}
              className={cn("flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card fade-in", isInView && "fade-in-visible")}
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
                <button
                  type="button"
                  onClick={() => pick(image)}
                  className="mt-auto rounded-full border-[1.5px] border-primary px-3 py-2 text-[13.5px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  Quiero algo así
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
