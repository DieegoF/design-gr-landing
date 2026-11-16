/**
 * URL pública del sitio, sin barra final. Se usa para canonical, sitemap, robots y datos
 * estructurados (Google exige URLs absolutas). Si Design.gr pasa a tener dominio propio,
 * definir VITE_SITE_URL en Vercel y volver a desplegar.
 */
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) || "https://designgr.diegodev.com.ar"
).replace(/\/+$/, "");

export const SITE_NAME = "Design.gr";
export const SITE_TITLE = "Muebles y escritorios a medida en La Plata, CABA y AMBA | Design.gr";
export const SITE_DESCRIPTION =
  "Carpintería de muebles a medida en La Plata: escritorios, cocinas, placards, vestidores, bibliotecas y muebles de baño. Diseño, fabricación e instalación en CABA y AMBA. Armá tu mueble en 3D y pedí presupuesto por WhatsApp.";
export const OG_IMAGE = `${SITE_URL}/images/og-image.jpg`;
export const PHONE = "+541164321329";
export const INSTAGRAM = "https://instagram.com/desing.gr";
