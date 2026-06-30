import { Utensils, DoorOpen, BookOpen, Bath, Tv, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInView } from "@/hooks/use-in-view";

const services = [
  {
    icon: Utensils,
    title: "Cocinas",
    description:
      "Diseño y fabricación de muebles de cocina funcionales, con terminaciones en melamina, laqueado o madera maciza.",
  },
  {
    icon: DoorOpen,
    title: "Placards y Vestidores",
    description:
      "Optimizamos cada centímetro con interiores inteligentes, cajoneras, perchas y divisores a medida.",
  },
  {
    icon: BookOpen,
    title: "Escritorios y Bibliotecas",
    description:
      "Espacios de trabajo y estanterías personalizadas que se integran al estilo de tu hogar u oficina.",
  },
  {
    icon: Bath,
    title: "Muebles de Baño",
    description:
      "Vanitorys y guardado con materiales resistentes a la humedad y acabados de alta calidad.",
  },
  {
    icon: Tv,
    title: "Muebles TV / Living",
    description:
      "Rack, centros de entretenimiento y muebles de living con diseño minimalista y funcional.",
  },
  {
    icon: Compass,
    title: "Diseño Integral",
    description:
      "Acompañamiento desde la idea hasta la instalación: asesoramiento, renders y ejecución.",
  },
];

export function Services() {
  const { ref, isInView } = useInView();

  return (
    <section id="servicios" className="bg-secondary px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div
          ref={ref}
          className={cn("mb-12 max-w-2xl fade-in", isInView && "fade-in-visible")}
        >
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Servicios</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Soluciones en madera para cada espacio
          </h2>
          <p className="mt-4 text-muted-foreground">
            Desde el diseño hasta la instalación, creamos muebles a medida que se adaptan a tu
            estilo y necesidades.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Card
              key={service.title}
              className={cn(
                "fade-in border-border/60 bg-card transition-shadow hover:shadow-md",
                isInView && "fade-in-visible",
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="mb-3 inline-flex size-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <service.icon className="size-6" />
                </div>
                <CardTitle className="font-display text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
