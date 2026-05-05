import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clock, FileText } from "lucide-react";

type Pitch = {
  id: string;
  title: string;
  description: string;
  industry: string;
  pitch_type: string;
  status: string;
  expires_at: string;
  created_at: string;
};

const daysLeft = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const MyPitches = () => {
  const { user } = useAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("pitches").select("*").eq("startup_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setPitches((data as Pitch[]) ?? []); setLoading(false); });
  }, [user]);

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
            <p className="text-sm text-muted-foreground">Create your first pitch to start getting validation.</p>
            <Button asChild variant="hero"><Link to="/pitches/new">Create your first pitch</Link></Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pitches.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                      <Badge variant="outline" className="capitalize">{p.pitch_type}</Badge>
                      <Badge className="capitalize">{p.industry}</Badge>
                      <Badge variant={p.status === "open" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-gold">
                    <Clock className="h-4 w-4" /> {daysLeft(p.expires_at)}d left
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default MyPitches;