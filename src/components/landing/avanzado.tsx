import { Configurator } from "./configurator";
import { Quote } from "./quote";
import { useQuote } from "./quote-context";

/**
 * Modo 2: configurador con sliders y formulario completo. Solo aparece si el cliente lo pide,
 * y va en oscuro para que no se confunda con el paso a paso.
 */
export function Avanzado() {
  const { avanzado } = useQuote();
  if (!avanzado) return null;
  return (
    <div className="dark border-t-4 border-accent bg-background text-foreground">
      <Configurator />
      <Quote />
    </div>
  );
}
