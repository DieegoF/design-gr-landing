import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { get, head } from "@vercel/blob";
import { useState } from "react";
import { Download, LoaderCircle, MessageCircle } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import {
  DESPERDICIO,
  PLACA_MM,
  cantosFicha,
  entraEnPlaca,
  fichaSchema,
  textoOrigen,
  type Ficha,
} from "@/lib/despiece";

/** Despiece guardado junto con la imagen (los diseños viejos no lo tienen). */
async function leerFicha(id: string): Promise<Ficha | null> {
  try {
    const r = await get(`d/${id}.json`, { access: "private" });
    if (!r || r.statusCode !== 200) return null;
    const p = fichaSchema.safeParse(JSON.parse(await new Response(r.stream).text()));
    return p.success ? p.data : null;
  } catch {
    return null;
  }
}

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
      const foto = id.startsWith("f-");
      return { url: `${origin}/img/${id}.jpg`, foto, ficha: foto ? null : await leerFicha(id) };
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
  const { url, foto, ficha } = Route.useLoaderData();
  const { id } = Route.useParams();
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
      {ficha && <FichaTaller f={ficha} img={url} id={id} />}
      <a
        href="/#armalo"
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        <MessageCircle className="size-4" /> Armá el tuyo
      </a>
    </main>
  );
}

const mmTxt = (n: number) => n.toLocaleString("es-AR");

/** Despiece estimado para el taller: piezas, placas, cantos y herrajes. */
function FichaTaller({ f, img, id }: { f: Ficha; img: string; id: string }) {
  const total = f.piezas.reduce((s, p) => s + p.cant, 0);
  const [generando, setGenerando] = useState(false);
  const descargar = async () => {
    setGenerando(true);
    try {
      const { descargarDespiecePdf } = await import("@/lib/despiece-pdf");
      await descargarDespiecePdf(f, img, id);
    } catch (e) {
      console.error(e);
      alert("No se pudo generar el PDF. Probá de nuevo.");
    } finally {
      setGenerando(false);
    }
  };
  const grandes = f.piezas.some((p) => !entraEnPlaca(p));
  return (
    <section className="w-full max-w-3xl rounded-2xl border border-border/60 bg-card p-5 text-sm text-foreground sm:p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">Para el taller</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-medium">Despiece estimado</h2>
        <button
          type="button"
          onClick={descargar}
          disabled={generando}
          className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-60"
        >
          {generando ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {generando ? "Generando…" : "Descargar PDF"}
        </button>
      </div>
      <p className="mt-2 text-muted-foreground">
        <b className="text-foreground">{f.mueble}</b>: {f.config}
      </p>
      {f.origen && (
        <p
          className={
            f.origen === "taller"
              ? "mt-2 w-fit rounded-full bg-[#dcf8c6] px-2.5 py-0.5 text-xs font-medium text-[#16130F]"
              : "mt-2 w-fit rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-foreground"
          }
        >
          {textoOrigen(f)}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [String(total), "piezas"],
          ...f.placas
            .filter((p) => p.esp >= 15)
            .map((p) => [
              String(p.placas),
              `${p.placas === 1 ? "placa" : "placas"} · ${p.material}`,
            ]),
          ...cantosFicha(f).map((c) => [
            `${c.m.toLocaleString("es-AR")} m`,
            c.tipo ? `de canto ${c.tipo}` : "de canto",
          ]),
        ].map(([n, l]) => (
          <div key={l} className="rounded-xl bg-secondary px-3 py-2">
            <b className="block text-lg tabular-nums">{n}</b>
            <span className="text-xs text-muted-foreground">{l}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-2 font-medium">Cant.</th>
              <th className="py-2 pr-2 font-medium">Pieza</th>
              <th className="py-2 pr-2 text-right font-medium">Largo</th>
              <th className="py-2 pr-2 text-right font-medium">Ancho</th>
              <th className="py-2 pr-2 text-right font-medium">Esp.</th>
              <th className="py-2 font-medium">Material</th>
            </tr>
          </thead>
          <tbody>
            {f.piezas.map((p, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-1.5 pr-2 font-semibold tabular-nums">{p.cant}</td>
                <td className="py-1.5 pr-2">
                  {p.pieza}
                  {!entraEnPlaca(p) && (
                    <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 py-px text-[11px] font-medium text-accent-foreground">
                      va en 2 o más partes
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{mmTxt(p.largo)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{mmTxt(p.ancho)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{p.esp}</td>
                <td className="py-1.5 text-muted-foreground">{p.material}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-1.5 font-semibold">Placas</h3>
          <ul className="space-y-1 text-muted-foreground">
            {f.placas.map((p) => (
              <li key={`${p.material}${p.esp}`}>
                <b className="text-foreground">{p.placas}</b> × {p.material} {p.esp} mm ·{" "}
                {p.m2.toLocaleString("es-AR")} m²
              </li>
            ))}
          </ul>
        </div>
        {f.herrajes.length > 0 && (
          <div>
            <h3 className="mb-1.5 font-semibold">Herrajes</h3>
            <ul className="space-y-1 text-muted-foreground">
              {f.herrajes.map((h) => (
                <li key={h.nombre}>
                  <b className="text-foreground">{h.cant}</b> × {h.nombre}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Medidas en mm. Es una estimación para cotizar: las medidas finales se confirman al medir.
        Placas de {mmTxt(PLACA_MM.largo)} × {mmTxt(PLACA_MM.ancho)} mm con un{" "}
        {Math.round(DESPERDICIO * 100)}% de desperdicio. Canto de 2 mm en frentes y tapa (4 lados),
        de 0,4 mm en el lado visible del resto. No incluye mesada, bacha, electrodomésticos ni
        tornillería.
        {grandes && " Las piezas marcadas son más grandes que una placa: se arman en partes."}
      </p>
    </section>
  );
}
