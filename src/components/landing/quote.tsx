import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Camera,
  Check,
  Download,
  ImagePlus,
  Instagram,
  LoaderCircle,
  MapPin,
  MessageCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OTRO, TIPOS, WHATSAPP, armarMensaje, medidasTexto, useQuote } from "./quote-context";

const MATERIALES = ["Melamina", "Laqueado", "Madera maciza", "No sé, que me asesoren"];
const ZONAS = ["La Plata", "CABA", "AMBA (otra zona)"];
const PLAZOS = ["Lo antes posible", "En 1–2 meses", "Estoy averiguando"];

type Estado = "subiendo" | "listo" | "error";
type Subida = { img: string; estado: Estado; link: string };
type FotoRef = { id: number; preview: string; estado: Estado; link: string; p: Promise<string> };

const MAX_REFS = 3;

/** Sube un JPEG y devuelve el link corto (/d/xxxx) que va en el mensaje. */
async function subirImagen(blob: Blob, foto = false): Promise<string> {
  const r = await fetch(`/api/diseno${foto ? "?tipo=foto" : ""}`, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg" },
    body: blob,
  });
  if (!r.ok) throw new Error(`subida ${r.status}`);
  const { id } = (await r.json()) as { id: string };
  return `${window.location.origin}/d/${id}`;
}

async function subirDiseno(dataUrl: string): Promise<string> {
  return subirImagen(await (await fetch(dataUrl)).blob());
}

/** Achica la foto del celu (hasta 1600 px) y la pasa a JPEG para que suba rápido. */
async function aJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res, rej) =>
      c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/jpeg", 0.82),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

const conTimeout = <T,>(p: Promise<T>, ms: number, valor: T) =>
  Promise.race([p, new Promise<T>((res) => setTimeout(() => res(valor), ms))]);

