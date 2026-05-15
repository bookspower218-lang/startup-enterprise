import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

type Pitch = { id: string; startup_id: string; target_company_id: string | null; problem: string | null; industry: string; status: string };
type Profile = { user_id: string; full_name: string | null; company_name: string | null };
type LastMsg = { pitch_id: string; body: string; created_at: string; sender_id: string };

export default function Chat() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [lastMsg, setLastMsg] = useState<Record<string, LastMsg>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    // Pitches I'm part of
    const { data: ps } = await supabase
      .from("pitches")
      .select("id,startup_id,target_company_id,problem,industry,status")
      .or(`startup_id.eq.${user.id},target_company_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });
    const list = (ps as Pitch[]) ?? [];
    setPitches(list);

    // Get last message per pitch
    if (list.length) {
      const ids = list.map((p) => p.id);
      const { data: msgs } = await supabase
        .from("messages")
        .select("pitch_id,body,created_at,sender_id")
        .in("pitch_id", ids)
        .order("created_at", { ascending: false });
      const map: Record<string, LastMsg> = {};
      (msgs ?? []).forEach((m: any) => { if (!map[m.pitch_id]) map[m.pitch_id] = m; });
      setLastMsg(map);

      const userIds = Array.from(new Set([
        ...list.map((p) => p.startup_id),
        ...list.map((p) => p.target_company_id).filter(Boolean) as string[],
        ...Object.values(map).map((m) => m.sender_id),
      ]));
      const { data: profs } = await supabase.from("profiles").select("user_id,full_name,company_name").in("user_id", userIds);
      const pmap: Record<string, Profile> = {};
      (profs as Profile[] ?? []).forEach((p) => (pmap[p.user_id] = p));
      setProfiles(pmap);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`chats-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <DashboardShell>
      <div className="container py-8 space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Chats</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your conversations across pitches.</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : pitches.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">Once a company shows interest in a pitch, the chat appears here.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pitches.map((p) => {
              const otherId = user!.id === p.startup_id ? p.target_company_id : p.startup_id;
              const other = otherId ? profiles[otherId] : undefined;
              const lm = lastMsg[p.id];
              const lmSender = lm ? profiles[lm.sender_id] : undefined;
              const otherName = other?.company_name || other?.full_name || "Conversation";
              return (
                <Link key={p.id} to={`/pitches/${p.id}`}>
                  <Card className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/40">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {otherName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{otherName}</span>
                        <Badge variant="outline" className="text-[10px]">{p.industry}</Badge>
                        <Badge variant="secondary" className="ml-auto text-[10px] capitalize">{p.status}</Badge>
                      </div>
                      {lm ? (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {lm.sender_id === user!.id ? "You" : (lmSender?.company_name || lmSender?.full_name || "Them")}:
                          </span>{" "}
                          {lm.body}
                        </p>
                      ) : (
                        <p className="mt-1 truncate text-xs italic text-muted-foreground">No messages yet · {p.problem?.slice(0, 80)}</p>
                      )}
                    </div>
                    {lm && <span className="shrink-0 text-[10px] text-muted-foreground">{new Date(lm.created_at).toLocaleDateString()}</span>}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
