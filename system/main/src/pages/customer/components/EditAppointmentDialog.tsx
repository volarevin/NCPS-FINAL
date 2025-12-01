import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useFeedback } from "@/context/FeedbackContext";

interface EditAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
}

export function EditAppointmentDialog({ open, onOpenChange, appointment }: EditAppointmentDialogProps) {
  const { showPromise } = useFeedback();
  const [formData, setFormData] = useState({
    serviceId: '',
    date: '',
    time: '',
    notes: '',
  });
  const [services, setServices] = useState<any[]>([]);
  const [isLoading] = useState(false);
  const [isToday, setIsToday] = useState(false);

  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open]);

  useEffect(() => {
    if (appointment) {
      let formattedDate = '';
      if (appointment.rawDate) {
          const d = new Date(appointment.rawDate);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
          
          const today = new Date();
          setIsToday(d.toDateString() === today.toDateString());
      }

      setFormData({
        serviceId: appointment.serviceId?.toString() || '',
        date: formattedDate,
        time: appointment.time ? convertTo24Hour(appointment.time) : '',
        notes: appointment.notes || '',
      });
    }
  }, [appointment]);

  const convertTo24Hour = (time12h: string) => {
    if (!time12h) return '';
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours}:${minutes}`;
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services');
      const data = await response.json();
      if (Array.isArray(data)) {
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const promise = async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          date: formData.date,
          time: formData.time,
          notes: formData.notes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update appointment');
      }

      onOpenChange(false);
      return "Appointment updated successfully";
    };

    showPromise(promise(), {
      loading: 'Updating appointment...',
      success: (data) => data,
      error: (err) => err instanceof Error ? err.message : 'Failed to update appointment',
    });
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A5560]">Edit Appointment</DialogTitle>
          <DialogDescription>
            Update your appointment details below. Only pending appointments can be edited.
          </DialogDescription>
        </DialogHeader>

        {isToday && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-700 text-sm">
                    You cannot reschedule today's appointment. Please contact us directly if you need assistance.
                </p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="service" className="text-[#1A5560] text-sm">
              Service Type *
            </Label>
            <Select 
              value={formData.serviceId} 
              onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
            >
              <SelectTrigger className="border-[#1A5560]/20 focus:border-[#3FA9BC] h-9">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.service_id} value={service.service_id.toString()}>
                    {service.service_name} - ₱{service.base_price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-[#1A5560] text-sm">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                min={new Date().toLocaleDateString('en-CA')}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="border-[#1A5560]/20 focus:border-[#3FA9BC] h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="time" className="text-[#1A5560] text-sm">
                Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="border-[#1A5560]/20 focus:border-[#3FA9BC] h-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-[#1A5560] text-sm">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describe the issue or provide any specific instructions..."
              className="border-[#1A5560]/20 focus:border-[#3FA9BC] min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-[#1A5560] text-[#1A5560] hover:bg-[#1A5560]/10 h-9"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#3FA9BC] hover:bg-[#2A6570] text-white h-9"
              disabled={isLoading || isToday}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