function Chips({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? "" : o)}
          className={cn(
            "rounded-full border-[1.5px] px-3.5 py-2 text-sm font-medium transition-colors",
            value === o
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:border-primary/50",
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
  const [refs, setRefs] = useState<FotoRef[]>([]);
  const refId = useRef(0);

  const agregarRefs = (files: File[]) => {
    const nuevas = files.slice(0, Math.max(0, MAX_REFS - refs.length)).map((file) => {
      const id = ++refId.current;
      const fin = (estado: Estado, link = "") =>
        setRefs((rs) => rs.map((r) => (r.id === id ? { ...r, estado, link } : r)));
      const p = aJpeg(file)
        .then((b) => subirImagen(b, true))
        .then(
          (link) => {
            fin("listo", link);
            return link;
          },
          (err) => {
            console.error(err);
            fin("error");
            return "";
          },
        );
      return { id, preview: URL.createObjectURL(file), estado: "subiendo" as Estado, link: "", p };
    });
    setRefs((rs) => [...rs, ...nuevas]);
  };
  const quitarRef = (id: number) => setRefs((rs) => rs.filter((r) => r.id !== id));

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
  const esOtro = q.tipo === OTRO;
  const refLinks = esOtro ? refs.filter((r) => r.estado === "listo").map((r) => r.link) : [];
  const refAparte = esOtro ? refs.filter((r) => r.estado === "error").length : 0;
  const msg = armarMensaje(q, link, refLinks, refAparte);
  const tipoOk = !!q.tipo && (!esOtro || !!q.consulta.trim());
  const done = [tipoOk, !!medidasTexto(q), !!q.material, !!(q.zona && q.plazo), !!q.nombre.trim()];
  const n = done.filter(Boolean).length;
  const ok = tipoOk && !!q.nombre.trim();
  const waLink = (texto: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
  const waUrl = waLink(msg);

  const enviar = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (!ok) return e.preventDefault();
    const disenoPend = subida?.estado === "subiendo" && !!subidaRef.current;
    const refsActivas = esOtro ? refs : [];
    if (!disenoPend && !refsActivas.some((r) => r.estado === "subiendo")) return; // sigue el link wa.me
    // Hay imágenes subiendo: esperamos un toque y abrimos WhatsApp con los links.
    e.preventDefault();
    setEsperando(true);
    const res = await conTimeout(
      Promise.all([
        disenoPend ? subidaRef.current! : Promise.resolve(link),
        ...refsActivas.map((r) => (r.estado === "subiendo" ? r.p : Promise.resolve(r.link))),
      ]),
      10000,
      null,
    );
    setEsperando(false);
    const [l, ...rl] = res ?? [link, ...refsActivas.map((r) => r.link)];
    const listos = rl.filter(Boolean);
    window.location.href = waLink(armarMensaje(q, l, listos, refsActivas.length - listos.length));
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
                <i
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i < n ? "bg-accent" : "bg-border",
                  )}
                />
              ))}
            </div>
            <p className="mb-5 text-xs text-muted-foreground">{n} de 5 completas</p>

            <fieldset className="mb-5">
              <legend className="mb-2 font-semibold text-foreground">1. ¿Qué mueble?</legend>
              <Chips
                value={q.tipo}
                options={TIPOS}
                onChange={(v) => update({ tipo: v, ref: "", config: "", img: "" })}
              />
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
                    Para qué lo vas a usar, dónde va y cualquier idea que tengas.
                  </small>
                </label>
              )}
              {esOtro && (
                <div className="mt-3">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">
                    Fotos de referencia{" "}
                    <small className="font-normal text-muted-foreground">
                      (opcional, hasta {MAX_REFS})
                    </small>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {refs.map((r) => (
                      <div
                        key={r.id}
                        className="relative size-20 overflow-hidden rounded-xl border border-border"
                      >
                        <img
                          src={r.preview}
                          alt="Foto de referencia"
                          className="size-full object-cover"
                        />
                        <span
                          className={cn(
                            "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 py-0.5 text-[10.5px] font-semibold",
                            r.estado === "subiendo" && "bg-foreground/60 text-primary-foreground",
                            r.estado === "listo" && "bg-[#dcf8c6] text-[#16130F]",
                            r.estado === "error" && "bg-destructive text-white",
                          )}
                        >
                          {r.estado === "subiendo" && (
                            <LoaderCircle className="size-3 animate-spin" />
                          )}
                          {r.estado === "listo" && <Check className="size-3" />}
                          {r.estado === "subiendo"
                            ? "Subiendo"
                            : r.estado === "listo"
                              ? "Lista"
                              : "Va aparte"}
                        </span>
                        <button
                          type="button"
                          aria-label="Quitar foto"
                          onClick={() => quitarRef(r.id)}
                          className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 text-foreground shadow"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {refs.length < MAX_REFS && (
                      <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-accent/60 bg-background text-[11px] font-medium text-muted-foreground">
                        <ImagePlus className="size-6 text-accent" strokeWidth={1.6} />
                        Agregar
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            agregarRefs([...(e.target.files || [])]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <small className="mt-1 block text-xs text-muted-foreground">
                    Una foto de un mueble que te guste, un dibujo o el lugar donde va. Se envían
                    junto con tu mensaje.
                  </small>
                </div>
              )}
            </fieldset>

            <fieldset className="mb-5">
              <legend className="mb-2 font-semibold text-foreground">
                2. Medidas aproximadas{" "}
                <small className="font-normal text-muted-foreground">(en cm)</small>
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
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder={ph}
                      value={q[k]}
                      disabled={q.noMed}
                      onChange={(e) => update({ [k]: e.target.value })}
                      className="mt-1"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={q.noMed}
                  onChange={(e) => update({ noMed: e.target.checked })}
                />
                No sé las medidas, prefiero que vengan a medir
              </label>
            </fieldset>

            <fieldset className="mb-5">
              <legend className="mb-2 font-semibold text-foreground">3. Material</legend>
              <Chips
                value={q.material}
                options={MATERIALES}
                onChange={(v) => update({ material: v })}
              />
            </fieldset>

            <fieldset className="mb-5">
              <legend className="mb-2 font-semibold text-foreground">
                4. ¿Dónde es y para cuándo?
              </legend>
              <div className="mb-2">
                <Chips value={q.zona} options={ZONAS} onChange={(v) => update({ zona: v })} />
              </div>
              <Chips value={q.plazo} options={PLAZOS} onChange={(v) => update({ plazo: v })} />
            </fieldset>

            <label className="mb-5 block">
              <span className="mb-2 block font-semibold text-foreground">5. Tu nombre</span>
              <Input
                placeholder="Ej.: Laura"
                value={q.nombre}
                onChange={(e) => update({ nombre: e.target.value })}
              />
            </label>

            <div className={cn("mb-5", esOtro && "hidden")}>
              <span className="mb-2 block font-semibold text-foreground">
                Foto del espacio{" "}
                <small className="font-normal text-muted-foreground">(opcional, ayuda mucho)</small>
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
              <Textarea
                rows={2}
                placeholder="Ej.: con puertas corredizas y espejo"
                value={q.detalle}
                onChange={(e) => update({ detalle: e.target.value })}
              />
            </label>
          </form>

          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/60 bg-[#e9e2d6] p-3.5">
              <div className="mb-3 flex items-center gap-2.5 border-b border-black/10 pb-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">
                  D
                </span>
                <span>
                  <b className="block text-sm text-foreground">Design.gr</b>
                  <small className="text-xs text-muted-foreground">Así nos llega tu mensaje</small>
                </span>
              </div>
              {q.img && (
                <img
                  src={q.img}
                  alt="Tu diseño 3D"
                  className="mb-2 ml-auto block w-3/4 rounded-xl border-4 border-[#dcf8c6]"
                />
              )}
              <div className="ml-5 min-h-16 whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#dcf8c6] px-3 py-2.5 text-[13.5px] text-[#16130F] shadow-sm">
                {msg}
              </div>
            </div>

            <a
              href={ok ? waUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!ok}
              onClick={enviar}
              className={cn(
                "mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-base font-bold",
                ok
                  ? "bg-whatsapp text-[#073b1c]"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              <MessageCircle className="size-5 fill-current" />{" "}
              {esperando ? "Preparando la imagen…" : "Enviar por WhatsApp"}
            </a>
            {q.img && subida?.estado === "error" && (
              <button
                type="button"
                onClick={compartirImagen}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
              >
                <Download className="size-4" /> Guardar o compartir la imagen del 3D
              </button>
            )}
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {ok
                ? n < 5
                  ? "Podés enviarlo ya; cuanto más completes, más preciso el precio."
                  : "Listo para enviar."
                : esOtro
                  ? "Contanos qué mueble necesitás y completá tu nombre."
                  : "Completá el tipo de mueble y tu nombre."}
            </p>

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MessageCircle className="size-4 text-accent" />
                WhatsApp{" "}
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline"
                >
                  11-6432-1329
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Instagram className="size-4 text-accent" />
                <a
                  href="https://instagram.com/desing.gr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline"
                >
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
