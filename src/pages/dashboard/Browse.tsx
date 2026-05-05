import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Search, Inbox } from "lucide-react";
import { INDUSTRIES, PITCH_TYPES } from "@/lib/constants";
import { toast } from "sonner";

type Pitch = {
  id: string;
  title: string;
  description: string;
  industry: string;
  pitch_type: string;
  asking_amount: number | null;
  expires_at: string;
  startup_id: string;
};

const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

const Browse = () => {
  const { user } = useAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [responded, setResponded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("pitches").select("*").eq("status", "open").order("created_at", { ascending: false });
    setPitches((data as Pitch[]) ?? []);
    if (user) {
      const { data: r } = await supabase.from("pitch_responses").select("pitch_id").eq("company_id", user.id);
      setResponded(new Set((r ?? []).map((x: any) => x.pitch_id)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = useMemo(() => pitches.filter((p) =>
    (!industry || p.industry === industry) && (!type || p.pitch_type === type)
  ), [pitches, industry, type]);

  return (
    <DashboardShell>
      <div className="container space-y-6 py-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Browse Pitches</h1>
          <p className="mt-1 text-muted-foreground">Respond to startups within 7 days.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Industry:</span>
          <Chip active={!industry} onClick={() => setIndustry(null)}>All</Chip>
          {INDUSTRIES.map((i) => (
            <Chip key={i} active={industry === i} onClick={() => setIndustry(i)}>{i}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Type:</span>
          <Chip active={!type} onClick={() => setType(null)}>All</Chip>
          {PITCH_TYPES.map((t) => (
            <Chip key={t.value} active={type === t.value} onClick={() => setType(t.value)}>{t.label}</Chip>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map((i)=> <Skeleton key={i} className="h-40 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold">No pitches found</h3>
            <p className="text-sm text-muted-foreground">Try changing your filters.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((p) => (
              <PitchCard key={p.id} pitch={p} alreadyResponded={responded.has(p.id)} onResponded={load} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
    }`}
  >{children}</button>
);

const PitchCard = ({ pitch, alreadyResponded, onResponded }: { pitch: Pitch; alreadyResponded: boolean; onResponded: () => void }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const respond = async (decision: "interested" | "declined") => {
    if (!user) return;
    if (message.trim().length < 5) { toast.error("Add a short message"); return; }
    setSending(true);
    const { error } = await supabase.from("pitch_responses").insert({
      pitch_id: pitch.id, company_id: user.id, message: message.trim(), decision,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Response sent");
    setOpen(false);
    onResponded();
  };

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="capitalize">{pitch.pitch_type}</Badge>
        <Badge className="capitalize">{pitch.industry}</Badge>
        <span className="ml-auto flex items-center gap-1 text-xs text-gold"><Clock className="h-3 w-3" /> {daysLeft(pitch.expires_at)}d left</span>
      </div>
      <h3 className="font-display text-lg font-semibold">{pitch.title}</h3>
      <p className="line-clamp-3 text-sm text-muted-foreground">{pitch.description}</p>
      {pitch.asking_amount ? (
        <div className="text-sm"><span className="text-muted-foreground">Asking:</span> <span className="font-semibold text-gold">PKR {pitch.asking_amount.toLocaleString()}</span></div>
      ) : null}
      <div className="mt-1 flex gap-2">
        {alreadyResponded ? (
          <Badge variant="secondary">Responded</Badge>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="hero" size="sm"><Search className="mr-2 h-4 w-4" /> Respond</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Respond to "{pitch.title}"</DialogTitle></DialogHeader>
              <Textarea rows={5} placeholder="Your feedback or message..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => respond("declined")} disabled={sending}>Decline</Button>
                <Button variant="hero" onClick={() => respond("interested")} disabled={sending}>{sending ? "Sending..." : "Mark Interested"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Card>
  );
};

export default Browse;