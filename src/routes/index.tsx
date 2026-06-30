import { createFileRoute } from "@tanstack/react-router";
import {
  Navbar,
  Hero,
  Services,
  Gallery,
  About,
  Testimonials,
  Contact,
  Footer,
  FloatingWhatsApp,
} from "@/components/landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Design.gr | Muebles a medida en La Plata, CABA y AMBA" },
      {
        name: "description",
        content:
          "Carpintería de muebles a medida en La Plata. Cocinas, placards, vestidores, escritorios, bibliotecas y muebles de baño. Diseño integral y trabajos en CABA y AMBA.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Gallery />
        <About />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
