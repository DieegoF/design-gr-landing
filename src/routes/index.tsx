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
      { title: "Design.gr | Escritorios y muebles a medida en La Plata, CABA y AMBA" },
      {
        name: "description",
        content:
          "Especialistas en escritorios a medida en La Plata. También cocinas, placards, vestidores, bibliotecas y muebles de baño. Diseño integral y trabajos en CABA y AMBA.",
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
