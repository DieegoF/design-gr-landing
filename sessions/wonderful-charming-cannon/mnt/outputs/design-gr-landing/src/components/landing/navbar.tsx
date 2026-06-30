import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/scroll";

const navLinks = [
  { label: "Servicios", id: "servicios" },
  { label: "Galería", id: "galeria" },
  { label: "Nosotros", id: "nosotros" },
  { label: "Contacto", id: "contacto" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: string) => {
    scrollToSection(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="font-display text-xl font-semibold tracking-tight text-foreground"
        >
          Design.gr
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </button>
          ))}
          <Button asChild size="sm">
            <a href="https://wa.me/541164321329" target="_blank" rel="noopener noreferrer">
              Pedí tu presupuesto
            </a>
          </Button>
        </nav>

        <button
          className="inline-flex items-center justify-center md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/40 bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className="text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
            <Button asChild className="w-full">
              <a href="https://wa.me/541164321329" target="_blank" rel="noopener noreferrer">
                Pedí tu presupuesto
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
