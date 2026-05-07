import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

function Slider3({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="font-medium">{value}/3</span></div>
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <button key={n} onClick={() => onChange(n)} className={`flex-1 rounded border px-2 py-1 text-xs ${value === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{n}</button>
        ))}
      </div>
    </div>
  );
}

export default function RatingPanel({ pitchId, otherUserId }: { pitchId: string; otherUserId: string }) {
  const { user } = useAuth();
  const [existing, setExisting] = useState(false);
  const [c, setC] = useState(2); const [p, setP] = useState(2); const [f, setF] = useState(2);
  const [comment, setComment] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("pitch_ratings").select("id").eq("pitch_id", pitchId).eq("rater_id", user.id).maybeSingle()
      .then(({ data }) => setExisting(!!data));
  }, [pitchId, user]);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("pitch_ratings").insert({
      pitch_id: pitchId, rater_id: user.id, ratee_id: otherUserId,
      communication: c, professionalism: p, follow_through: f, comment: comment || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for rating");
    setExisting(true);
  };

  if (existing) {
    return <Card className="p-4 text-sm text-muted-foreground"><Star className="mr-1 inline h-4 w-4" /> You already rated this conversation.</Card>;
  }
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold"><Star className="h-4 w-4" /> Rate this conversation</div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Slider3 label="Communication" value={c} onChange={setC} />
        <Slider3 label="Professionalism" value={p} onChange={setP} />
        <Slider3 label="Follow-through" value={f} onChange={setF} />
      </div>
      <Textarea rows={2} placeholder="Optional comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
      <Button onClick={submit} disabled={busy} variant="hero" size="sm">Submit rating</Button>
    </Card>
  );
}