import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/oauth";
import { getAuthRedirectTo } from "@/lib/authRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { INDUSTRIES } from "@/lib/constants";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  company_name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  industry: z.string().min(1, "Select an industry"),
});

const CompanyRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", company_name: "", email: "", password: "", industry: "" });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("You must agree to the Terms & Conditions");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: getAuthRedirectTo(),
        data: {
          full_name: form.full_name,
          company_name: form.company_name,
          account_type: "company",
          industry: form.industry,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Company account created!");
      navigate("/dashboard");
      return;
    }
    toast.success("Check your email to confirm your account, then sign in.");
  };

  const handleGoogle = async () => {
    if (!agreed) {
      toast.error("You must agree to the Terms & Conditions");
      return;
    }
    const { error } = await signInWithGoogle("company");
    if (error) toast.error(error.message || "Google sign-in failed");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-3xl font-bold">Join as <span className="text-enterprise">Enterprise</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Free signup. Receive curated startup pitches in your industry.</p>

          <Button onClick={handleGoogle} variant="outline" className="mt-6 w-full">
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Your Name</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <Label>Industry Focus</Label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (<SelectItem key={i} value={i}>{i}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
              <span>I have read and agree to the <Link to="/terms" target="_blank" className="text-foreground underline">Terms & Conditions</Link>, including the 7-day response SLA and the prohibition on sharing contact details outside the platform.</span>
            </label>
            <Button type="submit" variant="accent" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member? <Link to="/login" className="text-foreground hover:underline">Sign in</Link>
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyRegister;
