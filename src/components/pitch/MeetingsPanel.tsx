import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";

type Meeting = { id: string; scheduled_at: string; notes: string | null; proposer_id: string };

export default function MeetingsPanel({ pitchId }: { pitchId: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Meeting[]>([]);
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("pitch_meetings").select("*").eq("pitch_id", pitchId).order("scheduled_at", { ascending: true });
    setItems((data as Meeting[]) ?? []);
  };
  useEffect(() => { load(); }, [pitchId]);

  const submit = async () => {
    if (!user) return;
    if (!when) return toast.error("Pick a date & time.");
    setBusy(true);
    const { error } = await supabase.from("pitch_meetings").insert({ pitch_id: pitchId, proposer_id: user.id, scheduled_at: new Date(when).toISOString(), notes: notes || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Meeting proposed");
    setWhen(""); setNotes(""); load();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold"><CalendarClock className="h-4 w-4" /> Meetings</div>
      {items.length > 0 && (
        <ul className="space-y-1 text-sm">
          {items.map((m) => (
            <li key={m.id} className="rounded border border-border/60 p-2">
              <div className="font-medium">{new Date(m.scheduled_at).toLocaleString()}</div>
              {m.notes && <div className="text-xs text-muted-foreground">{m.notes}</div>}
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <Button onClick={submit} disabled={busy} variant="hero">Propose</Button>
      </div>
      <Textarea rows={2} placeholder="Optional agenda..." value={notes} onChange={(e) => setNotes(e.target.value)} />
    </Card>
  );
}