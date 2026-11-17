import { useEffect, useState } from "react";

/** Tiempo mínimo en pantalla (ms desde que arrancó la carga) para que la animación se lea. */
const MIN_MS = 1100;
const KEY = "dg-splash-visto";

/**
 * Pantalla de carga de la landing: el escritorio del favicon se "arma" pieza por pieza
 * (tapa, cajonera, columna, cajones) y el nombre aparece abajo con una barra dorada.
 *
 * - Viene en el HTML del servidor, así que se ve desde el primer pintado (antes de que cargue el JS).
 * - Se levanta cuando React termina de cargar y pasó el tiempo mínimo.
 * - Si el JS falla, el CSS la saca solo a los 2,4 s (ver `.splash` en styles.css).
 * - Solo la primera vez por sesión: el script de abajo marca `data-splash="skip"` antes de pintar.
 * - Con "reducir movimiento" no se muestra.
 */
export function Splash() {
  const [montado, setMontado] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.splash === "skip") {
      setMontado(false);
      return;
    }
    const espera = Math.max(0, MIN_MS - performance.now());
    const t1 = window.setTimeout(() => {
      html.dataset.splash = "done";
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* modo privado: no pasa nada */
      }
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
      <script
        // Corre mientras se lee el HTML, antes del primer pintado: evita el destello en visitas repetidas.
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("${KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.splash="skip"}catch(e){}`,
        }}
      />
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
            style={{ animationDelay: "0.75s" }}
          />
          <rect
            className="sp-cajon"
            x="5"
            y="13.4"
            width="7.6"
            height="1.1"
            style={{ animationDelay: "0.85s" }}
          />
          <rect
            className="sp-cajon"
            x="5"
            y="17.2"
            width="7.6"
            height="1.1"
            style={{ animationDelay: "0.95s" }}
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
