import { useState, useEffect } from 'react';
import { Plus, Calendar, Search, List, ArrowUpDown } from 'lucide-react';
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { AppointmentListCard } from './AppointmentListCard';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { ViewAppointmentDialog } from './ViewAppointmentDialog';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import { CancelAppointmentDialog } from './CancelAppointmentDialog';
import { RateTechnicianDialog } from './RateTechnicianDialog';
import { CustomerCalendar } from './CustomerCalendar';
import { PageHeader } from './PageHeader';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from "@/context/FeedbackContext";
import { getProfilePictureUrl } from "@/lib/utils";

type AppointmentStatus = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
type ViewMode = 'list' | 'calendar';

export function CustomerAppointments() {
  const { showPromise } = useFeedback();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AppointmentStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<'date' | 'created' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState<string>('');

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/customer/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();

      const formattedAppointments = data.map((appt: any) => ({
        id: appt.appointment_id.toString(),
        serviceId: appt.service_id,
        service: appt.service_name,
        description: appt.customer_notes || 'No description provided',
        date: new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        time: new Date(appt.appointment_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }),
        rawDate: appt.appointment_date.split('T')[0], // For edit form
        rawDateObj: new Date(appt.appointment_date),
        createdAt: new Date(appt.created_at),
        updatedAt: new Date(appt.updated_at),
        status: appt.status.toLowerCase().replace(' ', '_'),
        technician: appt.tech_first_name ? `${appt.tech_first_name} ${appt.tech_last_name}` : 'Pending Assignment',
        technicianPhone: appt.tech_phone || '',
        technicianEmail: appt.tech_email || '',
        technicianAvatar: getProfilePictureUrl(appt.tech_profile_picture),
        address: appt.service_address || 'No address provided',
        notes: appt.customer_notes,
        rating: appt.rating,
        feedback: appt.feedback_text
      }));

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (reason: string, category: string) => {
    if (!selectedAppointment) return;

    const promise = async () => {
      const response = await fetch(`http://localhost:5000/api/appointments/${selectedAppointment.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Cancelled', reason, category })
      });

      if (!response.ok) throw new Error('Failed to cancel appointment');

      setAppointments(appointments.map(apt => 
        apt.id === selectedAppointment.id ? { ...apt, status: 'cancelled' } : apt
      ));
      
      setIsCancelDialogOpen(false);
      fetchAppointments(); // Refresh to get updated state
      return 'Appointment cancelled successfully';
    };

    showPromise(promise(), {
      loading: 'Cancelling appointment...',
      success: (data) => data,
      error: 'Failed to cancel appointment',
    });
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesTab = activeTab === 'all' || apt.status === activeTab;
    const matchesSearch =
      apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    let dateA, dateB;
    if (sortBy === 'date') {
        dateA = a.rawDateObj;
        dateB = b.rawDateObj;
    } else if (sortBy === 'created') {
        dateA = a.createdAt;
        dateB = b.createdAt;
    } else {
        dateA = a.updatedAt;
        dateB = b.updatedAt;
    }
    
    return sortOrder === 'asc' 
        ? dateA.getTime() - dateB.getTime() 
        : dateB.getTime() - dateA.getTime();
  });

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="p-3 md:p-8 animate-fade-in max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader 
        title="My Appointments"
        description="Manage and track your service requests."
        action={
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[#3FA9BC] hover:bg-[#2A6570] transition-colors duration-200 shadow-md hover:shadow-lg w-full md:w-auto"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Book Appointment
          </Button>
        }
      />

      {/* Filters and Search */}
      <div className="bg-white dark:bg-card rounded-xl shadow-sm p-3 md:p-4 mb-4 md:mb-6 border border-gray-100 dark:border-border">
        <div className="flex flex-col gap-4">
          {/* Search Bar at Top */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-gray-200 dark:border-border focus:border-[#3FA9BC] dark:focus:border-primary focus:ring-[#3FA9BC] dark:focus:ring-primary h-9 md:h-10 text-sm w-full bg-white dark:bg-background"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AppointmentStatus)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#1A5560] dark:bg-sky-600 text-white shadow-md'
                      : 'bg-gray-50 dark:bg-muted text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted/80 border border-transparent hover:border-gray-200 dark:hover:border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 items-center w-full lg:w-auto justify-end">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[140px] h-9 md:h-10 bg-white dark:bg-background border-input">
                      <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="date">Appointment Date</SelectItem>
                      <SelectItem value="created">Date Created</SelectItem>
                      <SelectItem value="updated">Last Updated</SelectItem>
                  </SelectContent>
              </Select>

              <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 md:h-10 md:w-10 bg-white dark:bg-background"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={sortOrder === 'asc' ? "Ascending" : "Descending"}
              >
                  <ArrowUpDown className="h-4 w-4" />
              </Button>

              <div className="flex bg-gray-100 dark:bg-muted p-1 rounded-lg border border-gray-200 dark:border-border">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-card shadow-sm text-[#1A5560] dark:text-primary' 
                      : 'text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gray-200/50 dark:hover:bg-muted/80'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${
                    viewMode === 'calendar' 
                      ? 'bg-white dark:bg-card shadow-sm text-[#1A5560] dark:text-primary' 
                      : 'text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gray-200/50 dark:hover:bg-muted/80'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List or Calendar */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3FA9BC] mx-auto"></div>
            <p className="mt-2 text-gray-500 text-sm">Loading appointments...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <CustomerCalendar 
            appointments={filteredAppointments}
            setSelectedAppointment={setSelectedAppointment}
            onViewAppointment={(apt) => {
              setSelectedAppointment(apt);
              setIsViewDialogOpen(true);
            }}
            onCreateAppointment={(date) => {
              // Prevent booking in the past
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (date < today) {
                  return;
              }

              // Format date as YYYY-MM-DD for the input, adjusting for timezone offset
              const offset = date.getTimezoneOffset();
              const localDate = new Date(date.getTime() - (offset * 60 * 1000));
              const formattedDate = localDate.toISOString().split('T')[0];
              setSelectedDateForBooking(formattedDate);
              setIsCreateDialogOpen(true);
            }}
          />
        ) : filteredAppointments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentListCard
                key={appointment.id}
                appointment={appointment}
                onView={(apt) => {
                  setSelectedAppointment(apt);
                  setIsViewDialogOpen(true);
                }}
                onCancel={(apt) => {
                  setSelectedAppointment(apt);
                  setIsCancelDialogOpen(true);
                }}
                onRate={(apt) => {
                  setSelectedAppointment(apt);
                  setIsRateDialogOpen(true);
                }}
                onEdit={(apt) => {
                  setSelectedAppointment(apt);
                  setIsEditDialogOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-medium mb-1 text-lg">No appointments found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {searchQuery ? 'Try adjusting your search terms' : 'You haven\'t booked any appointments yet'}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                Book Your First Appointment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateAppointmentDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setSelectedDateForBooking('');
          }
        }}
        initialDate={selectedDateForBooking}
        onSuccess={fetchAppointments}
      />

      <ViewAppointmentDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        appointment={selectedAppointment}
        onEdit={(apt) => {
          setIsViewDialogOpen(false);
          setSelectedAppointment(apt);
          setIsEditDialogOpen(true);
        }}
        onReschedule={(apt) => {
          setIsViewDialogOpen(false);
          setSelectedAppointment(apt);
          setIsEditDialogOpen(true);
        }}
      />

      <EditAppointmentDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) fetchAppointments();
        }}
        appointment={selectedAppointment}
      />

      <CancelAppointmentDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        appointment={selectedAppointment}
        onConfirm={handleCancelAppointment}
      />

      <RateTechnicianDialog
        open={isRateDialogOpen}
        onOpenChange={(open) => {
          setIsRateDialogOpen(open);
          if (!open) fetchAppointments();
        }}
        appointment={selectedAppointment}
      />
    </div>
  );
}

