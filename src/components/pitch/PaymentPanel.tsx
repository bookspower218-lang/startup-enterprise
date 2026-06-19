import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle2, Clock, Upload, Gift } from "lucide-react";
import { toast } from "sonner";
import { PAYMENT_AMOUNTS } from "@/lib/contentFilter";

type Payment = {
  id: string;
  tier: "stage_3" | "stage_4";
  status: "pending" | "verified" | "rejected";
  amount: number;
  proof_path: string | null;
  gateway: string | null;
  reference_note: string | null;
};

export default function PaymentPanel({ pitchId, tier, label, onChanged }: { pitchId: string; tier: "stage_3" | "stage_4"; label: string; onChanged: () => void; }) {
  const { user } = useAuth();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [freeTrial, setFreeTrial] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: paymentRow }, { data: trial }] = await Promise.all([
      supabase.from("pitch_payments").select("*").eq("pitch_id", pitchId).eq("tier", tier).maybeSingle(),
      supabase.rpc("pitch_qualifies_for_free_trial", { _pitch_id: pitchId }),
    ]);
    setPayment((paymentRow as Payment | null) ?? null);
    setFreeTrial(trial === true || paymentRow?.gateway === "free_trial");
  };
  useEffect(() => { load(); }, [pitchId, tier]);

  const submit = async () => {
    if (!user) return;
    if (!file) return toast.error("Please attach a screenshot of your payment.");
    if (!file.type.startsWith("image/")) return toast.error("Screenshot must be an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB.");
    setBusy(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${pitchId}-${tier}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false });
    if (up.error) { setBusy(false); return toast.error(up.error.message); }
    const { error } = await supabase.from("pitch_payments").insert({
      pitch_id: pitchId, payer_id: user.id, tier, amount: PAYMENT_AMOUNTS[tier],
      reference_note: note.trim() || null, proof_path: path,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Payment submitted. Awaiting admin verification.");
    setFile(null); setNote("");
    load();
    onChanged();
  };

  return (
    <Card className="border-primary/40 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {freeTrial ? <Gift className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-primary" />}
        <span className="text-sm font-semibold">
          {freeTrial ? "Free trial — full access unlocked" : `${label} — PKR ${PAYMENT_AMOUNTS[tier].toLocaleString()}`}
        </span>
        {freeTrial && <Badge className="ml-auto bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" />No payment required</Badge>}
        {!freeTrial && payment?.status === "verified" && <Badge className="ml-auto bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" />Verified</Badge>}
        {!freeTrial && payment?.status === "pending" && <Badge variant="secondary" className="ml-auto"><Clock className="mr-1 h-3 w-3" />Pending review</Badge>}
        {!freeTrial && payment?.status === "rejected" && <Badge variant="destructive" className="ml-auto">Rejected</Badge>}
      </div>
      {freeTrial ? (
        <p className="text-xs text-muted-foreground">
          {payment?.reference_note ?? "Your first 5 company connections are included in the free trial. Contacts, files, and meetings are unlocked."}
        </p>
      ) : !payment || payment.status === "rejected" ? (
        <div className="space-y-3">
          <div className="rounded-md border border-border/60 bg-background/60 p-3 text-xs space-y-1">
            <div className="font-semibold text-foreground">Send PKR {PAYMENT_AMOUNTS[tier].toLocaleString()} to one of:</div>
            <div className="flex justify-between"><span className="text-muted-foreground">EasyPaisa</span><span>03132790207 · <span className="font-medium">Ata ur Rehman</span></span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">JazzCash</span><span>03132790207 · <span className="font-medium">Muniza Ata</span></span></div>
            <div className="pt-1 text-muted-foreground">Then upload a screenshot of the payment confirmation below.</div>
          </div>
          <div>
            <Label className="text-xs">Payment screenshot (PNG/JPG, max 5MB)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything we should know" />
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={busy || !file} variant="hero"><Upload className="mr-2 h-4 w-4" />{busy ? "Uploading..." : "Submit payment"}</Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Screenshot submitted. You'll be notified once an admin verifies it.</p>
      )}
    </Card>
  );
}