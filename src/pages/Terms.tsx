import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { TERMS_TITLE, TERMS_MARKDOWN } from "@/lib/terms";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="container py-16">
      <Card className="mx-auto max-w-3xl p-8 md:p-12">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{TERMS_TITLE}</h1>
        <pre className="mt-8 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">{TERMS_MARKDOWN}</pre>
      </Card>
    </section>
    <Footer />
  </div>
);

export default Terms;
