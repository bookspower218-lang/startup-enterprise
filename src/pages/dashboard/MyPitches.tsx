import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, MessageSquare, Lock } from "lucide-react";

type Pitch = {
  id: string; problem: string | null; solution: string | null;
  industry: string; pitch_type: string; status: string; created_at: string;
  target_company_id: string | null;
};
type Profile = { user_id: string; full_name: string | null; company_name: string | null };

const MyPitches = () => {
  const { user } = useAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [companies, setCompanies] = useState<Record<string, Profile>>({});
  const [responses, setResponses] = useState<Record<string, "interested" | "pass">>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("pitches").select("*").eq("startup_id", user.id).order("created_at", { ascending: false });
      const list = (data as Pitch[]) ?? [];
      setPitches(list);

      const ids = Array.from(new Set(list.map((p) => p.target_company_id).filter(Boolean) as string[]));
      if (ids.length) {
        const { data: profs } = await supabase.rpc("get_public_profiles", { _user_ids: ids });
        const map: Record<string, Profile> = {};
        (profs as Profile[] ?? []).forEach((p) => (map[p.user_id] = p));
        setCompanies(map);
      }

      if (list.length) {
        const { data: r } = await supabase.from("pitch_responses").select("pitch_id,decision").in("pitch_id", list.map((p) => p.id));
        const m: Record<string, "interested" | "pass"> = {};
        (r ?? []).forEach((x: any) => (m[x.pitch_id] = x.decision));
        setResponses(m);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <DashboardShell>
      <div className="container space-y-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">My Pitches</h1>
          <Button asChild variant="hero"><Link to="/pitches/new"><Plus className="mr-2 h-4 w-4" /> New</Link></Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i)=> <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : pitches.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold">No pitches yet</h3>
            <p className="text-sm text-muted-foreground">Send your first pitch to start getting validation.</p>
            <Button asChild variant="hero"><Link to="/pitches/new">Create your first pitch</Link></Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pitches.map((p) => {
              const company = p.target_company_id ? companies[p.target_company_id] : null;
              const dec = responses[p.id];
              return (
                <Card key={p.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="capitalize">{p.pitch_type}</Badge>
                        <Badge className="capitalize">{p.industry}</Badge>
                        <Badge variant={p.status === "open" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
                        {dec && <Badge variant={dec === "interested" ? "default" : "secondary"} className="capitalize">Company: {dec}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sent to: <span className="font-medium text-foreground">{company?.company_name || company?.full_name || "—"}</span>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{p.problem}</p>
                    </div>
                    <div>
                      {dec === "interested" ? (
                        <Button asChild size="sm" variant="hero"><Link to={`/pitches/${p.id}`}><MessageSquare className="mr-2 h-4 w-4" /> Open chat</Link></Button>
                      ) : dec === "pass" ? (
                        <Button asChild size="sm" variant="ghost"><Link to={`/pitches/${p.id}`}>View</Link></Button>
                      ) : (
                        <Button asChild size="sm" variant="outline"><Link to={`/pitches/${p.id}`}><Lock className="mr-2 h-4 w-4" /> Awaiting</Link></Button>
                      )}
                    </div>
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

export default MyPitches;
