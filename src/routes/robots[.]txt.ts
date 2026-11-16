import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/site";

// /d/ e /img/ quedan permitidos a propósito: el robot de WhatsApp los lee para la
// miniatura del mensaje, y /d/ ya lleva noindex para que Google no lo muestre.
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          [
            "User-agent: *",
            "Allow: /",
            "Disallow: /api/",
            "",
            `Sitemap: ${SITE_URL}/sitemap.xml`,
            "",
          ].join("\n"),
          {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          },
        ),
    },
  },
});
