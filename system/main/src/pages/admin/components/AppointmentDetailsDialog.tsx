import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, Clock, User, Phone, Mail, MapPin, Wrench, 
  AlertCircle, MessageSquare, Edit2, AlertTriangle, Check, X, 
  Copy, ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  serviceId?: string;
  date: string;
  time: string;
  status: "pending" | "upcoming" | "completed" | "cancelled" | "in-progress" | "confirmed" | "rejected";
  phone: string;
  email: string;
  address: string;
  notes: string;
  technician?: string;
  technicianId?: string;
  rating?: number;
  feedback?: string;
  cancellationReason?: string;
  cancellationCategory?: string;
  rejectionReason?: string;
  cancelledByRole?: string;
  cancelledById?: string;
  created_at?: string;
  updated_at?: string;
  customerAvatar?: string;
}

interface Technician {
  user_id: number;
  first_name: string;
  last_name: string;
}

interface ConflictDetails {
  appointment_id: number;
  service_name: string;
  technician_name: string;
  appointment_date: string;
  duration_minutes: number;
}

interface AppointmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onApprove?: (id: string, technicianId: string, technicianName?: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  onUpdateDetails?: (id: string, date: string, time: string, technicianId: string, overrideConflict?: boolean) => void;
}

export function AppointmentDetailsDialog({
  open,
  onOpenChange,
  appointment,
  onApprove,
  onReject,
  onCancel,
  onUpdateDetails
}: AppointmentDetailsDialogProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  
  const [conflict, setConflict] = useState<ConflictDetails | null>(null);
  const [overrideConflict, setOverrideConflict] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTechnicians();
      if (appointment) {
        setSelectedTechnician(appointment.technicianId || "");
        
        const dateObj = new Date(appointment.date);
        if (!isNaN(dateObj.getTime())) {
            setEditDate(dateObj.toISOString().split('T')[0]);
        }

        if (appointment.time) {
            const [timeStr, modifier] = appointment.time.split(' ');
            let [hours, minutes] = timeStr.split(':');
            if (hours === '12') {
                hours = '00';
            }
            if (modifier === 'PM') {
                hours = (parseInt(hours, 10) + 12).toString();
            }
            setEditTime(`${hours.padStart(2, '0')}:${minutes}`);
        } else {
            setEditTime("");
        }
        
        setIsEditing(false);
        setConflict(null);
        setOverrideConflict(false);
      }
    }
  }, [open, appointment]);

  useEffect(() => {
    const check = async () => {
      if (isEditing && selectedTechnician && editDate && editTime && appointment) {
        try {
          const token = sessionStorage.getItem('token');
          let currentServiceId = appointment.serviceId;
          
          const response = await fetch('http://localhost:5000/api/admin/appointments/check-conflict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              technicianId: selectedTechnician,
              date: editDate,
              time: editTime,
              serviceId: currentServiceId,
              appointmentId: appointment.id
            })
          });
          
          const data = await response.json();
          if (data.conflict) {
            setConflict(data.details);
            setOverrideConflict(false);
          } else {
            setConflict(null);
          }
        } catch (error) {
          console.error("Error checking conflict:", error);
        }
      } else {
        setConflict(null);
      }
    };

    const timeoutId = setTimeout(check, 500);
    return () => clearTimeout(timeoutId);
  }, [isEditing, selectedTechnician, editDate, editTime, appointment]);

  const fetchTechnicians = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/technicians', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTechnicians(data);
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSave = () => {
    if (appointment && onUpdateDetails) {
      if (conflict && !overrideConflict) {
        toast.error("Please resolve the conflict or override it.");
        return;
      }
      onUpdateDetails(appointment.id, editDate, editTime, selectedTechnician, overrideConflict);
      setIsEditing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      confirmed: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      "in-progress": "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      completed: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
      cancelled: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
      rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    };
    return styles[status.toLowerCase()] || "bg-gray-500/15 text-gray-600 border-gray-200";
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border-border shadow-2xl">
        
        {/* Header Section */}
        <div className="p-6 border-b border-border bg-muted/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className={`${getStatusBadge(appointment.status)} capitalize px-3 py-1`}>
                  {appointment.status}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">ID: #{appointment.id}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                {appointment.service}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit2 className="w-4 h-4" /> Edit / Reschedule
                </Button>
              )}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSave} disabled={!!(conflict && !overrideConflict)}>Save Changes</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          
          {/* Left Column: Main Details */}
          <div className="lg:col-span-2 p-6 space-y-8 border-r border-border">
            
            {/* Date & Time Section */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Schedule
              </h3>
              
              {isEditing ? (
                <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <Input 
                        type="date" 
                        value={editDate} 
                        onChange={(e) => setEditDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Input 
                        type="time" 
                        value={editTime} 
                        onChange={(e) => setEditTime(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Technician</label>
                    <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.user_id} value={tech.user_id.toString()}>
                            {tech.first_name} {tech.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {conflict && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Scheduling Conflict</AlertTitle>
                      <AlertDescription>
                        Technician is busy with <strong>{conflict.service_name}</strong> from {new Date(conflict.appointment_date).toLocaleTimeString()} for {conflict.duration_minutes} mins.
                      </AlertDescription>
                      <div className="mt-2 flex items-center gap-2">
                        <Checkbox 
                          id="override" 
                          checked={overrideConflict} 
                          onCheckedChange={(c) => setOverrideConflict(c as boolean)} 
                        />
                        <label htmlFor="override" className="text-sm font-medium cursor-pointer">Override conflict</label>
                      </div>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border shadow-sm min-w-[200px]">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">{new Date(appointment.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border shadow-sm min-w-[200px]">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-medium">{appointment.time}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <Separator />

            {/* Customer & Location */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer
                </h3>
                <Card className="border-border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={appointment.customerAvatar} alt={appointment.clientName} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                          {appointment.clientName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{appointment.clientName}</p>
                        <p className="text-xs text-muted-foreground">Customer</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-sm group">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {appointment.phone}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleCopy(appointment.phone, "Phone")}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm group">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {appointment.email}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleCopy(appointment.email, "Email")}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </h3>
                <Card className="border-border shadow-sm h-full">
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed">{appointment.address}</p>
                    <Button variant="link" className="px-0 text-xs mt-2 h-auto" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(appointment.address)}`, '_blank')}>
                      View on Map <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>

            <Separator />

            {/* Notes */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Notes
              </h3>
              <div className="bg-muted/30 p-4 rounded-xl border border-border text-sm leading-relaxed whitespace-pre-wrap">
                {appointment.notes || "No notes provided."}
              </div>
            </section>

          </div>

          {/* Right Column: Status & Actions */}
          <div className="bg-muted/5 p-6 space-y-6">
            
            {/* Technician Assignment */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Technician
              </h3>
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  {appointment.status === 'pending' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Assign Technician</span>
                      </div>
                      <Select 
                        value={selectedTechnician} 
                        onValueChange={(value) => {
                          setSelectedTechnician(value);
                          // Trigger conflict check if needed, though useEffect handles it if isEditing is true.
                          // Since we are not in isEditing mode here, we might want to manually trigger check or just let the user approve.
                          // For now, we just set the state so Approve button can use it.
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a technician" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {technicians.map((tech) => (
                            <SelectItem key={tech.user_id} value={tech.user_id.toString()}>
                              {tech.first_name} {tech.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : appointment.technician ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.technician}</p>
                        <p className="text-xs text-muted-foreground">Assigned Technician</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Unassigned</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Actions */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Actions</h3>
              
              {appointment.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    onClick={() => onApprove?.(appointment.id, selectedTechnician || appointment.technicianId || "")}
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => onReject?.(appointment.id)}
                  >
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}

              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'rejected' && (
                <Button 
                  variant="outline" 
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                  onClick={() => onCancel?.(appointment.id)}
                >
                  <AlertCircle className="w-4 h-4 mr-2" /> Cancel Appointment
                </Button>
              )}
            </section>

            {/* Metadata */}
            <section className="pt-6 border-t border-border">
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{appointment.created_at ? new Date(appointment.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated</span>
                  <span>{appointment.updated_at ? new Date(appointment.updated_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </section>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}