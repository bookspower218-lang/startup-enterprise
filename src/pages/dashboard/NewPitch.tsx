import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PITCH_TYPES } from "@/lib/constants";
import { Search } from "lucide-react";

const schema = z.object({
  target_company_id: z.string().uuid("Pick a target company"),
  problem: z.string().trim().min(10, "Problem must be at least 10 chars").max(200),
  solution: z.string().trim().min(10, "Solution must be at least 10 chars").max(200),
  pitch_type: z.enum(["sell", "investment", "networking"]),
  short_note: z.string().trim().max(300).optional().or(z.literal("")),
});

type Company = { user_id: string; company_name: string | null; full_name: string | null; industry: string | null };

const NewPitch = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(5);
  const [form, setForm] = useState({ target_company_id: "", problem: "", solution: "", pitch_type: "investment", short_note: "" });
  const [companyQuery, setCompanyQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      [c.company_name, c.full_name, c.industry].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [companies, companyQuery]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("list_company_profiles");
      setCompanies((data as Company[]) ?? []);
      setLoadingCompanies(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: u } = await supabase.rpc("monthly_pitch_count", { _uid: user.id });
      const { data: l } = await supabase.rpc("plan_pitch_limit", { _uid: user.id });
      if (typeof u === "number") setUsed(u);
      if (typeof l === "number") setLimit(l);
    })();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (used >= limit) return toast.error(`Monthly pitch limit reached (${limit}). Upgrade your plan.`);

    // Block resubmission within 90 days of a Pass response to same company
    const { data: existing } = await supabase
      .from("pitches")
      .select("id, status, created_at")
      .eq("startup_id", user.id)
      .eq("target_company_id", form.target_company_id);
    if ((existing ?? []).some((p: any) => p.status === "open")) {
      return toast.error("You already have an open pitch with this company.");
    }
    if ((existing ?? []).some((p: any) => p.status === "closed" && (Date.now() - new Date(p.created_at).getTime()) < 90 * 86400000)) {
      return toast.error("You can only re-pitch this company 90 days after a Pass.");
    }

    const company = companies.find((c) => c.user_id === form.target_company_id);
    setLoading(true);
    const { data, error } = await supabase.from("pitches").insert({
      startup_id: user.id,
      target_company_id: form.target_company_id,
      problem: form.problem,
      solution: form.solution,
      short_note: form.short_note || null,
      pitch_type: form.pitch_type as "sell" | "investment" | "networking",
      industry: company?.industry || profile?.industry || "Technology",
      title: form.problem.slice(0, 80),
      description: `${form.problem}\n\n${form.solution}${form.short_note ? `\n\n${form.short_note}` : ""}`,
    }).select("id").maybeSingle();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Pitch sent!");
    navigate(data ? `/pitches/${data.id}` : "/pitches");
  };

  const remaining = Math.max(0, limit - used);

  return (
    <DashboardShell>
      <div className="container max-w-2xl space-y-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-bold">Send a Pitch</h1>
          <div className="rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs">
            <span className="text-muted-foreground">This month:</span>{" "}
            <span className="font-semibold">{used}/{limit === 1000000 ? "∞" : limit}</span>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Target enterprise</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search companies by name or industry…"
                  value={companyQuery}
                  onChange={(e) => setCompanyQuery(e.target.value)}
                />
              </div>
              {loadingCompanies ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={form.target_company_id} onValueChange={(v) => setForm({ ...form, target_company_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick an enterprise to pitch" /></SelectTrigger>
                  <SelectContent>
                    {filteredCompanies.map((c) => (
                      <SelectItem key={c.user_id} value={c.user_id}>
                        {c.company_name || c.full_name} {c.industry ? `· ${c.industry}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="problem">Problem Statement <span className="text-muted-foreground">({form.problem.length}/200)</span></Label>
              <Textarea id="problem" rows={3} maxLength={200} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} required />
            </div>

            <div>
              <Label htmlFor="solution">Solution <span className="text-muted-foreground">({form.solution.length}/200)</span></Label>
              <Textarea id="solution" rows={3} maxLength={200} value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} required />
            </div>

            <div>
              <Label>Pitch Type</Label>
              <Select value={form.pitch_type} onValueChange={(v) => setForm({ ...form, pitch_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PITCH_TYPES.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="short_note">Short Note <span className="text-muted-foreground">({form.short_note.length}/300)</span></Label>
              <Textarea id="short_note" rows={3} maxLength={300} value={form.short_note} onChange={(e) => setForm({ ...form, short_note: e.target.value })} placeholder="Why this company specifically?" />
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="hero" disabled={loading || remaining === 0}>{loading ? "Sending..." : "Send Pitch"}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
            <p className="text-xs text-muted-foreground">After sending, no further action is available until the company responds. One pitch per company. 90-day cooldown after a Pass.</p>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default NewPitch;
