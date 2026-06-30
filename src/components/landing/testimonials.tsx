import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useInView } from "@/hooks/use-in-view";

const testimonials = [
  {
    name: "Mariana G.",
    role: "Casa en La Plata",
    text: "La cocina quedó exactamente como la imaginamos. Excelente atención, materiales de calidad y cumplimiento de plazos.",
  },
  {
    name: "Juan P.",
    role: "Departamento en CABA",
    text: "Hicieron un vestidor a medida que optimizó todo el espacio. El diseño y la terminación son impecables.",
  },
  {
    name: "Lucía R.",
    role: "Casa en Quilmes",
    text: "Muy profesionales. Desde el primer contacto entendieron lo que buscábamos y el resultado superó nuestras expectativas.",
  },
  {
    name: "Martín S.",
    role: "Oficina en La Plata",
    text: "El escritorio y la biblioteca para la oficina quedaron perfectos. Diseño limpio y funcional. Los recomiendo.",
  },
];

export function Testimonials() {
  const { ref, isInView } = useInView();

  return (
    <section className="bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div
          ref={ref}
          className={cn("mb-12 text-center fade-in", isInView && "fade-in-visible")}
        >
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Testimonios</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.name}
              className={cn(
                "fade-in border-border/60 bg-card",
                isInView && "fade-in-visible",
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="mb-4 flex gap-0.5 text-accent">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm italic text-muted-foreground">"{testimonial.text}"</p>
                <div className="mt-4">
                  <p className="font-medium text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
