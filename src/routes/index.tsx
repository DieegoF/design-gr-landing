import { createFileRoute } from "@tanstack/react-router";
import {
  Navbar,
  Hero,
  Configurator,
  Gallery,
  Quote,
  About,
  Footer,
  FloatingWhatsApp,
  QuoteProvider,
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
    <QuoteProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <Configurator />
          <Gallery />
          <Quote />
          <About />
        </main>
        <Footer />
        <FloatingWhatsApp />
      </div>
    </QuoteProvider>
  );
}
