import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { put } from "@vercel/blob";

const MAX_BYTES = 1_500_000;
const ALFABETO = "abcdefghijkmnpqrstuvwxyz23456789";

function nuevoId(largo = 8) {
  const r = crypto.getRandomValues(new Uint8Array(largo));
  return Array.from(r, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/** Recibe la imagen del configurador 3D (JPEG crudo) y la guarda en Vercel Blob. */
export const Route = createFileRoute("/api/diseno")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Solo desde la propia landing
        const origin = request.headers.get("origin");
        if (origin && new URL(origin).host !== new URL(request.url).host) {
          return json({ error: "origen no permitido" }, 403);
        }
        if (!request.headers.get("content-type")?.startsWith("image/jpeg")) {
          return json({ error: "se espera image/jpeg" }, 415);
        }

        const bytes = new Uint8Array(await request.arrayBuffer());
        if (bytes.length === 0 || bytes.length > MAX_BYTES) {
          return json({ error: "tamaño inválido" }, 413);
        }
        // Firma JPEG (FF D8 FF)
        if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
          return json({ error: "no es un JPEG" }, 415);
        }

        // ?tipo=foto → foto de referencia que sube el cliente (id con prefijo "f-")
        const esFoto = new URL(request.url).searchParams.get("tipo") === "foto";
        const id = (esFoto ? "f-" : "") + nuevoId();
        try {
          await put(`d/${id}.jpg`, new Blob([bytes], { type: "image/jpeg" }), {
            access: "private",
            contentType: "image/jpeg",
            addRandomSuffix: false,
            cacheControlMaxAge: 60 * 60 * 24 * 365,
          });
        } catch (e) {
          console.error("Blob put falló", e);
          return json({ error: "no se pudo guardar" }, 500);
        }
        return json({ id });
      },
    },
  },
});
