import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Paperclip, Download } from "lucide-react";
import { toast } from "sonner";

type Att = { id: string; file_path: string; file_name: string; uploader_id: string; created_at: string };

export default function AttachmentsPanel({ pitchId }: { pitchId: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Att[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("pitch_attachments").select("*").eq("pitch_id", pitchId).order("created_at", { ascending: false });
    setItems((data as Att[]) ?? []);
  };
  useEffect(() => { load(); }, [pitchId]);

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB.");
    setBusy(true);
    const path = `${user.id}/${pitchId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("pitch-files").upload(path, file);
    if (error) { setBusy(false); return toast.error(error.message); }
    const { error: e2 } = await supabase.from("pitch_attachments").insert({
      pitch_id: pitchId, uploader_id: user.id, file_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size,
    });
    setBusy(false);
    if (e2) return toast.error(e2.message);
    toast.success("Uploaded");
    load();
  };

  const download = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("pitch-files").createSignedUrl(path, 60);
    if (error || !data) return toast.error("Could not get file.");
    const a = document.createElement("a");
    a.href = data.signedUrl; a.download = name; a.click();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold"><Paperclip className="h-4 w-4" /> Attachments</div>
        <label className="cursor-pointer">
          <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button asChild size="sm" variant="outline" disabled={busy}><span>{busy ? "Uploading..." : "Upload"}</span></Button>
        </label>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No files yet. PDF or image, max 10MB.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-2">
              <button onClick={() => download(a.file_path, a.file_name)} className="flex items-center gap-1 text-primary hover:underline">
                <Download className="h-3 w-3" />{a.file_name}
              </button>
              <span className="text-xs text-muted-foreground">· {new Date(a.created_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}