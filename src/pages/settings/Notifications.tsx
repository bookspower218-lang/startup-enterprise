import { useEffect, useState } from "react";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TYPES: { key: string; label: string; desc: string }[] = [
  { key: "pitch_received", label: "Pitch received", desc: "When a startup sends you a new pitch (companies)." },
  { key: "interest_shown", label: "Interest shown", desc: "When a company shows interest in your pitch (startups)." },
  { key: "pitch_passed", label: "Pitch passed", desc: "When a company passes on your pitch (startups)." },
  { key: "message_received", label: "Message received", desc: "When the other party sends a chat message." },
  { key: "stage4_unlocked", label: "Stage 4 unlocked", desc: "When full contact details become available." },
  { key: "sla_reminder", label: "SLA reminders", desc: "Day-5 / Day-7 SLA reminder emails." },
  { key: "payment_status", label: "Payment updates", desc: "When a payment is verified or rejected." },
  { key: "rating_reminder", label: "Rating reminder", desc: "Reminder to rate the other party after Stage 4." },
];

const NotificationSettings = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_notification_prefs").select("key,enabled").eq("user_id", user.id);
      const map: Record<string, boolean> = {};
      TYPES.forEach((t) => (map[t.key] = true));
      (data ?? []).forEach((row: any) => (map[row.key] = row.enabled));
      setPrefs(map);
      setLoading(false);
    })();
  }, [user]);

  const toggle = async (key: string, enabled: boolean) => {
    if (!user) return;
    setPrefs((p) => ({ ...p, [key]: enabled }));
    const { error } = await supabase
      .from("user_notification_prefs")
      .upsert({ user_id: user.id, key, enabled }, { onConflict: "user_id,key" });
    if (error) toast.error(error.message);
  };

  return (
    <DashboardShell>
      <div className="container max-w-2xl space-y-6 py-8">
        <h1 className="font-display text-3xl font-bold">Email notifications</h1>
        <p className="text-sm text-muted-foreground">Choose which transactional emails you'd like to receive. Welcome and security emails are always sent.</p>

        <Card className="divide-y divide-border/40">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : TYPES.map((t) => (
            <div key={t.key} className="flex items-start justify-between gap-4 p-4">
              <div className="flex-1">
                <Label className="font-medium">{t.label}</Label>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
              <Switch checked={prefs[t.key] ?? true} onCheckedChange={(v) => toggle(t.key, v)} />
            </div>
          ))}
        </Card>
      </div>
    </DashboardShell>
  );
};

export default NotificationSettings;