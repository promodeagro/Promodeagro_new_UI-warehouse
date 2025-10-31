import { Scale, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUnits } from "@/contexts/UnitsContext";
import { useState } from "react";

export default function UnitManagement() {
  const { units, addUnit, updateUnit, removeUnit } = useUnits();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setSymbol("");
  };

  const onSave = () => {
    if (!name.trim() || !symbol.trim()) return;
    if (editId) {
      updateUnit(editId, { name: name.trim(), symbol: symbol.trim() });
    } else {
      addUnit({ name: name.trim(), symbol: symbol.trim() });
    }
    reset();
    setEditId(null);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Unit Measurement
              </CardTitle>
              <CardDescription>Manage units used across products.</CardDescription>
            </div>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add New Unit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Unit Name</th>
                  <th className="text-left p-3 font-medium">Symbol</th>
                  <th className="w-28 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.symbol}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => { setEditId(u.id); setName(u.name); setSymbol(u.symbol); setOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive" onClick={() => setConfirmDeleteId(u.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); setEditId(null); } setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Unit" : "New Unit Measurement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitName">Unit Name *</Label>
              <Input id="unitName" placeholder="Enter Unit name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol Name *</Label>
              <Input id="symbol" placeholder="Enter Symbol name" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>
            <Button onClick={onSave}>{editId ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(v) => { if (!v) setConfirmDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">Are you sure you want to delete this unit? Products using its symbol will still display that text, but the unit will be removed from the picker.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button className="bg-destructive hover:bg-destructive/90" onClick={() => { if (confirmDeleteId) removeUnit(confirmDeleteId); setConfirmDeleteId(null); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


