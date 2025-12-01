import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Wrench, Zap, Monitor, Shield, Database, Cpu, Wifi, Briefcase } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address?: string;
  role: string;
}

interface AddTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTechnicianAdded: () => void;
}

export const SPECIALTIES = [
  { value: "Hardware Repair", label: "Hardware Repair", icon: Wrench, color: "text-blue-500", bg: "bg-blue-50" },
  { value: "Software Support", label: "Software Support", icon: Monitor, color: "text-purple-500", bg: "bg-purple-50" },
  { value: "Network Setup", label: "Network Setup", icon: Wifi, color: "text-cyan-500", bg: "bg-cyan-50" },
  { value: "Data Recovery", label: "Data Recovery", icon: Database, color: "text-red-500", bg: "bg-red-50" },
  { value: "System Maintenance", label: "System Maintenance", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50" },
  { value: "Virus Removal", label: "Virus Removal", icon: Shield, color: "text-green-500", bg: "bg-green-50" },
  { value: "Custom Build", label: "Custom Build", icon: Cpu, color: "text-indigo-500", bg: "bg-indigo-50" },
  { value: "Consultation", label: "Consultation", icon: User, color: "text-gray-500", bg: "bg-gray-50" },
  { value: "General", label: "General Technician", icon: Briefcase, color: "text-slate-500", bg: "bg-slate-50" },
];

import { useFeedback } from "@/context/FeedbackContext";

export function AddTechnicianDialog({ open, onOpenChange, onTechnicianAdded }: AddTechnicianDialogProps) {
  const { showPromise } = useFeedback();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [loading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUser(null);
      setSelectedSpecialty("");
      setSearchTerm("");
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      // Filter only customers
      setUsers(data.filter((u: User) => u.role === 'Customer'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handlePromote = async () => {
    if (!selectedUser || !selectedSpecialty) return;

    const promise = async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/technicians/promote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          userId: selectedUser,
          specialty: selectedSpecialty
        })
      });

      if (!response.ok) throw new Error('Failed to promote user');

      onTechnicianAdded();
      onOpenChange(false);
      return "User promoted to technician successfully";
    };

    showPromise(promise(), {
      loading: 'Promoting user...',
      success: (data) => data,
      error: 'Failed to promote user',
    });
  };

  const filteredUsers = users.filter(user => 
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] dark:bg-card dark:text-foreground dark:border-border">
        <DialogHeader>
          <DialogTitle className="dark:text-foreground">Add New Technician</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="dark:text-foreground">Select User to Promote</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 dark:bg-background dark:border-border"
              />
            </div>
            <ScrollArea className="h-[400px] border dark:border-border rounded-md p-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center text-sm text-gray-500 dark:text-muted-foreground py-4">No eligible users found</div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className={`flex items-start justify-between p-3 rounded-md cursor-pointer transition-colors ${
                        selectedUser === user.user_id ? 'bg-[#0B4F6C]/10 dark:bg-primary/20 border-[#0B4F6C] dark:border-primary border' : 'hover:bg-gray-100 dark:hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedUser(user.user_id)}
                    >
                      <div className="flex-1">
                        <p className="font-medium dark:text-foreground">{user.first_name} {user.last_name}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                          <p className="text-xs text-gray-500 dark:text-muted-foreground flex items-center gap-1">
                            <span className="font-semibold">Email:</span> {user.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-muted-foreground flex items-center gap-1">
                            <span className="font-semibold">Phone:</span> {user.phone_number || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-muted-foreground col-span-2 flex items-center gap-1">
                            <span className="font-semibold">Address:</span> {user.address || 'N/A'}
                          </p>
                        </div>
                      </div>
                      {selectedUser === user.user_id && (
                        <div className="h-2 w-2 rounded-full bg-[#0B4F6C] dark:bg-primary mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-foreground">Assign Specialty</Label>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="dark:bg-background dark:border-border">
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:text-popover-foreground dark:border-border">
                {SPECIALTIES.map((spec) => (
                  <SelectItem key={spec.value} value={spec.value}>
                    <div className="flex items-center gap-2">
                      <spec.icon className={`w-4 h-4 ${spec.color}`} />
                      {spec.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="dark:bg-background dark:text-foreground dark:hover:bg-muted dark:border-input">Cancel</Button>
          <Button 
            onClick={handlePromote} 
            disabled={!selectedUser || !selectedSpecialty || loading}
            className="bg-[#0B4F6C] hover:bg-[#093d54] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
          >
            {loading ? "Promoting..." : "Promote to Technician"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
