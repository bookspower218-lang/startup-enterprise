import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, MessageSquare } from "lucide-react";
import { INDUSTRIES, PITCH_TYPES } from "@/lib/constants";
import { toast } from "sonner";

type Pitch = {
  id: string; problem: string | null; solution: string | null; short_note: string | null;
  industry: string; pitch_type: string; status: string; created_at: string;
  startup_id: string;
};
type Profile = { user_id: string; full_name: string | null; company_name: string | null };

const Browse = () => {
  const { user } = useAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [responded, setResponded] = useState<Record<string, "interested" | "pass">>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    // Validators see all pitches in the platform (open + targeted to anyone).
    const { data } = await supabase
      .from("pitches")
      .select("*")
      .neq("startup_id", user.id)
      .order("created_at", { ascending: false });
    const list = (data as Pitch[]) ?? [];
    setPitches(list);

    const ids = Array.from(new Set(list.map((p) => p.startup_id)));
    if (ids.length) {
      const { data: profs } = await supabase.rpc("get_public_profiles", { _user_ids: ids });
      const map: Record<string, Profile> = {};
      (profs as Profile[] ?? []).forEach((p) => (map[p.user_id] = p));
      setProfiles(map);
    }

    const { data: r } = await supabase.from("pitch_responses").select("pitch_id,decision").eq("company_id", user.id);
    const m: Record<string, "interested" | "pass"> = {};
    (r ?? []).forEach((x: any) => (m[x.pitch_id] = x.decision));
    setResponded(m);

    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = useMemo(() => pitches.filter((p) =>
    (!industry || p.industry === industry) && (!type || p.pitch_type === type)
  ), [pitches, industry, type]);

  const respond = async (pitchId: string, decision: "interested" | "pass") => {
    if (!user) return;
    const { error } = await supabase.from("pitch_responses").insert({
      pitch_id: pitchId, company_id: user.id, message: decision === "interested" ? "Interested" : "Pass", decision,
    });
    if (error) return toast.error(error.message);
    toast.success(decision === "interested" ? "Interest sent" : "Pitch passed");
    load();
  };

  return (
    <DashboardShell>
      <div className="container space-y-6 py-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Incoming Pitches</h1>
          <p className="mt-1 text-muted-foreground">Review and decide. You have 7 days per pitch.</p>
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
          <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map((i)=> <Skeleton key={i} className="h-44 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold">No pitches yet</h3>
            <p className="text-sm text-muted-foreground">When startups send you a pitch, it shows up here.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((p) => {
              const startup = profiles[p.startup_id];
              const dec = responded[p.id];
              return (
                <Card key={p.id} className="flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">{p.pitch_type}</Badge>
                    <Badge className="capitalize">{p.industry}</Badge>
                    {dec && <Badge variant={dec === "interested" ? "default" : "secondary"} className="capitalize">{dec}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">From: <span className="font-medium text-foreground">{startup?.full_name || "Founder"}</span></div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Problem</div>
                    <p className="text-sm">{p.problem}</p>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Solution</div>
                    <p className="text-sm">{p.solution}</p>
                  </div>
                  {p.short_note && <p className="text-xs italic text-muted-foreground">"{p.short_note}"</p>}
                  <div className="mt-1 flex flex-wrap gap-2">
                    {dec === "interested" ? (
                      <Button asChild size="sm" variant="hero"><Link to={`/pitches/${p.id}`}><MessageSquare className="mr-2 h-4 w-4" /> Open conversation</Link></Button>
                    ) : dec === "pass" ? (
                      <Badge variant="secondary">Closed</Badge>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => respond(p.id, "interested")} className="bg-success text-success-foreground hover:bg-success/90">Show Interest</Button>
                        <Button size="sm" variant="secondary" onClick={() => respond(p.id, "pass")}>Pass</Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
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

export default Browse;
