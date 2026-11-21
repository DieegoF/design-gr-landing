import { createFileRoute } from "@tanstack/react-router";
import {
  Navbar,
  Hero,
  Asistente,
  Avanzado,
  Modos,
  Gallery,
  About,
  Footer,
  FloatingWhatsApp,
  QuoteProvider,
  Splash,
} from "@/components/landing";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: SITE_TITLE }, { name: "description", content: SITE_DESCRIPTION }],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <QuoteProvider>
      <Splash />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <Modos />
          <Asistente />
          <Avanzado />
          <Gallery />
          <About />
        </main>
        <Footer />
        <FloatingWhatsApp />
      </div>
    </QuoteProvider>
  );
}
