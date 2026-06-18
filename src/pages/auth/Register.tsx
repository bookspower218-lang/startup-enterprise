import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/oauth";
import {
  classifyAccount,
  isCorporateEmail,
  ACCOUNT_LABELS,
  type AccountKind,
  type OnboardingAnswers,
} from "@/lib/accountClassifier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { INDUSTRIES } from "@/lib/constants";
import { ArrowLeft, ArrowRight, Building2, Rocket, Sparkles } from "lucide-react";

type Step = "intro" | "questions" | "result" | "details";

const detailsSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  industry: z.string().min(1, "Select an industry"),
  company_name: z.string().trim().max(150).optional(),
});

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forcedType = searchParams.get("type");
  const initialKind: AccountKind | null =
    forcedType === "startup" || forcedType === "company" ? forcedType : null;

  const [step, setStep] = useState<Step>(initialKind ? "details" : "intro");
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    goal: "explore",
    stage: "idea",
    teamSize: "solo",
    hasPayingCustomers: false,
    corporateEmail: false,
    companyNameProvided: false,
  });
  const [accountType, setAccountType] = useState<AccountKind>(initialKind ?? "startup");
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    email: "",
    password: "",
    industry: "",
  });
  const [skippedWizard, setSkippedWizard] = useState(!!initialKind);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const classification = useMemo(() => classifyAccount(answers), [answers]);

  const goToResult = () => {
    setAccountType(classification.recommended);
    setStep("result");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("You must agree to the Terms & Conditions");
      return;
    }
    const parsed = detailsSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (accountType === "company" && !form.company_name.trim()) {
      toast.error("Enter your company or organization name");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.full_name,
          account_type: accountType,
          company_name: accountType === "company" ? form.company_name : null,
          industry: form.industry,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Welcome to ValidatePK — you're set up as ${ACCOUNT_LABELS[accountType].title}.`);
    navigate("/dashboard");
  };

  const handleGoogle = async () => {
    if (!agreed) {
      toast.error("You must agree to the Terms & Conditions");
      return;
    }
    const { error } = await signInWithGoogle(accountType);
    if (error) toast.error(error.message || "Google sign-in failed");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-lg p-8">
          {step === "intro" && (
            <>
              <h1 className="text-3xl font-bold">Create your account</h1>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                One platform for founders and enterprises. We&apos;ll help you pick the right account —
                no need to guess startup vs enterprise.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <Rocket className="mb-2 h-6 w-6 text-accent" />
                  <div className="font-semibold">Startup</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    You have an idea or young company and want validation from real enterprises.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <Building2 className="mb-2 h-6 w-6 text-enterprise" />
                  <div className="font-semibold">Enterprise</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    You represent a company that wants to discover and review startup pitches.
                  </p>
                </div>
              </div>
              <Button className="mt-8 w-full" onClick={() => setStep("questions")}>
                Help me choose <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={() => { setSkippedWizard(true); setAccountType("startup"); setStep("details"); }}>
                  I&apos;m a startup
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setSkippedWizard(true); setAccountType("company"); setStep("details"); }}>
                  I&apos;m an enterprise
                </Button>
              </div>
            </>
          )}

          {step === "questions" && (
            <>
              <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => setStep("intro")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <h2 className="text-2xl font-bold">A few quick questions</h2>
              <p className="mt-1 text-sm text-muted-foreground">This helps us recommend the right account type.</p>

              <div className="mt-6 space-y-6">
                <div>
                  <Label className="text-label text-muted-foreground">What do you want to do here?</Label>
                  <RadioGroup
                    className="mt-2 space-y-2"
                    value={answers.goal}
                    onValueChange={(v) => setAnswers({ ...answers, goal: v as OnboardingAnswers["goal"] })}
                  >
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm">
                      <RadioGroupItem value="pitch" /> Pitch my startup idea to enterprises
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm">
                      <RadioGroupItem value="review" /> Review and discover startup pitches
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm">
                      <RadioGroupItem value="both" /> Both — I wear multiple hats
                    </label>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-label text-muted-foreground">Where are you today?</Label>
                  <Select
                    value={answers.stage}
                    onValueChange={(v) => setAnswers({ ...answers, stage: v as OnboardingAnswers["stage"] })}
                  >
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">I have an idea, not incorporated yet</SelectItem>
                      <SelectItem value="early_startup">Early startup (building MVP / first users)</SelectItem>
                      <SelectItem value="growing_business">Growing business with some traction</SelectItem>
                      <SelectItem value="established_enterprise">Established company or corporate team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-label text-muted-foreground">Team size</Label>
                  <Select
                    value={answers.teamSize}
                    onValueChange={(v) => setAnswers({ ...answers, teamSize: v as OnboardingAnswers["teamSize"] })}
                  >
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Just me</SelectItem>
                      <SelectItem value="small">2–10 people</SelectItem>
                      <SelectItem value="medium">11–50 people</SelectItem>
                      <SelectItem value="large">50+ people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={answers.hasPayingCustomers}
                    onCheckedChange={(v) => setAnswers({ ...answers, hasPayingCustomers: !!v })}
                  />
                  We already have paying B2B customers
                </label>
              </div>

              <Button className="mt-8 w-full" onClick={goToResult}>
                See recommendation <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === "result" && (
            <>
              <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => setStep("questions")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <div className="text-center">
                <Badge variant={classification.recommended === "startup" ? "startup" : "enterprise"} className="mb-4">
                  {classification.confidence} confidence
                </Badge>
                <h2 className="text-2xl font-bold">
                  We recommend: {ACCOUNT_LABELS[classification.recommended].title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {ACCOUNT_LABELS[classification.recommended].subtitle}
                </p>
                {classification.reasons.length > 0 && (
                  <ul className="mt-4 space-y-1 text-left text-sm text-muted-foreground">
                    {classification.reasons.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Button
                  variant={accountType === "startup" ? "default" : "outline"}
                  onClick={() => setAccountType("startup")}
                >
                  Startup
                </Button>
                <Button
                  variant={accountType === "company" ? "accent" : "outline"}
                  onClick={() => setAccountType("company")}
                >
                  Enterprise
                </Button>
              </div>
              <p className="mt-2 text-center text-caption">You can switch above if this doesn&apos;t feel right.</p>

              <Button className="mt-6 w-full" onClick={() => setStep("details")}>
                Continue as {ACCOUNT_LABELS[accountType].title}
              </Button>
            </>
          )}

          {step === "details" && (
            <>
              {!initialKind && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4 -ml-2"
                  onClick={() => setStep(skippedWizard ? "intro" : "result")}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              )}
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Your details</h2>
                <Badge variant={accountType === "startup" ? "startup" : "enterprise"}>
                  {ACCOUNT_LABELS[accountType].badge}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Joining as <strong>{ACCOUNT_LABELS[accountType].title}</strong>
              </p>

              <Button onClick={handleGoogle} variant="outline" className="mt-6 w-full">
                Continue with Google
              </Button>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                onChange={() => {
                  setAnswers((a) => ({
                    ...a,
                    corporateEmail: isCorporateEmail(form.email),
                    companyNameProvided: form.company_name.trim().length > 0,
                  }));
                }}
              >
                <div>
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                {accountType === "company" && (
                  <div>
                    <Label htmlFor="company_name">Company / organization name</Label>
                    <Input id="company_name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
                  </div>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => (<SelectItem key={i} value={i}>{i}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
                  <span>I agree to the <Link to="/terms" target="_blank" className="underline">Terms & Conditions</Link>.</span>
                </label>
                <Button type="submit" variant="accent" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create account"}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="underline">Sign in</Link>
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
