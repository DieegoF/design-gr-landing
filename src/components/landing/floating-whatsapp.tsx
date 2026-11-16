import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingWhatsApp() {
  // Se esconde mientras se ve el asistente, para no tapar el botón "Siguiente".
  const [oculto, setOculto] = useState(false);
  useEffect(() => {
    const el = document.getElementById("armalo-app");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOculto(e.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <a
      href="https://wa.me/541164321329"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-whatsapp text-primary-foreground shadow-lg transition-[transform,opacity] hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        oculto && "pointer-events-none scale-75 opacity-0",
      )}
      aria-label="Contactar por WhatsApp"
      aria-hidden={oculto || undefined}
      tabIndex={oculto ? -1 : undefined}
    >
      <MessageCircle className="size-7 fill-current" />
    </a>
  );
}
