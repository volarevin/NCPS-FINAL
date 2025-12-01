import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeedback } from "@/context/FeedbackContext";
import { Search, User, Calendar, MapPin, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfilePictureUrl } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateWalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_picture?: string;
  address?: string;
}

interface Service {
  service_id: number;
  name: string;
  estimated_price: number;
}

export function CreateWalkInDialog({ open, onOpenChange, onSuccess }: CreateWalkInDialogProps) {
  const { showPromise } = useFeedback();
  const [activeTab, setActiveTab] = useState("existing");
  
  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Forms
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: ""
  });

  const [guest, setGuest] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const [appointment, setAppointment] = useState({
    service_id: "",
    technician_id: "",
    date: "",
    time: "",
    address: "",
    notes: ""
  });
  
  const [conflictWarning, setConflictWarning] = useState<any>(null);
  const [ignoreConflict, setIgnoreConflict] = useState(false);

  const getApiBase = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'Receptionist') return 'http://localhost:5000/api/receptionist';
    }
    return 'http://localhost:5000/api/admin';
  };

  useEffect(() => {
    fetchServices();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (open) {
      // Reset states
      setSelectedUser(null);
      setSearchQuery("");
      // setSearchResults([]); // Don't clear results, let the effect fetch them
      setNewUser({ firstName: "", lastName: "", email: "", phone: "", address: "" });
      setGuest({ name: "", email: "", phone: "" });
      setAppointment({ service_id: "", technician_id: "", date: "", time: "", address: "", notes: "" });
      setConflictWarning(null);
      setIgnoreConflict(false);
    }
  }, [open]);

  useEffect(() => {
    setConflictWarning(null);
    setIgnoreConflict(false);
  }, [appointment.technician_id, appointment.date, appointment.time, appointment.service_id]);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      // If query is empty, we still fetch to show default list
      // if (searchQuery.length < 2) { ... } // Removed this check

      try {
        const token = sessionStorage.getItem('token');
        const apiBase = getApiBase();
        // If query is empty, backend returns default list (limit 20)
        const url = searchQuery 
          ? `${apiBase}/users?search=${searchQuery}`
          : `${apiBase}/users`;
          
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        // Filter customers
        setSearchResults(data.filter((u: any) => u.role === 'Customer' || !u.role));
      } catch (error) {
        console.error("Error searching users", error);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, open]); // Added open dependency to refresh list when dialog opens

  const fetchServices = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services", error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const apiBase = getApiBase();
      // For receptionist, endpoint might be different or same. 
      // Admin: /api/admin/users?role=Technician
      // Receptionist: /api/receptionist/technicians
      
      let url = `${apiBase}/users?role=Technician`;
      if (apiBase.includes('receptionist')) {
          url = `${apiBase}/technicians`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTechnicians(data);
    } catch (error) {
      console.error("Error fetching technicians", error);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setAppointment(prev => ({ ...prev, address: user.address || "" }));
    setSearchQuery(""); // Clear search to hide list
  };

  const handleSubmit = async () => {
    const token = sessionStorage.getItem('token');
    
    const payload: any = {
      serviceId: appointment.service_id,
      technicianId: appointment.technician_id || null,
      date: appointment.date,
      time: appointment.time,
      address: appointment.address,
      notes: appointment.notes,
      overrideConflict: ignoreConflict
    };

    if (activeTab === "existing") {
      if (!selectedUser) return; // Should show error
      payload.customerId = selectedUser.user_id;
    } else if (activeTab === "new") {
      payload.newUser = newUser;
      // Use new user address if appointment address is empty
      if (!payload.address) payload.address = newUser.address;
    } else if (activeTab === "guest") {
      payload.walkinDetails = guest;
    }

    const promise = async () => {
      const response = await fetch('http://localhost:5000/api/appointments/walkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.conflict) {
            setConflictWarning(data.conflict);
            throw new Error("Scheduling conflict detected. Please review or override.");
        }
        throw new Error(data.message || 'Failed to create appointment');
      }
      return data;
    };

    await showPromise(promise(), {
      loading: 'Booking appointment...',
      success: (data) => `Appointment booked! ID: ${data.appointmentId}`,
      error: (err) => `Error: ${err.message}`
    });

    if (!conflictWarning) {
        onSuccess();
        onOpenChange(false);
    }
  };

  const isFormValid = () => {
    if (!appointment.service_id || !appointment.date || !appointment.time || !appointment.address) return false;
    
    if (activeTab === "existing") return !!selectedUser;
    if (activeTab === "new") return !!(newUser.firstName && newUser.lastName && newUser.email && newUser.phone);
    if (activeTab === "guest") return !!(guest.name && guest.phone); // Email optional for guest?
    
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full sm:max-w-5xl h-[85vh] p-0 flex flex-col overflow-hidden bg-white dark:bg-card dark:text-foreground">
        <div className="p-6 border-b dark:border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl dark:text-foreground">Book Walk-in / Phone Appointment</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Customer Selection - Takes more space */}
            <div className="lg:col-span-7 space-y-6 lg:border-r lg:pr-12 dark:border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted dark:bg-muted/50">
                <TabsTrigger value="existing" className="py-2 whitespace-nowrap data-[state=active]:bg-background dark:data-[state=active]:bg-card dark:text-foreground">Existing User</TabsTrigger>
                <TabsTrigger value="new" className="py-2 whitespace-nowrap data-[state=active]:bg-background dark:data-[state=active]:bg-card dark:text-foreground">Create New User</TabsTrigger>
                <TabsTrigger value="guest" className="py-2 whitespace-nowrap data-[state=active]:bg-background dark:data-[state=active]:bg-card dark:text-foreground">Guest Walk-in</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    className="pl-8 bg-white dark:bg-background dark:border-input dark:text-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="border dark:border-border rounded-md shadow-sm mt-2 max-h-[400px] overflow-y-auto divide-y dark:divide-border bg-white dark:bg-popover">
                      {searchResults.map(user => (
                        <div 
                          key={user.user_id} 
                          className="p-3 hover:bg-gray-50 dark:hover:bg-muted/50 cursor-pointer flex items-center gap-4 transition-colors"
                          onClick={() => handleUserSelect(user)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getProfilePictureUrl(user.profile_picture)} />
                            <AvatarFallback>{user.first_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-foreground">{user.first_name} {user.last_name}</p>
                            <p className="text-sm text-gray-500 dark:text-muted-foreground">{user.email} • {user.phone_number}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedUser && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-900/50 flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getProfilePictureUrl(selectedUser.profile_picture)} />
                      <AvatarFallback>{selectedUser.first_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">{selectedUser.first_name} {selectedUser.last_name}</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-200">{selectedUser.email}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-200">{selectedUser.phone_number}</p>
                      <Button variant="link" className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400" onClick={() => setSelectedUser(null)}>
                        Change Customer
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="new" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="dark:text-foreground">First Name</Label>
                    <Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="bg-white dark:bg-background dark:border-input dark:text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <Label className="dark:text-foreground">Last Name</Label>
                    <Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="bg-white dark:bg-background dark:border-input dark:text-foreground" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="dark:text-foreground">Email</Label>
                  <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="bg-white dark:bg-background dark:border-input dark:text-foreground" />
                </div>
                <div className="space-y-1">
                  <Label className="dark:text-foreground">Phone</Label>
                  <Input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="bg-white dark:bg-background dark:border-input dark:text-foreground" />
                </div>
                <div className="space-y-1">
                  <Label className="dark:text-foreground">Address (Optional)</Label>
                  <Textarea value={newUser.address} onChange={e => setNewUser({...newUser, address: e.target.value})} className="bg-white dark:bg-background dark:border-input dark:text-foreground" />
                </div>
              </TabsContent>

              <TabsContent value="guest" className="space-y-3 mt-4">
                <div className="space-y-1">
                  <Label className="dark:text-foreground">Full Name</Label>
                  <Input value={guest.name} onChange={e => setGuest({...guest, name: e.target.value})} className="bg-white dark:bg-background dark:border-input dark:text-foreground" />
                </div>
                <div className="space-y-1">
                  <Label className="dark:text-foreground">Phone</Label>
                  <Input value={guest.phone} onChange={e => setGuest({...guest, phone: e.target.value})} className="bg-white dark:bg-background dark:border-input dark:text-foreground" />
                </div>
                <div className="space-y-1">
                  <Label className="dark:text-foreground">Email (Optional)</Label>
                  <Input type="email" value={guest.email} onChange={e => setGuest({...guest, email: e.target.value})} className="bg-white dark:bg-background dark:border-input dark:text-foreground" />
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-2">
                  Guest appointments are not linked to a user account.
                </p>
              </TabsContent>
            </Tabs>
          </div>

            {/* Right Column: Appointment Details */}
            <div className="lg:col-span-5 space-y-6 pl-2">
              <h3 className="font-semibold flex items-center gap-2 text-lg dark:text-foreground">
                <Calendar className="h-5 w-5" /> Appointment Details
              </h3>
              
              <div className="space-y-4 bg-gray-50 dark:bg-muted/20 p-6 rounded-lg border dark:border-border">
                <div className="space-y-2">
                  <Label className="dark:text-foreground">Service</Label>
                  <Select value={appointment.service_id} onValueChange={v => setAppointment({...appointment, service_id: v})}>
                    <SelectTrigger className="bg-white dark:bg-background dark:border-input dark:text-foreground">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-popover dark:text-popover-foreground">
                      {services.map(s => (
                        <SelectItem key={s.service_id} value={s.service_id.toString()}>
                          {s.name} - ₱{s.estimated_price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-foreground">Technician (Optional)</Label>
                  <Select value={appointment.technician_id} onValueChange={v => setAppointment({...appointment, technician_id: v})}>
                    <SelectTrigger className="bg-white dark:bg-background dark:border-input dark:text-foreground">
                      <SelectValue placeholder="Select a technician (Optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-popover dark:text-popover-foreground">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {technicians.map(t => (
                        <SelectItem key={t.user_id} value={t.user_id.toString()}>
                          {t.first_name} {t.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="dark:text-foreground">Date</Label>
                    <Input type="date" min={new Date().toLocaleDateString('en-CA')} className="bg-white dark:bg-background dark:border-input dark:text-foreground" value={appointment.date} onChange={e => setAppointment({...appointment, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-foreground">Time</Label>
                    <Input type="time" className="bg-white dark:bg-background dark:border-input dark:text-foreground" value={appointment.time} onChange={e => setAppointment({...appointment, time: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-foreground">Service Address</Label>
                  <div className="flex gap-2">
                    <MapPin className="h-4 w-4 mt-3 text-gray-500 dark:text-muted-foreground" />
                    <Textarea 
                      value={appointment.address} 
                      onChange={e => setAppointment({...appointment, address: e.target.value})} 
                      placeholder="Enter service address..."
                      className="flex-1 bg-white dark:bg-background dark:border-input dark:text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-foreground">Notes (Optional)</Label>
                  <Textarea 
                    value={appointment.notes} 
                    onChange={e => setAppointment({...appointment, notes: e.target.value})} 
                    placeholder="Special instructions..."
                    className="bg-white dark:bg-background dark:border-input dark:text-foreground"
                  />
                </div>

                {conflictWarning && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Scheduling Conflict</AlertTitle>
                    <AlertDescription>
                      Technician has another appointment: {conflictWarning.service_name} ({conflictWarning.appointment_date ? new Date(conflictWarning.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''})
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox id="ignore-conflict" checked={ignoreConflict} onCheckedChange={(c) => setIgnoreConflict(!!c)} />
                        <label htmlFor="ignore-conflict" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Ignore conflict and book anyway
                        </label>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t dark:border-border bg-gray-50 dark:bg-muted/20 mt-auto">
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="dark:bg-background dark:text-foreground dark:border-input dark:hover:bg-muted">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!isFormValid()}>Book Appointment</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
