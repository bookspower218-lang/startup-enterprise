import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/oauth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = "admin@startup-enterprise.app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Admin shortcut: username "admin" / password "admin123"
    const isAdminLogin = email.trim().toLowerCase() === "admin";
    const loginEmail = isAdminLogin ? ADMIN_EMAIL : email;
    if (isAdminLogin) {
      setLoading(true);
      await supabase.functions.invoke("bootstrap-admin");
      const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome, admin");
      navigate("/admin/payments");
      return;
    }
    const parsed = schema.safeParse({ email: loginEmail, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/dashboard");
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message || "Google sign-in failed");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-md p-8">
          <h1 className="font-display text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Log in to your Startup Enterprise account.</p>

          <Button onClick={handleGoogle} variant="outline" className="mt-6 w-full">
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/startup/register" className="text-primary hover:underline">
              Join as Startup
            </Link>{" "}
            or{" "}
            <Link to="/company/register" className="text-primary hover:underline">
              Validator Company
            </Link>
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Login;