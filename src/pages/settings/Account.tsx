import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardShell from "@/components/site/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

const Account = () => {
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-user-data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `startup-enterprise-export-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (e: any) {
      toast.error(e.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Account deleted");
      await signOut();
      nav("/");
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  const typedConfirm = profile?.email ?? "DELETE";

  return (
    <DashboardShell>
      <div className="container max-w-2xl space-y-6 py-8">
        <h1 className="font-display text-3xl font-bold">Account & Privacy</h1>

        <Card className="p-6 space-y-2">
          <h2 className="text-lg font-semibold">Download my data</h2>
          <p className="text-sm text-muted-foreground">Get a JSON copy of all data we hold about you — profile, pitches, messages, payments, ratings.</p>
          <Button onClick={exportData} disabled={exporting} variant="outline" className="mt-2">
            <Download className="mr-2 h-4 w-4" />{exporting ? "Preparing…" : "Download JSON"}
          </Button>
        </Card>

        <Card className="p-6 space-y-2 border-destructive/40">
          <h2 className="text-lg font-semibold text-destructive">Delete my account</h2>
          <p className="text-sm text-muted-foreground">Permanently remove your account and all related data. This cannot be undone.</p>
          <Button onClick={() => setConfirmOpen(true)} variant="destructive" className="mt-2">
            <Trash2 className="mr-2 h-4 w-4" />Delete account
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete your account?"
        description="This permanently deletes your profile, pitches, messages, payments, ratings and uploaded files. This action cannot be undone."
        destructive
        confirmLabel="Delete forever"
        typedConfirmation={typedConfirm}
        onConfirm={deleteAccount}
      />
    </DashboardShell>
  );
};

export default Account;