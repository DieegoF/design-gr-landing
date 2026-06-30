import { Instagram, Phone } from "lucide-react";
import { scrollToSection } from "@/lib/scroll";

const footerLinks = [
  { label: "Servicios", id: "servicios" },
  { label: "Galería", id: "galeria" },
  { label: "Nosotros", id: "nosotros" },
  { label: "Contacto", id: "contacto" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-display text-xl font-semibold text-foreground"
          >
            Design.gr
          </a>
          <nav className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/541164321329"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="WhatsApp"
            >
              <Phone className="size-5" />
            </a>
            <a
              href="https://instagram.com/desing.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Instagram"
            >
              <Instagram className="size-5" />
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Design.gr. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
