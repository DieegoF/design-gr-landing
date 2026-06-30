import { useState } from "react";
import { Phone, Instagram, MapPin, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useInView } from "@/hooks/use-in-view";

export function Contact() {
  const { ref, isInView } = useInView();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hola, soy ${form.name}. ${form.message} (Tel: ${form.phone})`;
    window.open(
      `https://wa.me/541164321329?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <section id="contacto" className="bg-secondary px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div
          ref={ref}
          className={cn("mb-12 text-center fade-in", isInView && "fade-in-visible")}
        >
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Contacto</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Hablemos de tu proyecto
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Escribinos por WhatsApp o completá el formulario. Respondemos en La Plata, CABA y todo
            el AMBA.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div
            className={cn("space-y-6 fade-in", isInView && "fade-in-visible")}
            style={{ transitionDelay: "100ms" }}
          >
            <Card className="border-border/60 bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="inline-flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">WhatsApp</p>
                    <a
                      href="https://wa.me/541164321329"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      11-6432-1329
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="inline-flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Instagram className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Instagram</p>
                    <a
                      href="https://instagram.com/desing.gr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      @desing.gr
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="inline-flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Zona de cobertura</p>
                    <p className="text-sm text-muted-foreground">La Plata · CABA · AMBA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <form
            onSubmit={handleSubmit}
            className={cn(
              "space-y-6 rounded-2xl border border-border/60 bg-card p-6 sm:p-8 fade-in",
              isInView && "fade-in-visible",
            )}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="11 1234-5678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                placeholder="Contanos qué mueble necesitás..."
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full gap-2">
              <Send className="size-4" /> Enviar por WhatsApp
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Al enviar, te redirigimos a WhatsApp con tu mensaje.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
