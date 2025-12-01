import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actionLabel: string;
  onConfirm: (reason: string, category: string) => Promise<void>;
  variant?: "default" | "destructive";
  role?: "customer" | "staff";
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  onConfirm,
  variant = "default",
  role = "staff"
}: StatusChangeDialogProps) {
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const customerCategories = [
    "Change of plans",
    "Found another service",
    "Budget constraints",
    "Emergency",
    "Other"
  ];

  const staffCategories = [
    "No available technician",
    "Scheduling conflict",
    "Service unavailable",
    "Customer request",
    "Duplicate booking",
    "Other"
  ];

  const categories = role === "customer" ? customerCategories : staffCategories;

  const handleConfirm = async () => {
    if (!category) return;
    if (category === "Other" && !reason.trim()) return;
    
    setLoading(true);
    try {
      await onConfirm(reason, category);
      onOpenChange(false);
      setReason("");
      setCategory("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-card dark:text-foreground">
        <DialogHeader>
          <DialogTitle className="dark:text-foreground">{title}</DialogTitle>
          {description && <p className="text-sm text-gray-500 dark:text-muted-foreground">{description}</p>}
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-foreground">Reason Category <span className="text-red-500">*</span></Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white dark:bg-background dark:border-input dark:text-foreground">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-popover dark:text-popover-foreground">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="dark:text-foreground">
              Additional Details 
              {category === "Other" ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs ml-1">(Optional)</span>}
            </Label>
            <Textarea
              placeholder="Please provide more specific details..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={!category || (category === "Other" && !reason.trim()) || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
