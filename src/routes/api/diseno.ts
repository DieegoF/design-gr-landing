import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { put } from "@vercel/blob";
import { fichaSchema, type Ficha } from "@/lib/despiece";

const MAX_BYTES = 1_500_000;
const MAX_FICHA = 40_000;
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

/**
 * Recibe la imagen del configurador 3D y la guarda en Vercel Blob.
 * - JPEG crudo (fotos de referencia o diseño sin despiece).
 * - multipart/form-data con `img` (JPEG) y `ficha` (JSON del despiece estimado).
 */
export const Route = createFileRoute("/api/diseno")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Solo desde la propia landing
        const origin = request.headers.get("origin");
        if (origin && new URL(origin).host !== new URL(request.url).host) {
          return json({ error: "origen no permitido" }, 403);
        }
        const ct = request.headers.get("content-type") ?? "";
        let bytes: Uint8Array<ArrayBuffer>;
        let ficha: Ficha | null = null;
        if (ct.startsWith("multipart/form-data")) {
          const len = Number(request.headers.get("content-length") || 0);
          if (len > MAX_BYTES + MAX_FICHA + 4_000) return json({ error: "tamaño inválido" }, 413);
          let fd: FormData;
          try {
            fd = await request.formData();
          } catch {
            return json({ error: "formulario inválido" }, 400);
          }
          const img = fd.get("img");
          const txt = fd.get("ficha");
          if (!(img instanceof Blob)) return json({ error: "falta la imagen" }, 400);
          bytes = new Uint8Array(await img.arrayBuffer());
          if (typeof txt === "string" && txt.length <= MAX_FICHA) {
            try {
              const r = fichaSchema.safeParse(JSON.parse(txt));
              if (r.success) ficha = r.data;
            } catch {
              /* sin ficha: se guarda solo la imagen */
            }
          }
        } else if (ct.startsWith("image/jpeg")) {
          bytes = new Uint8Array(await request.arrayBuffer());
        } else {
          return json({ error: "se espera image/jpeg" }, 415);
        }

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
        if (ficha && !esFoto) {
          try {
            await put(`d/${id}.json`, JSON.stringify(ficha), {
              access: "private",
              contentType: "application/json",
              addRandomSuffix: false,
            });
          } catch (e) {
            // la imagen ya está: el link funciona igual, sin despiece
            console.error("Blob put (ficha) falló", e);
          }
        }
        return json({ id });
      },
    },
  },
});
