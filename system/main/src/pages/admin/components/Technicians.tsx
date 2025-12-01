import { PageHeader } from "./PageHeader";
import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  // Filter,
  // MoreVertical,
  Phone,
  Mail,
  MapPin,
  Star,
  // Calendar,
  // Clock,
  // CheckCircle,
  // XCircle,
  // AlertCircle,
  ArrowUpDown,
  Edit
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TechnicianDetailsDialog, TechnicianDetails } from "./TechnicianDetailsDialog";
import { AppointmentDetailsDialog } from "./AppointmentDetailsDialog";
import { TechnicianEditDialog } from "./TechnicianEditDialog";
import { AddTechnicianDialog, SPECIALTIES } from "./AddTechnicianDialog";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { useFeedback } from "@/context/FeedbackContext";
import { getProfilePictureUrl } from "@/lib/utils";

interface Technician {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  location: string;
  specialty: string;
  status: "available" | "busy" | "offline";
  activeJobs: number;
  completedJobs: number;
  rating: number;
  avatar?: string;
}

export function Technicians() {
  const { showPromise } = useFeedback();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);

  const [selectedTechnicianForEdit, setSelectedTechnicianForEdit] = useState<Technician | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddTechnicianOpen, setIsAddTechnicianOpen] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
    variant: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    actionLabel: "",
    onConfirm: () => {},
    variant: "default"
  });

  const fetchTechnicians = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/admin/technicians', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      const formatted = data.map((tech: any) => ({
        id: tech.user_id.toString(),
        name: `${tech.first_name} ${tech.last_name}`,
        firstName: tech.first_name,
        lastName: tech.last_name,
        phone: tech.phone_number,
        email: tech.email,
        location: tech.address || "Manila",
        specialty: tech.specialty || "General",
        status: (tech.availability_status || 'offline').toLowerCase(),
        activeJobs: tech.active_jobs,
        completedJobs: tech.total_jobs_completed,
        rating: parseFloat(tech.average_rating) || 0,
        avatar: getProfilePictureUrl(tech.profile_picture)
      }));

      setTechnicians(formatted);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleTechnicianAdded = () => {
    fetchTechnicians();
  };

  const getSpecialtyConfig = (specialtyName: string) => {
    return SPECIALTIES.find(s => s.value === specialtyName) || SPECIALTIES.find(s => s.value === "General")!;
  };

  const handleViewDetails = async (techId: string) => {
    try {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`http://localhost:5000/api/admin/technicians/${techId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            setSelectedTechnician(data);
            setIsDetailsOpen(true);
        } else {
            console.error("Failed to fetch details:", data);
            // Optional: Show a toast or alert here
        }
    } catch (error) {
        console.error('Error fetching technician details:', error);
    }
  };

  const handleViewAppointment = async (appointmentId: number) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`http://localhost:5000/api/admin/appointments/${appointmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSelectedAppointment(data);
      setIsAppointmentDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    }
  };

  const handleBan = async (id: number) => {
    setConfirmDialog({
      open: true,
      title: "Ban Technician",
      description: "Are you sure you want to ban this technician? This will prevent them from logging in and accessing the system.",
      actionLabel: "Ban Technician",
      variant: "destructive",
      onConfirm: async () => {
        const promise = async () => {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/technicians/${id}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ action: 'ban' })
            });
            
            if (!response.ok) throw new Error('Failed to ban technician');

            setIsEditOpen(false);
            setConfirmDialog(prev => ({ ...prev, open: false }));
            fetchTechnicians();
            return "Technician banned successfully";
        };

        showPromise(promise(), {
            loading: 'Banning technician...',
            success: (data) => data,
            error: 'Failed to ban technician',
        });
      }
    });
  };

  const handleDemote = async (id: number) => {
    setConfirmDialog({
      open: true,
      title: "Demote Technician",
      description: "Are you sure you want to demote this technician? They will become a regular customer and lose access to technician features.",
      actionLabel: "Demote to Customer",
      variant: "destructive",
      onConfirm: async () => {
        const promise = async () => {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/technicians/${id}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ action: 'demote' })
            });
            
            if (!response.ok) throw new Error('Failed to demote technician');

            setIsEditOpen(false);
            setConfirmDialog(prev => ({ ...prev, open: false }));
            fetchTechnicians();
            return "Technician demoted successfully";
        };

        showPromise(promise(), {
            loading: 'Demoting technician...',
            success: (data) => data,
            error: 'Failed to demote technician',
        });
      }
    });
  };

    const handleEdit = async (id: number, data: any) => {
    const promise = async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/technicians/${id}/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to update technician');

      // Optimistically update list regardless so UI stays in sync with intent
      setTechnicians(prev => prev.map(t => t.id === id.toString() ? {
        ...t,
        name: `${data.first_name} ${data.last_name}`,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone_number,
        location: data.address,
        specialty: data.specialty
      } : t));

      setIsEditOpen(false);
      return "Technician updated successfully";
    };

    showPromise(promise(), {
      loading: 'Updating technician...',
      success: (data) => data,
      error: 'Failed to update technician',
    });
    };

  const openEditDialog = (e: React.MouseEvent, tech: Technician) => {
    e.stopPropagation();
    setSelectedTechnicianForEdit(tech);
    setIsEditOpen(true);
  };

  const filteredTechnicians = technicians.filter((tech) => {
    const matchesSearch =
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || tech.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "jobs") return b.completedJobs - a.completedJobs;
    return 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Technicians" 
        description="Manage your service providers"
        action={
          <button 
            onClick={() => setIsAddTechnicianOpen(true)}
            className="bg-[#0B4F6C] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#093d54] transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Technician
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search technicians..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border focus:border-[#0B4F6C] dark:focus:border-primary focus:ring-[#0B4F6C] dark:focus:ring-primary dark:bg-background"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background border-border dark:bg-background">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="dark:bg-popover dark:text-popover-foreground dark:border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] bg-background border-border dark:bg-background">
            <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="dark:bg-popover dark:text-popover-foreground dark:border-border">
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="jobs">Jobs Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechnicians.map((tech) => {
          const specialtyConfig = getSpecialtyConfig(tech.specialty);
          const SpecialtyIcon = specialtyConfig.icon;

          return (
            <div
              key={tech.id}
              onClick={() => handleViewDetails(tech.id)}
              className="group bg-card dark:bg-card rounded-xl border border-border dark:border-border p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0B4F6C] dark:bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${specialtyConfig.bg} dark:bg-muted/20 flex items-center justify-center border border-border dark:border-border group-hover:border-[#0B4F6C]/30 dark:group-hover:border-primary/30 transition-colors`}>
                    <SpecialtyIcon className={`w-6 h-6 ${specialtyConfig.color} dark:text-primary`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-foreground group-hover:text-[#0B4F6C] dark:group-hover:text-primary transition-colors">{tech.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">{tech.specialty}</p>
                  </div>
                </div>
                <Badge
                  className={`${
                    tech.status === "available"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                      : tech.status === "busy"
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  } border-0`}
                >
                  {tech.status.charAt(0).toUpperCase() + tech.status.slice(1)}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-muted-foreground" />
                  {tech.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-muted-foreground" />
                  <span className="truncate">{tech.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 dark:text-muted-foreground" />
                  <span className="truncate">{tech.location}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 dark:border-border flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900 dark:text-foreground">{tech.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500 dark:text-muted-foreground">Rating</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-muted-foreground">
                  <span className="font-semibold text-gray-900 dark:text-foreground">{tech.completedJobs}</span> Jobs
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-muted/30 px-6 py-3 flex justify-between items-center border-t border-gray-100 dark:border-border -mx-6 -mb-6 mt-4">
                <button 
                  className="text-sm text-gray-600 dark:text-muted-foreground hover:text-[#0B4F6C] dark:hover:text-primary font-medium"
                  onClick={(e) => { e.stopPropagation(); handleViewDetails(tech.id); }}
                >
                  View Profile
                </button>
                <button 
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-muted-foreground hover:text-[#0B4F6C] dark:hover:text-primary hover:bg-white dark:hover:bg-card rounded-full transition-colors border border-transparent hover:border-gray-200 dark:hover:border-border shadow-sm"
                  onClick={(e) => openEditDialog(e, tech)}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <TechnicianDetailsDialog 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
        technician={selectedTechnician}
        onViewAppointment={handleViewAppointment}
      />

      <TechnicianEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        technician={selectedTechnicianForEdit}
        onEdit={handleEdit}
        onBan={handleBan}
        onDemote={handleDemote}
      />

      <AddTechnicianDialog
        open={isAddTechnicianOpen}
        onOpenChange={setIsAddTechnicianOpen}
        onTechnicianAdded={handleTechnicianAdded}
      />

      <AppointmentDetailsDialog
        open={isAppointmentDetailsOpen}
        onOpenChange={setIsAppointmentDetailsOpen}
        appointment={selectedAppointment}
      />

      <ConfirmActionDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        actionLabel={confirmDialog.actionLabel}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
