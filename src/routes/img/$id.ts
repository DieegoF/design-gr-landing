import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { get } from "@vercel/blob";

/** Sirve la imagen del diseño 3D desde el Blob store privado (la usa la miniatura de WhatsApp). */
export const Route = createFileRoute("/img/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id.replace(/\.jpg$/, "");
        if (!/^(f-)?[a-z0-9]{6,16}$/.test(id))
          return new Response("No encontrado", { status: 404 });
        try {
          const r = await get(`d/${id}.jpg`, { access: "private" });
          if (!r || r.statusCode !== 200) return new Response("No encontrado", { status: 404 });
          return new Response(r.stream, {
            headers: {
              "Content-Type": "image/jpeg",
              "Content-Length": String(r.blob.size),
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        } catch (e) {
          console.error("Blob get falló", e);
          return new Response("Error", { status: 500 });
        }
      },
    },
  },
});
