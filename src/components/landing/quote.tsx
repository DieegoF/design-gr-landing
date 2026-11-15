import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Camera, Download, Instagram, MapPin, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OTRO, TIPOS, WHATSAPP, armarMensaje, medidasTexto, useQuote } from "./quote-context";

const MATERIALES = ["Melamina", "Laqueado", "Madera maciza", "No sé, que me asesoren"];
const ZONAS = ["La Plata", "CABA", "AMBA (otra zona)"];
const PLAZOS = ["Lo antes posible", "En 1–2 meses", "Estoy averiguando"];

type Subida = { img: string; estado: "subiendo" | "listo" | "error"; link: string };

/** Sube la imagen del 3D y devuelve el link corto (/d/xxxx) que va en el mensaje. */
async function subirDiseno(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const r = await fetch("/api/diseno", {
    method: "POST",
    headers: { "Content-Type": "image/jpeg" },
    body: blob,
  });
  if (!r.ok) throw new Error(`subida ${r.status}`);
  const { id } = (await r.json()) as { id: string };
  return `${window.location.origin}/d/${id}`;
}

const conTimeout = <T,>(p: Promise<T>, ms: number, valor: T) =>
  Promise.race([p, new Promise<T>((res) => setTimeout(() => res(valor), ms))]);

function Chips({ value, options, onChange }: { value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? "" : o)}
          className={cn(
            "rounded-full border-[1.5px] px-3.5 py-2 text-sm font-medium transition-colors",
            value === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/50",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Quote() {
  const { q, update } = useQuote();
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [subida, setSubida] = useState<Subida | null>(null);
  const [esperando, setEsperando] = useState(false);
  const subidaRef = useRef<Promise<string> | null>(null);

  // Apenas el cliente trae el diseño del 3D, se sube en segundo plano.
  useEffect(() => {
    if (!q.img) {
      setSubida(null);
      subidaRef.current = null;
      return;
    }
    let vivo = true;
    const img = q.img;
    setSubida({ img, estado: "subiendo", link: "" });
    subidaRef.current = subirDiseno(img).then(
      (link) => {
        if (vivo) setSubida({ img, estado: "listo", link });
        return link;
      },
      (err) => {
        console.error(err);
        if (vivo) setSubida({ img, estado: "error", link: "" });
        return "";
      },
    );
    return () => {
      vivo = false;
    };
  }, [q.img]);

  const link = subida?.estado === "listo" ? subida.link : "";
  const msg = useMemo(() => armarMensaje(q, link), [q, link]);
  const esOtro = q.tipo === OTRO;
  const tipoOk = !!q.tipo && (!esOtro || !!q.consulta.trim());
  const done = [tipoOk, !!medidasTexto(q), !!q.material, !!(q.zona && q.plazo), !!q.nombre.trim()];
  const n = done.filter(Boolean).length;
  const ok = tipoOk && !!q.nombre.trim();
  const waLink = (texto: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
  const waUrl = waLink(msg);

  const enviar = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (!ok) return e.preventDefault();
    if (subida?.estado !== "subiendo" || !subidaRef.current) return; // sigue el link wa.me
    // La imagen todavía se está subiendo: esperamos un toque y abrimos WhatsApp con el link.
    e.preventDefault();
    setEsperando(true);
    const l = await conTimeout(subidaRef.current, 8000, "");
    setEsperando(false);
    window.location.href = waLink(armarMensaje(q, l));
  };

  const compartirImagen = async () => {
    if (!q.img) return;
    try {
      const blob = await (await fetch(q.img)).blob();
      const file = new File([blob], "diseno-3d-design-gr.jpg", { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Mi diseño 3D" });
        return;
      }
    } catch {
      /* se descarga abajo */
    }
    const a = document.createElement("a");
    a.href = q.img;
    a.download = "diseno-3d-design-gr.jpg";
    a.click();
  };

  return (
    <section id="presupuesto" className="bg-secondary px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Presupuesto</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Tu presupuesto en 1 minuto
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Con estos datos te podemos pasar un precio estimado sin ir y venir de mensajes.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 rounded-3xl border border-border/60 bg-card p-5 sm:p-7 lg:grid-cols-[1.25fr_1fr] lg:items-start">
          <form onSubmit={(e) => e.preventDefault()} autoComplete="off" className="min-w-0">
            <div className="mb-1.5 flex gap-1.5">
              {done.map((_, i) => (
                <i key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < n ? "bg-accent" : "bg-border")} />
              ))}
            </div>
            <p className="mb-5 text-xs text-muted-foreground">{n} de 5 completas</p>

            <fieldset className="mb-5">
              <legend className="mb-2 font-semibold text-foreground">1. ¿Qué mueble?</legend>
              <Chips value={q.tipo} options={TIPOS} onChange={(v) => update({ tipo: v, ref: "", config: "", img: "" })} />
              {esOtro && (
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">
                    Contanos qué mueble necesitás
                  </span>
                  <Textarea
                    rows={4}
                    placeholder="Ej.: un mueble para la entrada con zapatero, perchero y espejo; va en un hueco de 120 cm."
                    value={q.consulta}
                    onChange={(e) => update({ consulta: e.target.value })}
                    className="border-accent/60"
                  />
                  <small className="mt-1 block text-xs text-muted-foreground">
                    Para qué lo vas a usar, dónde va y cualquier idea que tengas. Si tenés una foto de referencia, cargala abajo.
                  </small>
                </label>
              )}
            </fieldset>

            <fieldset className="mb-5">
              <legend className="mb-2 font-semibold text-foreground">
                2. Medidas aproximadas <small className="font-normal text-muted-foreground">(en cm)</small>
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["an", "Ancho", "240"],
                    ["al", "Alto", "260"],
                    ["pr", "Prof.", "60"],
                  ] as const
                ).map(([k, l, ph]) => (
                  <label key={k} className="text-xs text-muted-foreground">
                    {l}
                    <Input type="number" inputMode="numeric" placeholder={ph} value={q[k]} disabled={q.noMed} onChange={(e) => update({ [k]: e.target.value })} className="mt-1" />
                  </label>
                ))}
              </div>
              <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={q.noMed} onChange={(e) => update({ noMed: e.target.checked })} />
                No sé las medidas, prefiero que vengan a medir
              </label>
            </fieldset>

            <fieldset className="mb-5">
              <legend className="mb-2 font-semibold text-foreground">3. Material</legend>
              <Chips value={q.material} options={MATERIALES} onChange={(v) => update({ material: v })} />
            </fieldset>

            <fieldset className="mb-5">
              <legend className="mb-2 font-semibold text-foreground">4. ¿Dónde es y para cuándo?</legend>
              <div className="mb-2">
                <Chips value={q.zona} options={ZONAS} onChange={(v) => update({ zona: v })} />
              </div>
              <Chips value={q.plazo} options={PLAZOS} onChange={(v) => update({ plazo: v })} />
            </fieldset>

            <label className="mb-5 block">
              <span className="mb-2 block font-semibold text-foreground">5. Tu nombre</span>
              <Input placeholder="Ej.: Laura" value={q.nombre} onChange={(e) => update({ nombre: e.target.value })} />
            </label>

            <div className="mb-5">
              <span className="mb-2 block font-semibold text-foreground">
                Foto del espacio <small className="font-normal text-muted-foreground">(opcional, ayuda mucho)</small>
              </span>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-dashed border-accent/60 bg-background p-3.5">
                <Camera className="size-7 flex-none text-accent" strokeWidth={1.6} />
                <span className="text-sm text-foreground">
                  Elegí una foto de la pared o el ambiente
                  <small className="block text-xs text-muted-foreground">
                    La mandás en el chat de WhatsApp después del mensaje
                  </small>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const fs = [...(e.target.files || [])];
                    setThumbs(fs.slice(0, 4).map((f) => URL.createObjectURL(f)));
                    update({ fotos: fs.length });
                  }}
                />
              </label>
              {thumbs.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {thumbs.map((t) => (
                    <img key={t} src={t} alt="" className="size-14 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>

            <label className="block">
              <span className="mb-2 block font-semibold text-foreground">
                Algo más <small className="font-normal text-muted-foreground">(opcional)</small>
              </span>
              <Textarea rows={2} placeholder="Ej.: con puertas corredizas y espejo" value={q.detalle} onChange={(e) => update({ detalle: e.target.value })} />
            </label>
          </form>

          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/60 bg-[#e9e2d6] p-3.5">
              <div className="mb-3 flex items-center gap-2.5 border-b border-black/10 pb-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">D</span>
                <span>
                  <b className="block text-sm text-foreground">Design.gr</b>
                  <small className="text-xs text-muted-foreground">Así nos llega tu mensaje</small>
                </span>
              </div>
              {q.img && <img src={q.img} alt="Tu diseño 3D" className="mb-2 ml-auto block w-3/4 rounded-xl border-4 border-[#dcf8c6]" />}
              <div className="ml-5 min-h-16 whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#dcf8c6] px-3 py-2.5 text-[13.5px] text-[#16130F] shadow-sm">{msg}</div>
            </div>

            <a
              href={ok ? waUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!ok}
              onClick={enviar}
              className={cn(
                "mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-base font-bold",
                ok ? "bg-whatsapp text-[#073b1c]" : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              <MessageCircle className="size-5 fill-current" />{" "}
              {esperando ? "Preparando la imagen…" : "Enviar por WhatsApp"}
            </a>
            {q.img && subida?.estado === "error" && (
              <button type="button" onClick={compartirImagen} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
                <Download className="size-4" /> Guardar o compartir la imagen del 3D
              </button>
            )}
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {ok ? (n < 5 ? "Podés enviarlo ya; cuanto más completes, más preciso el precio." : "Listo para enviar.") : esOtro ? "Contanos qué mueble necesitás y completá tu nombre." : "Completá el tipo de mueble y tu nombre."}
            </p>

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MessageCircle className="size-4 text-accent" />
                WhatsApp{" "}
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
                  11-6432-1329
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Instagram className="size-4 text-accent" />
                <a href="https://instagram.com/desing.gr" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
                  @desing.gr
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-accent" /> La Plata · CABA · AMBA
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
