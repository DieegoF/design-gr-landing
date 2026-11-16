import type { Ficha } from "@/lib/despiece";

/**
 * Sube un JPEG y devuelve el link corto (/d/xxxx) que va en el mensaje.
 * Si viene `ficha` (despiece del 3D), se manda junto con la imagen en un formulario.
 */
export async function subirImagen(blob: Blob, foto = false, ficha?: Ficha | null): Promise<string> {
  let body: BodyInit = blob;
  const headers: HeadersInit = {};
  if (ficha) {
    const fd = new FormData();
    fd.append("img", new File([blob], "diseno.jpg", { type: "image/jpeg" }));
    fd.append("ficha", JSON.stringify(ficha));
    body = fd;
  } else headers["Content-Type"] = "image/jpeg";
  const r = await fetch(`/api/diseno${foto ? "?tipo=foto" : ""}`, {
    method: "POST",
    headers,
    body,
  });
  if (!r.ok) throw new Error(`subida ${r.status}`);
  const { id } = (await r.json()) as { id: string };
  return `${window.location.origin}/d/${id}`;
}

export async function subirDiseno(dataUrl: string, ficha: Ficha | null): Promise<string> {
  return subirImagen(await (await fetch(dataUrl)).blob(), false, ficha);
}

/** Achica la foto del celu (hasta 1600 px) y la pasa a JPEG para que suba rápido. */
export async function aJpeg(file: File): Promise<Blob> {
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

export const conTimeout = <T>(p: Promise<T>, ms: number, valor: T) =>
  Promise.race([p, new Promise<T>((res) => setTimeout(() => res(valor), ms))]);

/** Comparte (celu) o descarga (compu) la imagen del diseño cuando no se pudo subir. */
export async function compartirImagen(dataUrl: string) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "diseno-3d-design-gr.jpg", { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Mi diseño 3D" });
      return;
    }
  } catch {
    /* se descarga abajo */
  }
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "diseno-3d-design-gr.jpg";
  a.click();
}
