import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { INDUSTRIES } from "@/lib/constants";

const Profile = () => {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: "", company_name: "", industry: "", website: "", bio: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        company_name: profile.company_name ?? "",
        industry: profile.industry ?? "",
        website: profile.website ?? "",
        bio: profile.bio ?? "",
      });
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("user_id", profile.user_id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    refreshProfile();
  };

  if (!profile) return null;

  return (
    <DashboardShell>
      <div className="container max-w-2xl space-y-6 py-8">
        <h1 className="font-display text-3xl font-bold">Your Profile</h1>
        <Card className="p-6">
          <form onSubmit={save} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input value={profile.email ?? ""} disabled />
            </div>
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            {profile.account_type === "company" && (
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              </div>
            )}
            <div>
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map((i) => (<SelectItem key={i} value={i}>{i}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} />
            </div>
            <Button type="submit" variant="hero" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default Profile;