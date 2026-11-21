import {
  ArrowRight,
  Boxes,
  DoorOpen,
  ListChecks,
  Ruler,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { scrollToSection } from "@/lib/scroll";
import { useQuote } from "./quote-context";

const PASOS = ["Mueble", "Tamaño", "Qué lleva", "Colores", "Zona", "Enviar"];

/**
 * Antes de los dos modos: explica la diferencia entre el asistente paso a paso
 * y el modo avanzado (sliders, cajones abiertos, pieza por pieza).
 */
export function Modos() {
  const { abrirAvanzado } = useQuote();

  const irPasoAPaso = () => scrollToSection("armalo");
  const irAvanzado = () => {
    abrirAvanzado("escritorio");
    setTimeout(() => scrollToSection("avanzado"), 120);
  };

  return (
    <section id="modos" className="scroll-mt-16 bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Pedí tu presupuesto
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Dos formas de armar tu mueble.{" "}
          <em className="font-display italic text-accent">Elegí la tuya.</em>
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Las dos te muestran el mueble en 3D y nos mandan el pedido completo por WhatsApp. Cambia
          cuánto querés decidir vos.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {/* Modo 1 */}
          <article className="relative flex flex-col rounded-3xl border-2 border-accent bg-card p-6 sm:p-8">
            <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
              Recomendado
            </span>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-accent">
                <ListChecks className="size-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Modo 1
                </p>
                <h3 className="font-display text-2xl font-medium text-foreground">Paso a paso</h3>
              </div>
            </div>
            <p className="mt-4 text-[17px] text-foreground">
              Te hacemos <b>6 preguntas cortas</b> y el mueble se va armando solo.
            </p>
            <ol className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PASOS.map((p, i) => (
                <li
                  key={p}
                  className="flex flex-col items-center gap-1 rounded-xl bg-secondary px-1 py-2 text-center"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-foreground text-[12px] font-bold text-background">
                    {i + 1}
                  </span>
                  <span className="text-[12px] font-medium leading-tight text-muted-foreground">
                    {p}
                  </span>
                </li>
              ))}
            </ol>
            <ul className="mt-5 space-y-2 text-[15px] text-muted-foreground">
              <li>• Elegís entre opciones: chico, mediano, grande</li>
              <li>• No hace falta saber medidas (te podemos ir a medir)</li>
              <li>• Listo en 1 minuto, cómodo desde el celu</li>
            </ul>
            <p className="mt-5 text-sm font-semibold text-foreground">
              Ideal si es la primera vez o no tenés las medidas.
            </p>
            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={irPasoAPaso}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[17px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Empezar paso a paso <ArrowRight className="size-5" />
              </button>
            </div>
          </article>

          {/* Modo 2 */}
          <article className="dark flex flex-col rounded-3xl border border-border bg-background p-6 text-foreground sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-accent">
                <SlidersHorizontal className="size-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Modo 2
                </p>
                <h3 className="font-display text-2xl font-medium">Modo avanzado</h3>
              </div>
            </div>
            <p className="mt-4 text-[17px]">
              <b>Ajustás todo vos, al centímetro</b>, con el mueble completo a la vista.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { i: Ruler, t: "Medidas al cm" },
                { i: DoorOpen, t: "Abrí cajones y puertas" },
                { i: Boxes, t: "Pieza por pieza" },
                { i: Sparkles, t: "Fotos de referencia" },
              ].map(({ i: Icon, t }) => (
                <div
                  key={t}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary px-2 py-2.5 text-center"
                >
                  <Icon className="size-5 text-accent" />
                  <span className="text-[12px] font-medium leading-tight text-muted-foreground">
                    {t}
                  </span>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-2 text-[15px] text-muted-foreground">
              <li>• Sliders de ancho, alto, profundidad, cajones y estantes</li>
              <li>• Mirás el interior y cómo se arma cada pieza</li>
              <li>• Formulario completo: foto del espacio y comentarios</li>
            </ul>
            <p className="mt-5 text-sm font-semibold">
              Ideal si ya tenés las medidas o un diseño en mente.
            </p>
            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={irAvanzado}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-accent px-5 text-[17px] font-bold text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Abrir modo avanzado <ArrowRight className="size-5" />
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
