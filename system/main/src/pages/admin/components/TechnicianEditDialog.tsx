import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Ban, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { SPECIALTIES } from "./AddTechnicianDialog";

interface TechnicianEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician: any;
  onEdit: (id: number, data: any) => Promise<void>;
  onBan: (id: number) => Promise<void>;
  onDemote: (id: number) => Promise<void>;
}

export function TechnicianEditDialog({
  open,
  onOpenChange,
  technician,
  onEdit,
  onBan,
  onDemote
}: TechnicianEditDialogProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    specialty: ""
  });

  useEffect(() => {
    if (technician) {
      setFormData({
        first_name: technician.firstName || technician.name.split(' ')[0],
        last_name: technician.lastName || technician.name.split(' ').slice(1).join(' '),
        phone_number: technician.phone,
        address: technician.location,
        specialty: technician.specialty
      });
    }
  }, [technician]);

  const handleSave = async () => {
    if (technician) {
      await onEdit(parseInt(technician.id), formData);
      onOpenChange(false);
    }
  };

  if (!technician) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] dark:bg-card dark:text-foreground dark:border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0B4F6C] dark:text-primary">Edit Technician Profile</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="dark:text-foreground">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="dark:bg-background dark:border-input dark:text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="dark:text-foreground">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="dark:bg-background dark:border-input dark:text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="dark:text-foreground">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="dark:bg-background dark:border-input dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="dark:text-foreground">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="dark:bg-background dark:border-input dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty" className="dark:text-foreground">Specialty</Label>
            <Select
              value={formData.specialty}
              onValueChange={(val) => setFormData({ ...formData, specialty: val })}
            >
              <SelectTrigger className="dark:bg-background dark:border-input dark:text-foreground">
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:text-popover-foreground dark:border-border">
                {SPECIALTIES.map((specialty) => (
                  <SelectItem key={specialty.value} value={specialty.value}>
                    <div className="flex items-center gap-2">
                      <specialty.icon className={`w-4 h-4 ${specialty.color}`} />
                      <span>{specialty.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={() => onBan(parseInt(technician.id))}
              className="bg-red-100 text-red-600 hover:bg-red-200 border-0 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <Ban className="w-4 h-4 mr-2" />
              Ban User
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onDemote(parseInt(technician.id))}
              className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Demote
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="dark:bg-background dark:text-foreground dark:hover:bg-muted dark:border-input">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#0B4F6C] hover:bg-[#093d54] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
