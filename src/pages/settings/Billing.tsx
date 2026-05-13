import { useEffect, useState } from "react";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Payment = {
  id: string; tier: string; amount: number; status: string; submitted_at: string;
  verified_at: string | null; gateway: string; invoice_url: string | null;
};

const Billing = () => {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: pay }, { data: u }, { data: l }] = await Promise.all([
        supabase.from("pitch_payments").select("id,tier,amount,status,submitted_at,verified_at,gateway,invoice_url").eq("payer_id", user.id).order("submitted_at", { ascending: false }),
        supabase.rpc("monthly_pitch_count", { _uid: user.id }),
        supabase.rpc("plan_pitch_limit", { _uid: user.id }),
      ]);
      setPayments((pay as Payment[]) ?? []);
      if (typeof u === "number") setUsed(u);
      if (typeof l === "number") setLimit(l);
      setLoading(false);
    })();
  }, [user]);

  const pct = limit > 0 ? Math.min(100, Math.round((used / Math.min(limit, 1000)) * 100)) : 0;

  return (
    <DashboardShell>
      <div className="container max-w-3xl space-y-6 py-8">
        <h1 className="font-display text-3xl font-bold">Billing</h1>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold capitalize">{profile?.plan ?? "basic"} plan</h2>
              <p className="text-xs text-muted-foreground">Pitches used this month</p>
            </div>
            <Badge variant="outline">{used} / {limit === 1000000 ? "∞" : limit}</Badge>
          </div>
          <Progress value={pct} />
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">Payment history</h2>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <Badge variant="outline" className="capitalize">{p.tier.replace("_", " ")}</Badge>
                  <span>PKR {Number(p.amount).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground capitalize">{p.gateway}</span>
                  <span className="text-xs text-muted-foreground">{new Date(p.submitted_at).toLocaleDateString()}</span>
                  <Badge className="ml-auto capitalize" variant={p.status === "verified" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>{p.status}</Badge>
                  {p.invoice_url && <a href={p.invoice_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Invoice</a>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
};

export default Billing;