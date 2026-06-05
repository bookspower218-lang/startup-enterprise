import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  UserPlus, FileText, Send, ShieldCheck,
  Cpu, Banknote, HeartPulse, GraduationCap,
  ShoppingBag, Truck, Sprout, Building2, Clapperboard, Factory,
  Check, Sparkles, TrendingUp, Users,
} from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import heroBg from "@/assets/hero-bg.jpg";

const steps = [
  { icon: UserPlus, title: "Register", desc: "Sign up as a Startup or Validator Company in minutes." },
  { icon: FileText, title: "Build Profile", desc: "Share your problem, solution and pitch deck." },
  { icon: Send, title: "Pitch", desc: "Send tailored pitches to verified companies." },
  { icon: ShieldCheck, title: "Get Validated", desc: "Receive real feedback and unlock direct contact." },
];

const stats = [
  { value: "100+", label: "Validator Companies" },
  { value: "10", label: "Industries Covered" },
  { value: "500+", label: "Startups Validated" },
  { value: "7 days", label: "Avg. Response Time" },
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
    name: "Basic",
    price: "5,000",
    tag: "Get started",
    features: ["Profile listing", "Pitch up to 5 companies", "Standard support", "Pitch deck hosting"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "15,000",
    tag: "Most popular",
    features: ["Everything in Basic", "Pitch up to 25 companies", "Unlock company contacts", "Priority response queue", "In-platform messaging"],
    highlight: true,
  },
  {
    name: "Premium",
    price: "20,000",
    tag: "For serious founders",
    features: ["Everything in Pro", "Unlimited pitches", "Featured in industry shortlist", "Dedicated account manager", "Investor introduction support"],
    highlight: false,
  },
];

const faqs = [
  { q: "How does Startup Enterprise actually work?", a: "Startups register, build a profile and pitch deck, and send pitches to verified companies in their industry. Companies review and either show interest or pass. When both sides engage, contact is unlocked through the platform." },
  { q: "Why do startups have to pay?", a: "Companies receive curated, paid pitches only — this filters serious founders from spam and guarantees a 7-day response SLA from validator companies." },
  { q: "Can I contact a company outside the platform?", a: "No. All communication must happen through Startup Enterprise. Going around the platform is a breach of contract and can result in account termination." },
  { q: "What happens if a company doesn't respond?", a: "Validator companies commit to a 7-day response SLA. If they fail to respond, you can flag the pitch and request a re-route to another company at no extra cost." },
  { q: "Is the registration fee refundable?", a: "The PKR 5,000 registration fee is non-refundable. The PKR 15,000 unlock fee is only charged when a company shows interest in your pitch." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 -z-10 bg-hero" />
        <div className="absolute inset-0 -z-10 bg-grid" />

        <div className="container py-24 md:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              Trusted by 100+ companies across Pakistan
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Stop Burning Money on Ads.
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Validate Your Startup with Real Companies.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Startup Enterprise connects ambitious founders directly with verified B2B validator companies — get real feedback, real interest, and real contracts.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild variant="hero" size="xl">
                <Link to="/startup/register">Register as Startup</Link>
              </Button>
              <Button asChild variant="goldOutline" size="xl">
                <Link to="/company/register">Join as Validator Company</Link>
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Free for companies · Startups from PKR 5,000
            </p>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-24 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card/80 p-6 text-center backdrop-blur">
                <div className="font-display text-3xl font-bold text-foreground md:text-4xl">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-5xl">How Startup Enterprise works</h2>
          <p className="mt-4 text-muted-foreground">From signup to validation in four straightforward steps.</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title} className="relative overflow-hidden border-border/60 bg-card/60 p-6 transition-all hover:border-primary/50 hover:shadow-elegant">
              <div className="absolute -right-4 -top-4 font-display text-7xl font-bold text-primary/10">
                0{i + 1}
              </div>
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant">
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="border-y border-border/40 bg-card/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-5xl">10 Industries. One platform.</h2>
            <p className="mt-4 text-muted-foreground">Validators across the sectors that matter most.</p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {industries.map((ind) => (
              <Card key={ind.name} className="group flex flex-col items-center gap-3 border-border/60 bg-background/50 p-6 transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-gold">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary group-hover:bg-gold/10">
                  <ind.icon className="h-6 w-6 text-primary group-hover:text-gold" />
                </div>
                <span className="text-sm font-medium">{ind.name}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-5xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">Pay once to register. Pay again only when a company shows interest.</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={`relative overflow-hidden p-8 transition-all ${
                p.highlight
                  ? "border-gold/60 bg-card shadow-gold scale-[1.02]"
                  : "border-border/60 bg-card/60 hover:border-primary/40"
              }`}
            >
              {p.highlight && (
                <div className="absolute right-4 top-4 rounded-full bg-gradient-gold px-3 py-1 text-xs font-semibold text-gold-foreground">
                  {p.tag}
                </div>
              )}
              <h3 className="font-display text-2xl font-bold">{p.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Startup {p.tag}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">PKR</span>
                <span className="font-display text-5xl font-bold">{p.price}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.highlight ? "text-gold" : "text-primary"}`} />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={p.highlight ? "gold" : "hero"}
                className="mt-8 w-full"
              >
                <Link to="/startup/register">Choose {p.name}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Why companies join */}
      <section className="border-y border-border/40 bg-card/30 py-24">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <TrendingUp className="h-3.5 w-3.5" /> For validator companies
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Get early access to the next big thing — for free.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Hear curated pitches from serious founders in your industry. No commitment, zero spam, full control over what you accept.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Curated pitches matched to your interests",
                "Zero commitment — accept or decline any pitch",
                "Verified founders with skin in the game",
                "Direct contact only after mutual interest",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-gold" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="goldOutline" size="lg" className="mt-8">
              <Link to="/company/register">Join as Validator</Link>
            </Button>
          </div>
          <Card className="border-border/60 bg-background/50 p-8 shadow-elegant">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display font-semibold">Incoming pitch</div>
                <div className="text-xs text-muted-foreground">FinTech · Seeking Investment</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              "We help SMEs in Pakistan automate invoice reconciliation using AI — already saving customers 12 hours/week..."
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="default" className="flex-1 bg-success text-success-foreground hover:bg-success/90">
                Show Interest
              </Button>
              <Button variant="secondary" className="flex-1">Pass</Button>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold md:text-5xl">Frequently asked questions</h2>
            <p className="mt-4 text-muted-foreground">Everything you need to know before you pitch.</p>
          </div>

          <Accordion type="single" collapsible className="mt-12">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
                <AccordionTrigger className="text-left font-display text-base font-semibold hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-24">
        <Card className="relative overflow-hidden border-gold/30 bg-gradient-to-br from-card to-background p-10 text-center md:p-16">
          <div className="absolute inset-0 -z-10 bg-grid opacity-50" />
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Your next customer is waiting.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Stop guessing. Start validating. Join hundreds of founders building real businesses with real feedback.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild variant="hero" size="xl">
              <Link to="/startup/register">Register your startup</Link>
            </Button>
            <Button asChild variant="goldOutline" size="xl">
              <Link to="/company/register">Join as company</Link>
            </Button>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;