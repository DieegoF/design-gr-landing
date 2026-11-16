import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { head } from "@vercel/blob";
import { MessageCircle } from "lucide-react";
import { SITE_URL } from "@/lib/site";

const getDiseno = createServerFn({ method: "GET" })
  .validator((id: string) => {
    if (!/^(f-)?[a-z0-9]{6,16}$/.test(id)) throw new Error("id inválido");
    return id;
  })
  .handler(async ({ data: id }) => {
    try {
      await head(`d/${id}.jpg`);
      // El store es privado: la imagen sale por /img/<id>.jpg de esta misma web.
      const origin = getRequestUrl({ xForwardedHost: true }).origin;
      return { url: `${origin}/img/${id}.jpg`, foto: id.startsWith("f-") };
    } catch {
      return null;
    }
  });

const TXT = {
  diseno: {
    titulo: "Mi diseño 3D · Design.gr",
    desc: "Armado en el configurador de Design.gr para pedir presupuesto.",
    h1: "Diseño 3D",
    nota: "Maqueta ilustrativa armada en el configurador para pedir presupuesto.",
  },
  foto: {
    titulo: "Foto de referencia · Design.gr",
    desc: "Imagen enviada para consultar por un mueble a medida.",
    h1: "Foto de referencia",
    nota: "Imagen enviada por el cliente como referencia para su consulta.",
  },
};

/** Página que va en el mensaje de WhatsApp: su og:image es la miniatura del chat. */
export const Route = createFileRoute("/d/$id")({
  loader: async ({ params }) => {
    const d = await getDiseno({ data: params.id }).catch(() => null);
    if (!d) throw notFound();
    return d;
  },
  head: ({ loaderData, params }) => {
    const t = loaderData?.foto ? TXT.foto : TXT.diseno;
    return {
      meta: [
        { title: t.titulo },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: t.titulo },
        { property: "og:description", content: t.desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/d/${params.id}` },
        ...(loaderData
          ? [
              { property: "og:image", content: loaderData.url },
              { property: "og:image:type", content: "image/jpeg" },
              { name: "twitter:image", content: loaderData.url },
            ]
          : []),
      ],
    };
  },
  component: Diseno,
});

function Diseno() {
  const { url, foto } = Route.useLoaderData();
  const t = foto ? TXT.foto : TXT.diseno;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4 py-10">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">Design.gr</p>
      <h1 className="font-display text-3xl font-medium text-foreground">{t.h1}</h1>
      <img
        src={url}
        alt={t.h1}
        className="w-full max-w-2xl rounded-2xl border border-border/60 shadow-sm"
      />
      <p className="max-w-md text-center text-sm text-muted-foreground">{t.nota}</p>
      <a
        href="/#armalo"
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        <MessageCircle className="size-4" /> Armá el tuyo
      </a>
    </main>
  );
}
