import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** When set, user must type this exact string to enable Confirm */
  typedConfirmation?: string;
  onConfirm: () => void | Promise<void>;
};

const ConfirmDialog = ({ open, onOpenChange, title, description, confirmLabel = "Confirm", destructive, typedConfirmation, onConfirm }: Props) => {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const matches = !typedConfirmation || typed === typedConfirmation;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) { onOpenChange(v); if (!v) setTyped(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {typedConfirmation && (
          <div className="space-y-1">
            <Label className="text-xs">Type <span className="font-mono font-semibold">{typedConfirmation}</span> to confirm</Label>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            variant={destructive ? "destructive" : "hero"}
            disabled={busy || !matches}
            onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
          >{busy ? "Working…" : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;