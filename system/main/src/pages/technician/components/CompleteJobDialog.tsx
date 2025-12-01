import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CompleteJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cost: number, notes: string) => void;
  serviceName?: string;
}

export function CompleteJobDialog({ isOpen, onClose, onConfirm, serviceName }: CompleteJobDialogProps) {
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const numCost = parseFloat(cost);
    if (isNaN(numCost) || numCost < 0) {
      return;
    }
    onConfirm(numCost, notes);
    setCost('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Job</DialogTitle>
          <DialogDescription>
            Enter the final cost and any notes for {serviceName || 'this service'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cost">Total Cost ($)</Label>
            <Input
              id="cost"
              type="number"
              placeholder="0.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional details about the cost..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!cost}>Complete Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
