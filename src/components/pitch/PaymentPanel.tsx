import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { PAYMENT_AMOUNTS } from "@/lib/contentFilter";

type Payment = { id: string; tier: "stage_3" | "stage_4"; status: "pending" | "verified" | "rejected"; amount: number };

export default function PaymentPanel({ pitchId, tier, label, onChanged }: { pitchId: string; tier: "stage_3" | "stage_4"; label: string; onChanged: () => void; }) {
  const { user } = useAuth();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("pitch_payments").select("*").eq("pitch_id", pitchId).eq("tier", tier).maybeSingle();
    setPayment((data as Payment | null) ?? null);
  };
  useEffect(() => { load(); }, [pitchId, tier]);

  const submit = async () => {
    if (!user) return;
    if (!ref.trim()) return toast.error("Add a payment reference (transaction ID).");
    setBusy(true);
    const { error } = await supabase.from("pitch_payments").insert({
      pitch_id: pitchId, payer_id: user.id, tier, amount: PAYMENT_AMOUNTS[tier], reference_note: ref.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Payment submitted. Awaiting admin verification.");
    setRef("");
    load();
    onChanged();
  };

  return (
    <Card className="border-primary/40 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{label} — PKR {PAYMENT_AMOUNTS[tier].toLocaleString()}</span>
        {payment?.status === "verified" && <Badge className="ml-auto bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" />Verified</Badge>}
        {payment?.status === "pending" && <Badge variant="secondary" className="ml-auto"><Clock className="mr-1 h-3 w-3" />Pending review</Badge>}
        {payment?.status === "rejected" && <Badge variant="destructive" className="ml-auto">Rejected</Badge>}
      </div>
      {!payment || payment.status === "rejected" ? (
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs">Transaction reference / receipt note</Label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. EasyPaisa TID 234..." />
          </div>
          <Button onClick={submit} disabled={busy} variant="hero" className="self-end">Submit payment</Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Reference: {payment ? "submitted" : "—"}. You'll be notified once verified.</p>
      )}
    </Card>
  );
}