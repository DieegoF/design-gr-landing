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
