import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Calendar, Clock, MapPin, User, Phone, Mail, FileText, Check, Circle } from 'lucide-react';
import { Button } from "../../../components/ui/button";

interface ViewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onEdit?: (appointment: any) => void;
  onReschedule?: (appointment: any) => void;
}

export function ViewAppointmentDialog({ open, onOpenChange, appointment, onEdit, onReschedule }: ViewAppointmentDialogProps) {
  if (!appointment) return null;

  const statusColors: Record<string, string> = {
    pending: 'bg-orange-500',
    confirmed: 'bg-blue-500',
    in_progress: 'bg-blue-600',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const steps = [
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === appointment.status);
  const isCancelled = appointment.status === 'cancelled';

  const handleEdit = () => {
    if (onEdit) {
      onEdit(appointment);
    }
    onOpenChange(false);
  };

  const handleReschedule = () => {
    if (onReschedule) {
      onReschedule(appointment);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[#1A5560]">Appointment Details</DialogTitle>
            <span className={`${statusColors[appointment.status]} text-white px-3 py-1 rounded-full text-sm`}>
              {statusLabels[appointment.status]}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Order Status Stepper */}
          {!isCancelled && (
            <div className="relative flex items-center justify-between w-full px-2 mb-6">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                <div 
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-[#3FA9BC] -z-10 transition-all duration-500" 
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
                
                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    
                    return (
                        <div key={step.id} className="flex flex-col items-center bg-white px-2">
                            <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                    isCompleted 
                                        ? 'bg-[#3FA9BC] border-[#3FA9BC] text-white' 
                                        : 'bg-white border-gray-300 text-gray-300'
                                }`}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            </div>
                            <span className={`text-xs mt-1 font-medium ${isCompleted ? 'text-[#3FA9BC]' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
          )}

          {isCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mb-4">
                  <p className="text-red-600 font-medium">This appointment has been cancelled.</p>
              </div>
          )}

          {/* Service Information */}
          <div>
            <h3 className="text-[#1A5560] mb-2 text-sm font-semibold">Service Information</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div>
                <p className="text-xs text-[#1A5560]/60">Service Type</p>
                <p className="text-[#1A5560] text-sm">{appointment.service}</p>
              </div>
              <div>
                <p className="text-xs text-[#1A5560]/60">Description</p>
                <p className="text-[#1A5560] text-sm">{appointment.description}</p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-[#1A5560] mb-2 text-sm font-semibold">Schedule</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-[#1A5560]">
                <Calendar className="w-4 h-4 text-[#3FA9BC]" />
                <div>
                  <p className="text-xs text-[#1A5560]/60">Date</p>
                  <p className="text-sm">{appointment.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#1A5560]">
                <Clock className="w-4 h-4 text-[#3FA9BC]" />
                <div>
                  <p className="text-xs text-[#1A5560]/60">Time</p>
                  <p className="text-sm">{appointment.time}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technician Details */}
          <div>
            <h3 className="text-[#1A5560] mb-2 text-sm font-semibold">Technician</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-[#1A5560]">
                <User className="w-4 h-4 text-[#3FA9BC]" />
                <div>
                  <p className="text-xs text-[#1A5560]/60">Name</p>
                  <p className="text-sm">{appointment.technician}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#1A5560]">
                <Phone className="w-4 h-4 text-[#3FA9BC]" />
                <div>
                  <p className="text-xs text-[#1A5560]/60">Phone</p>
                  <p className="text-sm">{appointment.technicianPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#1A5560]">
                <Mail className="w-4 h-4 text-[#3FA9BC]" />
                <div>
                  <p className="text-xs text-[#1A5560]/60">Email</p>
                  <p className="text-sm break-all">{appointment.technicianEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Notes */}
          <div>
            <h3 className="text-[#1A5560] mb-2 text-sm font-semibold">Location & Notes</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              <div className="flex items-start gap-2 text-[#1A5560]">
                <MapPin className="w-4 h-4 text-[#3FA9BC] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#1A5560]/60">Address</p>
                  <p className="text-sm">{appointment.address}</p>
                </div>
              </div>
              {appointment.notes && (
                <div className="flex items-start gap-2 text-[#1A5560]">
                  <FileText className="w-4 h-4 text-[#3FA9BC] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#1A5560]/60">Notes</p>
                    <p className="text-sm">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
              <>
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="flex-1 border-[#3FA9BC] text-[#3FA9BC] hover:bg-[#3FA9BC]/10"
                >
                  Edit Details
                </Button>
                <Button
                  onClick={handleReschedule}
                  className="flex-1 bg-[#3FA9BC] hover:bg-[#2A6570] text-white"
                >
                  Reschedule
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
