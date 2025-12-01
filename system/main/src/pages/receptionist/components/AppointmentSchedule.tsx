import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Trash2, Calendar, Clock, User, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useFeedback } from "@/context/FeedbackContext";
import { AppointmentDetailsDialog } from "./AppointmentDetailsDialog";
import { RecycleBinDialog } from "./RecycleBinDialog";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { CreateWalkInDialog } from "../../admin/components/CreateWalkInDialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceptionistCalendar } from "./ReceptionistCalendar";
import { LayoutList, Calendar as CalendarIcon, Star } from "lucide-react";
import { getProfilePictureUrl } from "@/lib/utils";

export interface Appointment {
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
  rating?: number;
  feedback?: string;
  cancellationReason?: string;
  cancellationCategory?: string;
  rejectionReason?: string;
  cancelledByRole?: string;
  cancelledById?: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
  customerAvatar?: string;
}

interface AppointmentScheduleProps {
  selectedAppointmentFromDashboard?: Appointment | null;
  onClearSelection?: () => void;
}

export function AppointmentSchedule({ selectedAppointmentFromDashboard, onClearSelection }: AppointmentScheduleProps) {
  const { showPromise } = useFeedback();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "created" | "updated">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    type: 'reject' | 'cancel';
    appointmentId?: string;
  }>({ open: false, type: 'cancel' });
  const [recycleBinCount, setRecycleBinCount] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const filters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "in-progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
    { id: "rejected", label: "Rejected" }
  ];

  useEffect(() => {
    fetchAppointments();
    fetchRecycleBinCount();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/receptionist/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data.map((c: any) => c.name));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    if (selectedAppointmentFromDashboard) {
      setSelectedAppointment(selectedAppointmentFromDashboard);
      setIsDetailsOpen(true);
    }
  }, [selectedAppointmentFromDashboard]);

  const fetchRecycleBinCount = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/receptionist/appointments/marked-deletion', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setRecycleBinCount(data.length);
        }
      }
    } catch (error) {
      console.error("Error fetching recycle bin count:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/receptionist/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      console.log("Fetched appointments:", data);
      
      if (Array.isArray(data)) {
        const mappedData = data.map((appt: any) => ({
          ...appt,
          status: appt.status.trim().toLowerCase().replace(/[ _]/g, '-'),
          service: appt.category ? `${appt.service} - ${appt.category}` : appt.service,
          serviceId: appt.service_id ? appt.service_id.toString() : undefined,
          customerAvatar: getProfilePictureUrl(appt.customer_profile_picture)
        }));
        setAppointments(mappedData);
      } else {
        console.error("Received non-array data:", data);
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    }
  };

  const handleUpdateDetails = async (id: string, date: string, time: string, technicianId: string) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const promise = async () => {
      const response = await fetch(`http://localhost:5000/api/receptionist/appointments/${id}/details`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, technicianId })
      });

      if (!response.ok) throw new Error("Failed to update details");
      fetchAppointments();
      return "Appointment details updated successfully";
    };

    showPromise(promise(), {
      loading: 'Updating appointment details...',
      success: (data) => data,
      error: 'Failed to update appointment details',
    });
  };

  const handleStatusUpdate = async (id: string, status: string, arg3?: string, arg4?: string) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const promise = async () => {
      if (status === 'deleted') {
        const response = await fetch(`http://localhost:5000/api/receptionist/appointments/${id}/soft`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to delete appointment");
        return "Appointment moved to recycle bin";
      } else {
        let backendStatus = status.charAt(0).toUpperCase() + status.slice(1);
        if (status === 'in-progress') {
            backendStatus = 'In Progress';
        }

        const body: any = { status: backendStatus };
        if (status === 'confirmed' && arg3) {
            body.technicianId = arg3;
        } else if ((status === 'rejected' || status === 'cancelled') && arg3) {
            body.reason = arg3;
            if (arg4) body.category = arg4;
        }

        const response = await fetch(`http://localhost:5000/api/receptionist/appointments/${id}/status`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) throw new Error("Failed to update status");
        return `Appointment ${status}`;
      }
    };

    showPromise(promise(), {
      loading: 'Updating status...',
      success: (data) => {
        fetchAppointments();
        setIsDetailsOpen(false);
        return data;
      },
      error: 'Failed to update status',
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to move ${filteredAppointments.length} appointments to the recycle bin?`)) return;

    const promise = async () => {
      const token = sessionStorage.getItem('token');
      await Promise.all(filteredAppointments.map(apt => 
        fetch(`http://localhost:5000/api/receptionist/appointments/${apt.id}/soft`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
      fetchAppointments();
      return "Appointments moved to recycle bin";
    };

    showPromise(promise(), {
      loading: 'Moving appointments to recycle bin...',
      success: (data) => data,
      error: 'Failed to delete appointments',
    });
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "upcoming":
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "in-progress": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-3 h-3 mr-1" />;
      case "upcoming":
      case "confirmed": return <Calendar className="w-3 h-3 mr-1" />;
      case "completed": return <User className="w-3 h-3 mr-1" />;
      case "cancelled":
      case "rejected": return <Trash2 className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  const filteredAppointments = appointments
    .filter((apt: any) => {
      const matchesSearch = 
        apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.id.includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || apt.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "name") {
        comparison = a.clientName.localeCompare(b.clientName);
      } else if (sortBy === "created") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "updated") {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B4F6C] dark:text-primary">Appointments</h1>
          <p className="text-gray-500 dark:text-muted-foreground">Manage and track all appointments</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 dark:bg-muted p-1 rounded-lg mr-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white dark:bg-card shadow-sm text-[#0B4F6C] dark:text-primary" : "text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground"}`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-md transition-all ${viewMode === "calendar" ? "bg-white dark:bg-card shadow-sm text-[#0B4F6C] dark:text-primary" : "text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground"}`}
              title="Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsRecycleBinOpen(true)}
            className="border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-muted text-gray-600 dark:text-muted-foreground relative"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Recycle Bin
            {recycleBinCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {recycleBinCount}
              </span>
            )}
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[#0B4F6C] dark:bg-sky-600 hover:bg-[#093e54] dark:hover:bg-sky-700 text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-border space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Search client, service, or ID..."
                    className="pl-10 border-gray-200 dark:border-border focus:border-[#0B4F6C] dark:focus:border-primary focus:ring-[#0B4F6C] dark:focus:ring-primary bg-white dark:bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2">
                 <select
                    className="bg-white dark:bg-background border border-gray-300 dark:border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0B4F6C] dark:focus:ring-primary outline-none transition-all hover:border-[#0B4F6C] dark:hover:border-primary text-foreground"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                 >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                 </select>

                 <select 
                    className="bg-white dark:bg-background border border-gray-300 dark:border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0B4F6C] dark:focus:ring-primary outline-none transition-all hover:border-[#0B4F6C] dark:hover:border-primary text-foreground"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                 >
                     <option value="created">Date Created</option>
                     <option value="updated">Date Updated</option>
                     <option value="date">Appointment Date</option>
                     <option value="name">Client Name</option>
                 </select>
                 <button 
                    className="bg-white dark:bg-background border border-gray-300 dark:border-border px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-muted text-gray-600 dark:text-muted-foreground transition-all hover:border-[#0B4F6C] dark:hover:border-primary hover:text-[#0B4F6C] dark:hover:text-primary"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                 >
                     {sortOrder === 'asc' ? '↑' : '↓'}
                 </button>
            </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <Filter className="w-4 h-4 text-gray-500 dark:text-muted-foreground shrink-0" />
          {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap capitalize transition-all font-medium border-2 ${
                  statusFilter === filter.id
                    ? "bg-[#0B4F6C] dark:bg-sky-600 text-white border-[#0B4F6C] dark:border-sky-600 shadow-md"
                    : "bg-white dark:bg-card text-gray-700 dark:text-muted-foreground border-gray-300 dark:border-border hover:border-[#0B4F6C] dark:hover:border-primary hover:text-[#0B4F6C] dark:hover:text-primary"
                }`}
              >
                {filter.label}
              </button>
            )
          )}
          
          <div className="h-6 w-px bg-gray-300 dark:bg-border mx-2" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            disabled={filteredAppointments.length === 0}
            className="text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Move All {statusFilter === 'all' ? '' : statusFilter === 'upcoming' ? 'Confirmed' : statusFilter.replace('-', ' ')} to Bin
          </Button>
        </div>
      </div>

      {/* Appointments List or Calendar */}
      {viewMode === "calendar" ? (
        <ReceptionistCalendar 
          appointments={filteredAppointments} 
          onAppointmentClick={handleViewDetails} 
        />
      ) : (
      <div className="grid gap-4">
        {filteredAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="group bg-white dark:bg-card p-5 rounded-xl shadow-sm border border-gray-100 dark:border-border hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
            onClick={() => handleViewDetails(appointment)}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0B4F6C] dark:bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E6F0F4] to-[#F0F7FA] dark:from-blue-900/20 dark:to-card flex items-center justify-center text-[#0B4F6C] dark:text-primary shrink-0 shadow-inner dark:shadow-none">
                  <User className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-foreground group-hover:text-[#0B4F6C] dark:group-hover:text-primary transition-colors">
                        {appointment.clientName}
                    </h3>
                    <Badge variant="outline" className="text-xs font-normal text-gray-500 dark:text-muted-foreground border-gray-200 dark:border-border">
                        #{appointment.id}
                    </Badge>
                  </div>
                  <p className="text-[#0B4F6C] dark:text-primary font-medium flex items-center gap-2">
                    {appointment.service}
                  </p>
                  {appointment.status === 'completed' && appointment.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-foreground">{appointment.rating}/5</span>
                    </div>
                  )}
                  {(appointment.status === 'cancelled' || appointment.status === 'rejected') && (appointment.cancellationCategory || appointment.rejectionReason) && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      {appointment.status === 'cancelled' ? `Reason: ${appointment.cancellationCategory}` : `Reason: ${appointment.rejectionReason}`}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-muted-foreground">
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-muted/50 px-2 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-muted-foreground" />
                      {appointment.date}
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-muted/50 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-muted-foreground" />
                      {appointment.time}
                    </div>
                    {appointment.phone !== 'N/A' && (
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-muted/50 px-2 py-1 rounded-md">
                            <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-muted-foreground" />
                            {appointment.phone}
                        </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between gap-4 min-w-[140px]">
                <div className="flex flex-col items-end text-xs text-gray-400 dark:text-muted-foreground">
                    {appointment.createdAt && (
                        <span>Created: {new Date(appointment.createdAt).toLocaleDateString()}</span>
                    )}
                    {appointment.updatedAt && (
                        <span>Updated: {new Date(appointment.updatedAt).toLocaleDateString()}</span>
                    )}
                </div>
                <Badge
                  className={`${getStatusColor(
                    appointment.status
                  )} flex items-center px-3 py-1.5 text-xs font-semibold shadow-sm`}
                >
                  {getStatusIcon(appointment.status)}
                  <span className="capitalize">
                    {appointment.status === 'upcoming' ? 'Confirmed' : appointment.status.replace("-", " ")}
                  </span>
                </Badge>
                
                {appointment.technician && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400 dark:text-muted-foreground mb-0.5">Technician</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-foreground">{appointment.technician}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                  {appointment.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white shadow-sm border-0"
                        onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsDetailsOpen(true);
                        }}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white shadow-sm border-0"
                        onClick={() => setStatusDialog({ open: true, type: 'reject', appointmentId: appointment.id })}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {(appointment.status === 'upcoming' || appointment.status === 'confirmed') && (
                      <Button 
                        size="sm" 
                        className="h-8 px-4 bg-orange-600 text-white hover:bg-orange-700 shadow-sm border-0"
                        onClick={() => setStatusDialog({ open: true, type: 'cancel', appointmentId: appointment.id })}
                      >
                        Cancel
                      </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-gray-400 dark:text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                    onClick={() => handleStatusUpdate(appointment.id, 'deleted')}
                    title="Move to Recycle Bin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-card rounded-xl border border-dashed border-gray-300 dark:border-border">
            <div className="w-16 h-16 bg-gray-50 dark:bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-300 dark:text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-1">No appointments found</h3>
            <p className="text-gray-500 dark:text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
      )}

      <AppointmentDetailsDialog
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open && onClearSelection) {
            onClearSelection();
          }
        }}
        appointment={selectedAppointment}
        onStatusUpdate={handleStatusUpdate}
        onUpdateDetails={handleUpdateDetails}
        onCancel={() => {
            if (selectedAppointment) {
                setStatusDialog({ open: true, type: selectedAppointment.status === 'pending' ? 'reject' : 'cancel', appointmentId: selectedAppointment.id });
            }
        }}
      />

      <RecycleBinDialog 
        open={isRecycleBinOpen}
        onOpenChange={setIsRecycleBinOpen}
      />

      <CreateWalkInDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
            fetchAppointments();
        }}
      />

      <StatusChangeDialog 
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog(prev => ({ ...prev, open }))}
        title={statusDialog.type === 'reject' ? "Reject Appointment" : "Cancel Appointment"}
        description={statusDialog.type === 'reject' 
            ? "Are you sure you want to reject this appointment? This action cannot be undone." 
            : "Are you sure you want to cancel this confirmed appointment?"}
        actionLabel={statusDialog.type === 'reject' ? "Reject Appointment" : "Cancel Appointment"}
        variant="destructive"
        role="staff"
        onConfirm={async (reason, category) => {
            if (statusDialog.appointmentId) {
                const status = statusDialog.type === 'reject' ? 'rejected' : 'cancelled';
                await handleStatusUpdate(statusDialog.appointmentId, status, reason, category);
            }
        }}
      />
    </div>
  );
}
