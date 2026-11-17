import { useEffect, useState } from "react";

/** Tiempo mínimo en pantalla (ms desde que arrancó la carga) para que la animación se lea. */
const MIN_MS = 2600;

/**
 * Pantalla de carga de la landing: el escritorio del favicon se "arma" pieza por pieza
 * (tapa, cajonera, columna, cajones) y el nombre aparece abajo con una barra dorada.
 *
 * - Viene en el HTML del servidor, así que se ve desde el primer pintado (antes de que cargue el JS).
 * - Se levanta cuando React termina de cargar y pasó el tiempo mínimo.
 * - Si el JS falla, el CSS la saca solo a los 4,5 s (ver `.splash` en styles.css).
 * - Sale en todas las cargas (a pedido de Design.gr), también con "reducir movimiento"
 *   (ahí aparece quieta, sin el armado).
 */
export function Splash() {
  const [montado, setMontado] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    const espera = Math.max(0, MIN_MS - performance.now());
    const t1 = window.setTimeout(() => {
      html.dataset.splash = "done";
    }, espera);
    const t2 = window.setTimeout(() => setMontado(false), espera + 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (!montado) return null;

  return (
    <>
      <div className="splash" role="status" aria-label="Cargando Design.gr">
        <svg className="splash-mueble" viewBox="0 0 32 22" aria-hidden="true">
          <rect className="sp-tapa" x="2" y="2" width="28" height="3.4" rx="1" />
          <rect className="sp-cajonera" x="3.6" y="5.4" width="10.4" height="15" rx="0.8" />
          <rect className="sp-columna" x="26.6" y="5.4" width="2.8" height="15" rx="0.8" />
          <rect
            className="sp-cajon"
            x="5"
            y="9.4"
            width="7.6"
            height="1.1"
            style={{ animationDelay: "1.3s" }}
          />
          <rect
            className="sp-cajon"
            x="5"
            y="13.4"
            width="7.6"
            height="1.1"
            style={{ animationDelay: "1.45s" }}
          />
          <rect
            className="sp-cajon"
            x="5"
            y="17.2"
            width="7.6"
            height="1.1"
            style={{ animationDelay: "1.6s" }}
          />
        </svg>
        <p className="splash-marca">
          Design<em>.gr</em>
        </p>
        <span className="splash-barra" />
      </div>
    </>
  );
}
