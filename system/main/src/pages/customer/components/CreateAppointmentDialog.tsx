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
import { Checkbox } from "../../../components/ui/checkbox"; // Assuming you have this component
import { useFeedback } from "@/context/FeedbackContext";

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialServiceId?: string;
  initialDate?: string;
  onSuccess?: () => void;
}

export function CreateAppointmentDialog({ open, onOpenChange, initialServiceId, initialDate, onSuccess }: CreateAppointmentDialogProps) {
  const { showPromise } = useFeedback();
  const [formData, setFormData] = useState({
    serviceId: initialServiceId || '',
    date: initialDate || '',
    time: '',
    address: '', 
    notes: '',
  });
  const [services, setServices] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchServices();
      fetchAddresses();
      setFormData(prev => ({
        ...prev,
        serviceId: initialServiceId || prev.serviceId,
        date: initialDate || prev.date
      }));
    }
  }, [open, initialServiceId, initialDate]);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services');
      const data = await response.json();
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const response = await fetch('http://localhost:5000/api/customer/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setAddresses(data);
        // Pre-select default address if available
        const defaultAddr = data.find((a: any) => a.is_default);
        if (defaultAddr) {
            setSelectedAddressId(defaultAddr.address_id.toString());
            setFormData(prev => ({ ...prev, address: defaultAddr.address_line }));
        } else if (data.length > 0) {
            setSelectedAddressId(data[0].address_id.toString());
            setFormData(prev => ({ ...prev, address: data[0].address_line }));
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleAddressChange = (value: string) => {
    setSelectedAddressId(value);
    if (value === 'new') {
        setFormData(prev => ({ ...prev, address: '' }));
    } else {
        const addr = addresses.find(a => a.address_id.toString() === value);
        if (addr) {
            setFormData(prev => ({ ...prev, address: addr.address_line }));
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const promise = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to book an appointment.');
      }

      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          date: formData.date,
          time: formData.time,
          notes: formData.notes,
          address: formData.address,
          saveAddress: selectedAddressId === 'new' && saveNewAddress
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Booking failed');
      }

      setFormData({ serviceId: '', date: '', time: '', address: '', notes: '' });
      setSaveNewAddress(false);
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
      return 'Appointment booked successfully!';
    };

    try {
        await showPromise(promise(), {
            loading: 'Booking appointment...',
            success: (data) => data,
            error: (err) => err instanceof Error ? err.message : 'Booking failed',
        });
    } catch (error) {
        // Error handled by showPromise
    } finally {
        setIsLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A5560]">Book New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details below to schedule your service appointment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="service" className="text-[#1A5560]">
              Service Type *
            </Label>
            <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
              <SelectTrigger className="border-[#1A5560]/20 focus:border-[#3FA9BC]">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-[#1A5560]">
                Preferred Date *
              </Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="border-[#1A5560]/20 focus:border-[#3FA9BC]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-[#1A5560]">
                Preferred Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="border-[#1A5560]/20 focus:border-[#3FA9BC]"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-[#1A5560]">
              Service Address *
            </Label>
            <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                <SelectTrigger className="border-[#1A5560]/20 focus:border-[#3FA9BC]">
                    <SelectValue placeholder="Select address" />
                </SelectTrigger>
                <SelectContent>
                    {addresses.map((addr) => (
                        <SelectItem key={addr.address_id} value={addr.address_id.toString()}>
                            {addr.address_label} - {addr.address_line}
                        </SelectItem>
                    ))}
                    <SelectItem value="new">+ Enter New Address</SelectItem>
                </SelectContent>
            </Select>
            
            {selectedAddressId === 'new' && (
                <div className="mt-2 space-y-2">
                    <Textarea
                        id="new-address"
                        placeholder="Enter complete address (Street, Barangay, City, Province)"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="border-[#1A5560]/20 focus:border-[#3FA9BC] min-h-[80px]"
                        required
                    />
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="save-address" 
                            checked={saveNewAddress}
                            onCheckedChange={(checked) => setSaveNewAddress(checked as boolean)}
                        />
                        <label
                            htmlFor="save-address"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600"
                        >
                            Save this address for future use
                        </label>
                    </div>
                </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[#1A5560]">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describe the issue or provide any specific instructions..."
              className="border-[#1A5560]/20 focus:border-[#3FA9BC] min-h-[100px]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-[#1A5560] text-[#1A5560] hover:bg-[#1A5560]/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#3FA9BC] hover:bg-[#2A6570] text-white transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Booking...' : 'Book Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
