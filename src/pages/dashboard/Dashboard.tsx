import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Inbox, TrendingUp, Plus } from "lucide-react";

const Dashboard = () => {
  const { profile, loading } = useAuth();
  const [stats, setStats] = useState({ pitches: 0, responses: 0, open: 0 });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      setBusy(true);
      if (profile.account_type === "startup") {
        const { data: pitches } = await supabase.from("pitches").select("id,status").eq("startup_id", profile.user_id);
        const ids = (pitches ?? []).map((p) => p.id);
        const { count } = ids.length
          ? await supabase.from("pitch_responses").select("id", { count: "exact", head: true }).in("pitch_id", ids)
          : { count: 0 };
        setStats({
          pitches: pitches?.length ?? 0,
          open: pitches?.filter((p) => p.status === "open").length ?? 0,
          responses: count ?? 0,
        });
      } else {
        const { count: openCount } = await supabase.from("pitches").select("id", { count: "exact", head: true }).eq("status", "open");
        const { count: myResp } = await supabase.from("pitch_responses").select("id", { count: "exact", head: true }).eq("company_id", profile.user_id);
        setStats({ pitches: openCount ?? 0, responses: myResp ?? 0, open: openCount ?? 0 });
      }
      setBusy(false);
    };
    load();
  }, [profile?.user_id, profile?.account_type, profile?.industry]);

  if (loading || !profile) {
    return (
      <DashboardShell>
        <div className="container py-8"><Skeleton className="h-32 w-full" /></div>
      </DashboardShell>
    );
  }

  const isCompany = profile.account_type === "company";

  return (
    <DashboardShell>
      <div className="container space-y-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Welcome, {profile.full_name?.split(" ")[0] || "there"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {isCompany ? "Browse and respond to startup pitches in your industry." : "Pitch your idea to validator companies."}
            </p>
          </div>
          {!isCompany && (
            <Button asChild variant="hero">
              <Link to="/pitches/new"><Plus className="mr-2 h-4 w-4" /> New Pitch</Link>
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={FileText}
            label={isCompany ? "Open Pitches" : "Total Pitches"}
            value={busy ? "—" : stats.pitches}
          />
          <StatCard icon={Inbox} label={isCompany ? "Your Responses" : "Responses Received"} value={busy ? "—" : stats.responses} />
          <StatCard icon={TrendingUp} label={isCompany ? "Industry" : "Open Pitches"} value={busy ? "—" : isCompany ? profile.industry || "—" : stats.open} />
        </div>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">Quick links</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {isCompany ? (
              <Button asChild variant="outline"><Link to="/browse">Browse Pitches</Link></Button>
            ) : (
              <>
                <Button asChild variant="outline"><Link to="/pitches">My Pitches</Link></Button>
                <Button asChild variant="outline"><Link to="/pitches/new">Create Pitch</Link></Button>
              </>
            )}
            <Button asChild variant="ghost"><Link to="/profile">Edit Profile</Link></Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: any }) => (
  <Card className="p-5">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-bold">{value}</div>
      </div>
    </div>
  </Card>
);

export default Dashboard;