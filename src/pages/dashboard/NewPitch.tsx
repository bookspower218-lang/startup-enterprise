import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { INDUSTRIES, PITCH_TYPES } from "@/lib/constants";

const schema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(20).max(2000),
  industry: z.string().min(1),
  pitch_type: z.enum(["sell", "investment", "networking"]),
  asking_amount: z.string().optional(),
});

const NewPitch = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", industry: profile?.industry || "", pitch_type: "investment", asking_amount: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.from("pitches").insert({
      startup_id: user.id,
      title: form.title,
      description: form.description,
      industry: form.industry,
      pitch_type: form.pitch_type as "sell" | "investment" | "networking",
      asking_amount: form.asking_amount ? Number(form.asking_amount) : null,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pitch published!");
    navigate("/pitches");
  };

  return (
    <DashboardShell>
      <div className="container max-w-2xl space-y-6 py-8">
        <h1 className="font-display text-3xl font-bold">Create a Pitch</h1>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={150} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required maxLength={2000} placeholder="Problem, solution, traction..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Industry</Label>
                <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                  <SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map((i) => (<SelectItem key={i} value={i}>{i}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pitch Type</Label>
                <Select value={form.pitch_type} onValueChange={(v) => setForm({ ...form, pitch_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PITCH_TYPES.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="amount">Asking Amount (optional, PKR)</Label>
              <Input id="amount" type="number" min="0" value={form.asking_amount} onChange={(e) => setForm({ ...form, asking_amount: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="hero" disabled={loading}>{loading ? "Publishing..." : "Publish Pitch"}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
            <p className="text-xs text-muted-foreground">Companies have 7 days to respond before your pitch expires.</p>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default NewPitch;