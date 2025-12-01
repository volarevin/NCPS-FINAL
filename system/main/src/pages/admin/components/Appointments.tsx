import { PageHeader } from "./PageHeader";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppointmentDetailsDialog } from "./AppointmentDetailsDialog";
import { RecycleBinDialog } from "./RecycleBinDialog";
import { CreateWalkInDialog } from "./CreateWalkInDialog";
import { StatusChangeDialog } from "./StatusChangeDialog";
import {
  Calendar,
  Clock,
  User,
  Search,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  Loader,
  Trash2,
  Phone,
  Star
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFeedback } from "@/context/FeedbackContext";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfilePictureUrl } from "@/lib/utils";

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
  technicianId?: string;
  technician?: string;
  rawDate: Date;
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
  technicianAvatar?: string;
}

export function Appointments() {
  const navigate = useNavigate();
  const { showPromise } = useFeedback();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [recycleBinCount, setRecycleBinCount] = useState(0);
  
  // Dialog states
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    type: 'reject' | 'cancel' | null;
    appointmentId: string | null;
  }>({ open: false, type: null, appointmentId: null });

  const [sortBy, setSortBy] = useState<"date" | "name" | "created" | "updated">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchAppointments();
    fetchRecycleBinCount();
    fetchCategories();
  }, [isRecycleBinOpen]);

  const fetchCategories = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/admin/categories', {
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

  const fetchRecycleBinCount = async () => {
    try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await fetch('http://localhost:5000/api/admin/appointments/recycle-bin/count', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          navigate('/login');
          return;
        }

        const data = await response.json();
        setRecycleBinCount(data.count);
    } catch (error) {
        console.error("Error fetching recycle bin count", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();

      const formatted = data.map((appt: any) => ({
        id: appt.appointment_id.toString(),
        clientName: appt.customer_first_name ? `${appt.customer_first_name} ${appt.customer_last_name}` : (appt.walkin_name || 'Guest'),
        service: appt.service_name,
        serviceId: appt.service_id ? appt.service_id.toString() : undefined,
        date: new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        time: new Date(appt.appointment_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        status: appt.status.trim().toLowerCase().replace(/[ _]/g, '-'),
        phone: appt.customer_phone || appt.walkin_phone || 'N/A',
        email: appt.customer_email || appt.walkin_email || 'N/A',
        address: appt.service_address || appt.customer_address || 'N/A', 
        notes: appt.customer_notes || '',
        technicianId: appt.technician_id ? appt.technician_id.toString() : undefined,
        technician: appt.tech_first_name ? `Tech. ${appt.tech_first_name}` : undefined,
        rawDate: new Date(appt.appointment_date),
        rating: appt.rating,
        feedback: appt.feedback_text,
        cancellationReason: appt.cancellation_reason,
        cancellationCategory: appt.cancellation_category,
        rejectionReason: appt.rejection_reason,
        cancelledByRole: appt.cancelled_by_role,
        cancelledById: appt.cancelled_by_id,
        category: appt.category_name,
        createdAt: new Date(appt.created_at),
        updatedAt: new Date(appt.updated_at),
        customerAvatar: getProfilePictureUrl(appt.customer_profile_picture),
        technicianAvatar: getProfilePictureUrl(appt.tech_profile_picture)
      }));

      setAppointments(formatted);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === "all") {
        matchesStatus = true;
    } else if (statusFilter === "upcoming") {
        // Match both 'upcoming' and 'confirmed' for the "Confirmed" filter
        matchesStatus = appointment.status === "upcoming" || appointment.status === "confirmed";
    } else {
        matchesStatus = appointment.status === statusFilter;
    }

    const matchesCategory = categoryFilter === "all" || appointment.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
      if (sortBy === 'date') {
          return sortOrder === 'asc' 
            ? a.rawDate.getTime() - b.rawDate.getTime() 
            : b.rawDate.getTime() - a.rawDate.getTime();
      } else if (sortBy === 'name') {
          return sortOrder === 'asc'
            ? a.clientName.localeCompare(b.clientName)
            : b.clientName.localeCompare(a.clientName);
      } else if (sortBy === 'created') {
          return sortOrder === 'asc'
            ? (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
            : (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      } else if (sortBy === 'updated') {
          return sortOrder === 'asc'
            ? (a.updatedAt?.getTime() || 0) - (b.updatedAt?.getTime() || 0)
            : (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
      }
      return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "upcoming":
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3 mr-1" />;
      case "upcoming":
      case "confirmed":
        return <Calendar className="w-3 h-3 mr-1" />;
      case "completed":
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case "cancelled":
      case "rejected":
        return <XCircle className="w-3 h-3 mr-1" />;
      case "in-progress":
        return <Loader className="w-3 h-3 mr-1 animate-spin" />;
      default:
        return null;
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleBulkDelete = async () => {
    if (filteredAppointments.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to move ${filteredAppointments.length} appointments to the recycle bin?`)) {
        return;
    }

    const promise = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) throw new Error("No token");

        const ids = filteredAppointments.map(a => a.id);

        const response = await fetch('http://localhost:5000/api/admin/appointments/bulk-delete', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids })
        });

        if (!response.ok) throw new Error("Failed to delete");

        setAppointments(appointments.filter(app => !ids.includes(app.id)));
        setRecycleBinCount(prev => prev + ids.length);
        return `${ids.length} appointments moved to recycle bin`;
    };

    showPromise(promise(), {
        loading: 'Moving appointments to recycle bin...',
        success: (data) => data,
        error: 'Failed to move appointments to recycle bin'
    });
  };

  const handleUpdateDetails = async (id: string, date: string, time: string, technicianId: string, overrideConflict?: boolean) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const promise = async () => {
      const response = await fetch(`http://localhost:5000/api/admin/appointments/${id}/details`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, technicianId, overrideConflict })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update details");
      }
      fetchAppointments();
      return "Appointment details updated successfully";
    };

    showPromise(promise(), {
      loading: 'Updating appointment details...',
      success: (data) => data,
      error: (err) => err.message || 'Failed to update appointment details',
    });
  };

  const handleStatusUpdate = async (id: string, newStatus: Appointment["status"] | 'deleted', arg3?: string, arg4?: string) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const promise = async () => {
        // If deleting (soft delete)
        if (newStatus === 'deleted') {
             const response = await fetch(`http://localhost:5000/api/admin/appointments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to delete appointment");
            
            setAppointments(appointments.filter(app => app.id !== id));
            setRecycleBinCount(prev => prev + 1);
            return "Appointment moved to recycle bin";
        }

        // Map frontend status to backend status
        let backendStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        if (newStatus === 'in-progress') {
            backendStatus = 'In Progress';
        }
        
        const body: any = { status: backendStatus };
        if (newStatus === 'confirmed' && arg3) {
            body.technicianId = arg3;
        } else if ((newStatus === 'rejected' || newStatus === 'cancelled') && arg3) {
            body.reason = arg3;
            if (arg4) body.category = arg4;
        }

        const response = await fetch(`http://localhost:5000/api/admin/appointments/${id}/status`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error("Failed to update status");

        setAppointments(appointments.map(app => {
            if (app.id === id) {
                const updatedApp: any = { ...app, status: newStatus };
                if (newStatus === 'confirmed' && arg3) {
                    updatedApp.technicianId = arg3;
                    if (arg4) updatedApp.technician = arg4;
                }
                return updatedApp;
            }
            return app;
        }));
        return `Appointment status updated to ${newStatus}`;
    };

    showPromise(promise(), {
      loading: 'Updating status...',
      success: (data) => data,
      error: 'Failed to update status',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Appointments" 
        description="Manage and schedule service appointments efficiently."
        action={
          <div className="flex gap-2">
             <Button
                variant="outline"
                onClick={() => setIsRecycleBinOpen(true)}
                className="relative flex items-center gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-300 transition-all hover:scale-105 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-red-900/20"
             >
                <Trash2 className="w-4 h-4" />
                Recycle Bin
                {recycleBinCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                        {recycleBinCount}
                    </span>
                )}
             </Button>
            <button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#0B4F6C] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#093e54] transition-all shadow-sm hover:shadow-md hover:scale-105"
            >
                <Plus className="w-4 h-4" />
                Book Appointment
            </button>
          </div>
        }
      />

      {/* Filters and Sorting */}
      <div className="bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-border flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Search client, service, or ID..."
                    className="pl-10 border-gray-200 dark:border-border focus:border-[#0B4F6C] dark:focus:border-primary focus:ring-[#0B4F6C] dark:focus:ring-primary bg-white dark:bg-muted/50 text-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2">
                 <select
                    className="bg-white dark:bg-muted/50 border border-gray-300 dark:border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0B4F6C] dark:focus:ring-primary outline-none transition-all hover:border-[#0B4F6C] dark:hover:border-primary text-foreground"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                 >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                 </select>

                 <select 
                    className="bg-white dark:bg-muted/50 border border-gray-300 dark:border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0B4F6C] dark:focus:ring-primary outline-none transition-all hover:border-[#0B4F6C] dark:hover:border-primary text-foreground"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                 >
                     <option value="created">Date Created</option>
                     <option value="updated">Date Updated</option>
                     <option value="date">Appointment Date</option>
                     <option value="name">Client Name</option>
                 </select>
                 <button 
                    className="bg-white dark:bg-muted/50 border border-gray-300 dark:border-border px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-muted text-gray-600 dark:text-muted-foreground transition-all hover:border-[#0B4F6C] dark:hover:border-primary hover:text-[#0B4F6C] dark:hover:text-primary"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                 >
                     {sortOrder === 'asc' ? '↑' : '↓'}
                 </button>
            </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <Filter className="w-4 h-4 text-gray-500 dark:text-muted-foreground shrink-0" />
          {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "upcoming", label: "Confirmed" },
              { id: "in-progress", label: "In Progress" },
              { id: "completed", label: "Completed" },
              { id: "cancelled", label: "Cancelled" },
              { id: "rejected", label: "Rejected" }
          ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap capitalize transition-all font-medium border-2 ${
                  statusFilter === filter.id
                    ? "bg-[#0B4F6C] dark:bg-sky-600 text-white border-[#0B4F6C] dark:border-sky-600 shadow-md"
                    : "bg-white dark:bg-muted/50 text-gray-700 dark:text-muted-foreground border-gray-300 dark:border-border hover:border-[#0B4F6C] dark:hover:border-primary hover:text-[#0B4F6C] dark:hover:text-primary"
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
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-900/20 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Move All {statusFilter === 'all' ? '' : statusFilter === 'upcoming' ? 'Confirmed' : statusFilter.replace('-', ' ')} to Bin
          </Button>
        </div>
      </div>

      {/* Appointments List */}
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E6F0F4] to-[#F0F7FA] dark:from-primary/20 dark:to-primary/10 flex items-center justify-center text-[#0B4F6C] dark:text-primary shrink-0 shadow-inner">
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
                        <span>Created: {appointment.createdAt.toLocaleDateString()}</span>
                    )}
                    {appointment.updatedAt && (
                        <span>Updated: {appointment.updatedAt.toLocaleDateString()}</span>
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
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
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
            <div className="w-16 h-16 bg-gray-50 dark:bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-300 dark:text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-1">No appointments found</h3>
            <p className="text-gray-500 dark:text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <AppointmentDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        appointment={selectedAppointment}
        onUpdateDetails={handleUpdateDetails}
        onApprove={(id, technicianId, technicianName) => handleStatusUpdate(id, 'confirmed', technicianId, technicianName)}
        onReject={(id) => setStatusDialog({ open: true, type: 'reject', appointmentId: id })}
        onCancel={(id) => setStatusDialog({ open: true, type: 'cancel', appointmentId: id })}
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
