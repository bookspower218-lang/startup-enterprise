import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText, Send, ShieldCheck, Check,
  Cpu, Banknote, HeartPulse, GraduationCap,
  ShoppingBag, Truck, Sprout, Building2, Clapperboard, Factory,
} from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

const problems = [
  { title: "NIC rejected you", desc: "Incubators say no. Accelerators ghost you. Your idea deserves a real audience." },
  { title: "No enterprise access", desc: "Big companies don't take cold emails. We put you in front of decision-makers." },
  { title: "Ideas die here", desc: "Pakistan has talent. What it lacks is a bridge between founders and enterprises." },
];

const steps = [
  { icon: FileText, title: "Submit your startup pitch", desc: "Share your problem, solution, and deck with verified enterprises in your industry." },
  { icon: Send, title: "Enterprises review & respond", desc: "Real companies — not algorithms, not bots — review your pitch within 7 days." },
  { icon: ShieldCheck, title: "Get your Validation Certificate", desc: "Earn credibility you can show investors, partners, and customers." },
];

const industries = [
  { name: "Tech", icon: Cpu },
  { name: "FinTech", icon: Banknote },
  { name: "HealthTech", icon: HeartPulse },
  { name: "EdTech", icon: GraduationCap },
  { name: "Retail", icon: ShoppingBag },
  { name: "Logistics", icon: Truck },
  { name: "Agriculture", icon: Sprout },
  { name: "Real Estate", icon: Building2 },
  { name: "Media", icon: Clapperboard },
  { name: "Manufacturing", icon: Factory },
];

const plans = [
  {
    name: "Starter",
    price: "15,000",
    features: ["Profile listing", "Pitch up to 5 enterprises", "Standard support", "Pitch deck hosting"],
    highlight: false,
  },
  {
    name: "Growth",
    price: "39,000",
    features: ["Everything in Starter", "Pitch up to 25 enterprises", "Unlock enterprise contacts", "Priority response queue", "In-platform messaging"],
    highlight: false,
  },
  {
    name: "Scale",
    price: "50,999",
    features: ["Everything in Growth", "Unlimited pitches", "Featured in industry shortlist", "Dedicated account manager", "Investor introduction support"],
    highlight: true,
  },
];

const faqs = [
  { q: "How does validation actually work?", a: "Startups register, build a profile and pitch deck, and send pitches to verified enterprises in their industry. Companies review and either show interest or pass. When both sides engage, contact is unlocked through the platform." },
  { q: "Why do startups have to pay?", a: "Enterprises receive curated, paid pitches only — this filters serious founders from spam and guarantees a 7-day response SLA from validator companies." },
  { q: "Can I contact an enterprise outside the platform?", a: "No. All communication must happen through ValidatePK. Going around the platform is a breach of contract and can result in account termination." },
  { q: "What happens if an enterprise doesn't respond?", a: "Validator enterprises commit to a 7-day response SLA. If they fail to respond, you can flag the pitch and request a re-route to another company at no extra cost." },
  { q: "Is the registration fee refundable?", a: "Registration fees are non-refundable. Unlock fees are only charged when an enterprise shows interest in your pitch." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-display md:text-[48px]">
              Pakistan ka pehla startup validation platform.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Get your idea reviewed by real enterprises.
              Not algorithms. Not bots. Real companies.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild variant="accent" size="lg">
                <Link to="/register">Start for 15,000 PKR</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/#how">See how it works</Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              47 startups validated · 12 enterprise partners
            </p>
          </div>
        </div>
      </section>

      {/* Problem strip */}
      <section id="features" className="border-y border-border bg-card">
        <div className="container section-padding">
          <div className="grid gap-8 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.title} className="text-center md:text-left">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">Three steps from pitch to validation certificate.</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <Card key={s.title} className="p-6">
                <div className="text-label mb-4 text-muted-foreground">Step {i + 1}</div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background">
                  <s.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="border-y border-border bg-card section-padding">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">10 industries. One platform.</h2>
            <p className="mt-4 text-muted-foreground">Enterprises across the sectors that matter most.</p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {industries.map((ind) => (
              <Card key={ind.name} className="flex flex-col items-center gap-3 rounded-lg p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background">
                  <ind.icon className="h-6 w-6 text-foreground" />
                </div>
                <span className="text-sm font-medium">{ind.name}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground">Pay once to register. Pay again only when an enterprise shows interest.</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {plans.map((p) => (
              <Card
                key={p.name}
                className={`p-6 ${p.highlight ? "border-foreground" : ""}`}
              >
                {p.highlight && (
                  <Badge variant="validated" className="mb-4">Recommended</Badge>
                )}
                <h3 className="text-2xl font-bold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">PKR</span>
                  <span className="text-4xl font-bold">{p.price}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={p.highlight ? "accent" : "default"}
                  className="mt-8 w-full"
                >
                  <Link to="/register">Choose {p.name}</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise strip */}
      <section id="enterprises" className="bg-inverted section-padding">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="enterprise" className="mb-6">For enterprises</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-inverted-foreground md:text-4xl">
              Are you an enterprise?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-inverted-foreground/80">
              Discover Pakistan&apos;s next unicorns before anyone else.
            </p>
            <Button asChild variant="accent" size="lg" className="mt-8 bg-accent-on-dark text-inverted hover:bg-accent-on-dark/90">
              <Link to="/register?type=company">Become a Validation Partner</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Frequently asked questions</h2>
              <p className="mt-4 text-muted-foreground">Everything you need to know before you pitch.</p>
            </div>

            <Accordion type="single" collapsible className="mt-12">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-16 md:pb-24">
        <Card className="p-10 text-center md:p-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to get validated?
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
            We open doors. You walk through them.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild variant="accent" size="lg">
              <Link to="/register">Apply for Validation</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/register?type=company">Join as Enterprise</Link>
            </Button>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
