import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { detectForbidden, STAGE_BLOCK_MESSAGE } from "@/lib/contentFilter";

type Pitch = {
  id: string; startup_id: string; target_company_id: string | null;
  problem: string | null; solution: string | null; short_note: string | null;
  pitch_type: string; industry: string; status: string; created_at: string;
};
type Msg = { id: string; pitch_id: string; sender_id: string; body: string; created_at: string; read_at: string | null };
type Profile = { user_id: string; full_name: string | null; company_name: string | null; account_type: string };

const MAX_PER_SIDE = 10;
const MAX_LEN = 500;

const PitchThread = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [interested, setInterested] = useState(false);
  const [responseChecked, setResponseChecked] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!id) return;
    const { data: p } = await supabase.from("pitches").select("*").eq("id", id).maybeSingle();
    setPitch(p as Pitch | null);
    if (p) {
      const { data: r } = await supabase.from("pitch_responses").select("decision").eq("pitch_id", id).maybeSingle();
      setInterested(r?.decision === "interested");
      setResponseChecked(true);

      const { data: msgs } = await supabase.from("messages").select("*").eq("pitch_id", id).order("created_at");
      setMessages((msgs as Msg[]) ?? []);

      const ids = Array.from(new Set([(p as Pitch).startup_id, (p as Pitch).target_company_id].filter(Boolean) as string[]));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id,full_name,company_name,account_type").in("user_id", ids);
        const map: Record<string, Profile> = {};
        (profs as Profile[] ?? []).forEach((p) => (map[p.user_id] = p));
        setProfiles(map);
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`pitch-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `pitch_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "pitch_responses", filter: `pitch_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  if (loading) {
    return <DashboardShell><div className="container py-8"><Skeleton className="h-96 w-full" /></div></DashboardShell>;
  }
  if (!pitch || !user) {
    return <DashboardShell><div className="container py-8"><p>Pitch not found.</p></div></DashboardShell>;
  }

  const isStartup = user.id === pitch.startup_id;
  const otherId = isStartup ? pitch.target_company_id : pitch.startup_id;
  const otherProfile = otherId ? profiles[otherId] : undefined;
  const myCount = messages.filter((m) => m.sender_id === user.id).length;
  const otherCount = messages.filter((m) => m.sender_id === otherId).length;
  const canMessage = interested && pitch.status !== "closed";

  const respond = async (decision: "interested" | "pass") => {
    if (!user) return;
    const { error } = await supabase.from("pitch_responses").insert({
      pitch_id: pitch.id, company_id: user.id, message: decision === "interested" ? "Interested" : "Pass", decision,
    });
    if (error) return toast.error(error.message);
    toast.success(decision === "interested" ? "Interest sent" : "Pitch passed");
    load();
  };

  const send = async () => {
    if (!user || !draft.trim()) return;
    if (myCount >= MAX_PER_SIDE) return toast.error(`You've reached ${MAX_PER_SIDE} messages at this stage.`);
    const detect = detectForbidden(draft);
    if (detect) return toast.error(STAGE_BLOCK_MESSAGE);
    setSending(true);
    const { error } = await supabase.from("messages").insert({ pitch_id: pitch.id, sender_id: user.id, body: draft.trim() });
    setSending(false);
    if (error) return toast.error(error.message);
    setDraft("");
  };

  // Mark as read
  useEffect(() => {
    if (!user) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read_at).map((m) => m.id);
    if (unread.length) {
      supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  return (
    <DashboardShell>
      <div className="container max-w-3xl space-y-4 py-8">
        <Link to={isStartup ? "/pitches" : "/browse"} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{pitch.industry}</Badge>
            <Badge variant="outline" className="capitalize">{pitch.pitch_type}</Badge>
            <Badge variant="secondary" className="capitalize">{pitch.status}</Badge>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><div className="text-xs uppercase text-muted-foreground">Problem</div><p className="text-sm">{pitch.problem}</p></div>
            <div><div className="text-xs uppercase text-muted-foreground">Solution</div><p className="text-sm">{pitch.solution}</p></div>
          </div>
          {pitch.short_note && (
            <div className="mt-3"><div className="text-xs uppercase text-muted-foreground">Short note</div><p className="text-sm">{pitch.short_note}</p></div>
          )}
          <div className="mt-3 text-xs text-muted-foreground">
            {isStartup ? "Sent to" : "From"}:{" "}
            <span className="font-medium text-foreground">
              {otherProfile?.company_name || otherProfile?.full_name || "—"}
            </span>
          </div>
        </Card>

        {/* Stage banner */}
        <Card className="border-primary/40 bg-primary/5 p-4">
          {!responseChecked ? null : !interested && pitch.status === "closed" ? (
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-muted-foreground" />
              This pitch was passed. The conversation is closed.
            </div>
          ) : !interested && !isStartup ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">Stage 2 · Decide on this pitch</span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" onClick={() => respond("interested")} className="bg-success text-success-foreground hover:bg-success/90">Show Interest</Button>
                <Button size="sm" variant="secondary" onClick={() => respond("pass")}>Pass</Button>
              </div>
            </div>
          ) : !interested ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" /> Stage 1 · Awaiting company response.
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">Stage 3 · Conversation unlocked</span>
              <Badge variant="outline" className="ml-auto">{myCount} of {MAX_PER_SIDE} messages used</Badge>
            </div>
          )}
        </Card>

        {/* Thread */}
        {interested && (
          <Card className="flex flex-col">
            <div className="max-h-[480px] flex-1 space-y-3 overflow-y-auto p-5">
              {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet. Say hello.</p>}
              {messages.map((m) => {
                const mine = m.sender_id === user.id;
                const sender = profiles[m.sender_id];
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      <div className="mb-0.5 text-[10px] opacity-70">{sender?.company_name || sender?.full_name || "User"}</div>
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {mine && <span>{m.read_at ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {canMessage && (
              <div className="border-t border-border/40 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldAlert className="h-3 w-3" />
                  Sharing emails, phone numbers or external links is blocked at this stage.
                </div>
                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    maxLength={MAX_LEN}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={myCount >= MAX_PER_SIDE ? "Stage limit reached" : "Type a message..."}
                    disabled={myCount >= MAX_PER_SIDE}
                  />
                  <Button onClick={send} disabled={sending || !draft.trim() || myCount >= MAX_PER_SIDE} variant="hero">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-1 text-right text-[10px] text-muted-foreground">{draft.length}/{MAX_LEN} · {myCount}/{MAX_PER_SIDE} sent · other side: {otherCount}/{MAX_PER_SIDE}</div>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardShell>
  );
};

export default PitchThread;
