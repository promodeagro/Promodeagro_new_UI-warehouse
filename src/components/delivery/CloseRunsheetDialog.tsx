import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface CloseRunsheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runsheetId: string;
  delivered: number;
  total: number;
  expectedCOD: number;
  prepaidTotal: number;
  onConfirm: () => void;
}

export default function CloseRunsheetDialog({
  open,
  onOpenChange,
  runsheetId,
  delivered,
  total,
  expectedCOD,
  prepaidTotal,
  onConfirm,
}: CloseRunsheetDialogProps) {
  const [ackCOD, setAckCOD] = useState(false);
  const [ackComplete, setAckComplete] = useState(false);

  const canClose = ackCOD && ackComplete;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Close Runsheet</DialogTitle>
          <DialogDescription>
            Review summary for <span className="font-medium text-foreground">{runsheetId}</span> and confirm closure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-card border">
              <p className="text-muted-foreground">Delivered</p>
              <p className="text-xl font-bold text-foreground">{delivered}/{total}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border">
              <p className="text-muted-foreground">Completion</p>
              <p className="text-xl font-bold text-foreground">{Math.round((delivered / Math.max(total, 1)) * 100)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-card border">
              <p className="text-muted-foreground">Prepaid Total</p>
              <p className="text-xl font-bold text-success">₹{prepaidTotal.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border">
              <p className="text-muted-foreground">Expected COD</p>
              <p className="text-xl font-bold text-warning">₹{expectedCOD.toLocaleString()}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox id="ack-cod" checked={ackCOD} onCheckedChange={(v) => setAckCOD(Boolean(v))} />
              <Label htmlFor="ack-cod" className="leading-snug">
                I confirm COD collection for this runsheet has been verified (or discrepancy recorded).
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="ack-complete" checked={ackComplete} onCheckedChange={(v) => setAckComplete(Boolean(v))} />
              <Label htmlFor="ack-complete" className="leading-snug">
                I confirm all deliveries and returns are recorded and the runsheet can be closed.
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="hover:border-primary/50">
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!canClose} className="hover:shadow-lg">
            Close Runsheet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
