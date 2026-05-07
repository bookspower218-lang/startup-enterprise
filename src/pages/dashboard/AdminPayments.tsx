import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Row = { id: string; pitch_id: string; payer_id: string; tier: string; amount: number; reference_note: string | null; status: string; submitted_at: string };

export default function AdminPayments() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const load = async () => {
    const { data } = await supabase.from("pitch_payments").select("*").order("submitted_at", { ascending: false });
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const set = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase.from("pitch_payments").update({ status, verified_at: status === "verified" ? new Date().toISOString() : null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status);
    load();
  };

  if (isAdmin === null) return <DashboardShell><div className="container py-8">Loading…</div></DashboardShell>;
  if (!isAdmin) return <DashboardShell><div className="container py-8">Admins only.</div></DashboardShell>;

  return (
    <DashboardShell>
      <div className="container py-8 space-y-4">
        <h1 className="font-display text-3xl font-bold">Payments</h1>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No submissions.</p> : rows.map((r) => (
          <Card key={r.id} className="p-4 flex flex-wrap items-center gap-3">
            <Badge variant="outline">{r.tier}</Badge>
            <span className="text-sm">PKR {Number(r.amount).toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Pitch: {r.pitch_id.slice(0, 8)} · Payer: {r.payer_id.slice(0, 8)}</span>
            <span className="text-xs">Ref: {r.reference_note}</span>
            <Badge className="ml-auto capitalize" variant={r.status === "verified" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => set(r.id, "verified")}>Verify</Button>
                <Button size="sm" variant="secondary" onClick={() => set(r.id, "rejected")}>Reject</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}