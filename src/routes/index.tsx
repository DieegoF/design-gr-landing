import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { startSmooth } from "@/lib/smooth";
import {
  Navbar,
  Hero,
  Modelos,
  Asistente,
  Avanzado,
  Gallery,
  About,
  Footer,
  FloatingWhatsApp,
  QuoteProvider,
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
  useEffect(() => {
    startSmooth();
  }, []);
  return (
    <QuoteProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <Modelos />
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
