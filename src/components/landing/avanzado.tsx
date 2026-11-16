import { Configurator } from "./configurator";
import { Quote } from "./quote";
import { useQuote } from "./quote-context";

/** Configurador con sliders y formulario completo: solo aparecen si el cliente los pide. */
export function Avanzado() {
  const { avanzado } = useQuote();
  if (!avanzado) return null;
  return (
    <>
      <Configurator />
      <Quote />
    </>
  );
}
