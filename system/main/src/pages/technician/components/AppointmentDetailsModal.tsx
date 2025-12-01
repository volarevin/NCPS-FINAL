import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, Clock, User, Phone, Mail, MapPin, Star, 
  AlertCircle, MessageSquare, PlayCircle, CheckCircle, XCircle, 
  Copy, Navigation
} from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { CompleteJobDialog } from "./CompleteJobDialog";

interface Appointment {
  id: string;
  customerName: string;
  service: string;
  serviceId?: string;
  date: string;
  time: string;
  phone: string;
  email: string;
  address: string;
  status: "Pending" | "Confirmed" | "In Progress" | "Completed" | "Cancelled" | "Rejected";
  notes: string;
  rating?: number;
  feedback?: string;
  cancellationReason?: string;
  cancellationCategory?: string;
  rejectionReason?: string;
  cancelledByRole?: string;
  cancelledById?: string;
  customerAvatar?: string;
  rawDate?: Date | string;
}

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  onClose: () => void;
  onUpdateStatus: (appointmentId: string, newStatus: "Pending" | "In Progress" | "Completed" | "Cancelled", reason?: string, category?: string, totalCost?: number, costNotes?: string) => void;
  isTechnician?: boolean;
}

export default function AppointmentDetailsModal({ 
  appointment, 
  onClose, 
  onUpdateStatus,
}: AppointmentDetailsModalProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelCategory, setCancelCategory] = useState("");

  const cancellationCategories = [
    "No available technician",
    "Scheduling conflict",
    "Equipment failure",
    "Emergency",
    "Customer Request",
    "Other"
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleNavigate = (address: string) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  const confirmCancelAppointment = () => {
    if (!cancelCategory) {
        toast.error("Please select a cancellation category");
        return;
    }
    onUpdateStatus(appointment.id, "Cancelled", cancelReason, cancelCategory);
    setShowCancelDialog(false);
    setCancelReason("");
    setCancelCategory("");
    onClose();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      Confirmed: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      "In Progress": "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      Completed: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
      Cancelled: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    };
    return styles[status] || "bg-gray-500/15 text-gray-600 border-gray-200";
  };

  const getDateString = () => {
    try {
      const d = appointment.rawDate ? new Date(appointment.rawDate) : new Date(appointment.date);
      if (isNaN(d.getTime())) return appointment.date;
      return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return appointment.date;
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border-border shadow-2xl">
          
          {/* Header Section */}
          <DialogHeader className="p-6 border-b border-border bg-muted/10 space-y-0">
            <DialogDescription className="sr-only">
              Appointment details for {appointment.service}
            </DialogDescription>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className={`${getStatusBadge(appointment.status)} capitalize px-3 py-1`}>
                    {appointment.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">ID: #{appointment.id}</span>
                </div>
                <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {appointment.service}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            
            {/* Left Column: Main Details */}
            <div className="lg:col-span-2 p-6 space-y-8 border-r border-border">
              
              {/* Date & Time Section */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Schedule
                </h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border shadow-sm min-w-[200px]">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">{getDateString()}</p>
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
                          <AvatarImage src={appointment.customerAvatar} alt={appointment.customerName} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                            {appointment.customerName?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{appointment.customerName || 'Unknown Customer'}</p>
                          <p className="text-xs text-muted-foreground">Customer</p>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-sm group">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3 h-3" /> {appointment.phone}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCall(appointment.phone)}>
                              <Phone className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(appointment.phone, "Phone")}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm group">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-3 h-3" /> {appointment.email}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEmail(appointment.email)}>
                              <Mail className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(appointment.email, "Email")}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
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
                    <CardContent className="p-4 flex flex-col h-full justify-between">
                      <p className="text-sm leading-relaxed mb-2">{appointment.address}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => handleNavigate(appointment.address)}
                      >
                        <Navigation className="w-3 h-3" /> Navigate
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

              {/* Ratings & Feedback */}
              {appointment.status === 'Completed' && appointment.rating !== undefined && (
                <>
                  <Separator />
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Star className="w-4 h-4" /> Customer Feedback
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-5 h-5 ${i < (appointment.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} 
                          />
                        ))}
                        <span className="ml-2 font-medium">{appointment.rating}/5</span>
                      </div>
                      {appointment.feedback && (
                        <p className="text-sm leading-relaxed italic text-muted-foreground">
                          "{appointment.feedback}"
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* Cancellation/Rejection Details */}
              {(appointment.status === 'Cancelled' || appointment.status === 'Rejected') && (
                <>
                  <Separator />
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" /> {appointment.status} Details
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 space-y-3">
                      {appointment.cancellationCategory && (
                        <div>
                          <span className="text-xs font-semibold uppercase text-red-600 dark:text-red-400 tracking-wider">Category</span>
                          <p className="font-medium text-red-900 dark:text-red-200">{appointment.cancellationCategory}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-semibold uppercase text-red-600 dark:text-red-400 tracking-wider">Reason</span>
                        <p className="text-sm leading-relaxed text-red-900 dark:text-red-200">
                          {appointment.cancellationReason || appointment.rejectionReason || "No reason provided."}
                        </p>
                      </div>
                      {appointment.cancelledByRole && (
                         <div className="pt-2 border-t border-red-200 dark:border-red-800/30 mt-2">
                            <p className="text-xs text-red-600 dark:text-red-400">
                              Action by: <span className="font-medium capitalize">{appointment.cancelledByRole}</span>
                            </p>
                         </div>
                      )}
                    </div>
                  </section>
                </>
              )}

            </div>

            {/* Right Column: Actions */}
            <div className="bg-muted/5 p-6 space-y-6">
              
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Job Actions</h3>
                
                {appointment.status === 'Confirmed' && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
                    onClick={() => onUpdateStatus(appointment.id, "In Progress")}
                  >
                    <PlayCircle className="w-5 h-5 mr-2" /> Start Job
                  </Button>
                )}

                {appointment.status === 'In Progress' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                    onClick={() => setShowCompleteDialog(true)}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" /> Complete Job
                  </Button>
                )}

                {(appointment.status === 'Confirmed' || appointment.status === 'In Progress') && (
                  <Button 
                    variant="destructive" 
                    className="w-full mt-4"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Cancel Job
                  </Button>
                )}

                {appointment.status === 'Completed' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 p-4 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="font-medium text-green-800 dark:text-green-300">Job Completed</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">Great work!</p>
                  </div>
                )}
              </section>

              {/* Metadata */}
              <section className="pt-6 border-t border-border">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Service Type</span>
                    <span className="font-medium">{appointment.service}</span>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={cancelCategory} onValueChange={setCancelCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason category" />
                </SelectTrigger>
                <SelectContent>
                  {cancellationCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Details</label>
              <Textarea 
                placeholder="Explain why the appointment is being cancelled..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Back</Button>
            <Button variant="destructive" onClick={confirmCancelAppointment}>Confirm Cancellation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CompleteJobDialog 
        isOpen={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        onConfirm={(cost, notes) => {
          onUpdateStatus(appointment.id, "Completed", undefined, undefined, cost, notes);
          onClose();
        }}
        serviceName={appointment.service}
      />
    </>
  );
}