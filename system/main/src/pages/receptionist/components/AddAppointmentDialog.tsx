import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useFeedback } from "../../../context/FeedbackContext";
import { Appointment } from './AppointmentSchedule';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

interface AddAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAppointment: (appointment: Appointment) => void;
}

interface Service {
  service_id: number;
  name: string;
  category_name?: string;
}

interface Technician {
  user_id: number;
  first_name: string;
  last_name: string;
}

interface ConflictDetails {
  appointmentId: number;
  serviceName: string;
  customerName: string;
  startTime: string;
  endTime: string;
}

export function AddAppointmentDialog({
  open,
  onOpenChange,
  onAddAppointment,
}: AddAppointmentDialogProps) {
  const { showPromise } = useFeedback();
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    email: '',
    address: '',
    serviceId: '',
    date: '',
    time: '',
    technicianId: '',
    notes: '',
  });
  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  
  const [conflict, setConflict] = useState<ConflictDetails | null>(null);
  const [overrideConflict, setOverrideConflict] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchTechnicians();
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        clientName: '',
        phone: '',
        email: '',
        address: '',
        serviceId: '',
        date: '',
        time: '',
        technicianId: '',
        notes: '',
      });
      setConflict(null);
      setOverrideConflict(false);
    }
  }, [open]);

  // Conflict check
  useEffect(() => {
    const check = async () => {
      if (formData.technicianId && formData.date && formData.time && formData.serviceId) {
        
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/receptionist/appointments/check-conflict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              technicianId: formData.technicianId,
              date: formData.date,
              time: formData.time,
              serviceId: formData.serviceId
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
  }, [formData.technicianId, formData.date, formData.time, formData.serviceId]);

  const fetchServices = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/receptionist/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/receptionist/technicians', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTechnicians(data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.clientName || !formData.phone || !formData.serviceId || !formData.date || !formData.time) {
      showPromise(Promise.reject(new Error('Please fill in all required fields')), {
        loading: 'Validating...',
        success: () => '',
        error: (err) => err.message
      });
      return;
    }

    if (conflict && !overrideConflict) return;

    const promise = async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/receptionist/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
            ...formData,
            overrideConflict
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add appointment');
      }

      onAddAppointment({} as any); // Trigger refresh in parent
      
      // Reset form
      setFormData({
        clientName: '',
        phone: '',
        email: '',
        address: '',
        serviceId: '',
        date: '',
        time: '',
        technicianId: '',
        notes: '',
      });
      setConflict(null);
      setOverrideConflict(false);
      
      onOpenChange(false);
      return 'Walk-in appointment added successfully';
    };

    showPromise(promise(), {
      loading: 'Adding appointment...',
      success: (data) => data,
      error: (err) => err.message || 'Failed to add appointment',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0B4F6C]">Add Walk-In Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment for walk-in customers
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="bg-[#E5F4F5] rounded-lg p-4">
            <h3 className="text-[#0B4F6C] mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName" className="text-[#0B4F6C]">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Enter client name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-[#0B4F6C]">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+63 XXX XXX XXXX"
                  className="mt-1"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="email" className="text-[#0B4F6C]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@email.com"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-[#0B4F6C]">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-[#E5F4F5] rounded-lg p-4">
            <h3 className="text-[#0B4F6C] mb-4">Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service" className="text-[#0B4F6C]">
                  Service <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.service_id} value={service.service_id.toString()}>
                        {service.category_name ? `${service.name} - ${service.category_name}` : service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="technician" className="text-[#0B4F6C]">Assign Technician</Label>
                <Select
                  value={formData.technicianId}
                  onValueChange={(value) => setFormData({ ...formData, technicianId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.user_id} value={tech.user_id.toString()}>
                        {tech.first_name} {tech.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date" className="text-[#0B4F6C]">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={new Date().toLocaleDateString('en-CA')}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-[#0B4F6C]">
                  Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Conflict Warning */}
          {conflict && (
            <Alert variant="destructive" className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Scheduling Conflict Detected</AlertTitle>
              <AlertDescription>
                This technician is already booked for <strong>{conflict.serviceName}</strong> with {conflict.customerName} from {new Date(conflict.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} to {new Date(conflict.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.
              </AlertDescription>
              <div className="mt-2 flex items-center space-x-2">
                <Checkbox 
                  id="override" 
                  checked={overrideConflict}
                  onCheckedChange={(checked) => setOverrideConflict(checked as boolean)}
                />
                <label
                  htmlFor="override"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ignore conflict and book anyway
                </label>
              </div>
            </Alert>
          )}

          {/* Notes */}
          <div className="bg-[#E5F4F5] rounded-lg p-4">
            <Label htmlFor="notes" className="text-[#0B4F6C]">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes or special instructions..."
              rows={3}
              className="w-full mt-2"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0B4F6C] hover:bg-[#145A75]"
            >
              Add Appointment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
