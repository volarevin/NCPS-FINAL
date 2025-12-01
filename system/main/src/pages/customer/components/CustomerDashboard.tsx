import { 
  Calendar, Clock, Wrench, CheckCircle2, Plus, Bell
} from 'lucide-react';
import { StatCard } from './StatCard';
import { NextAppointmentCard } from './NextAppointmentCard';
import { NotificationCard } from './NotificationCard';
import { useState, useEffect } from 'react';
import { ViewAppointmentDialog } from './ViewAppointmentDialog';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { PageHeader } from './PageHeader';
import { ServiceBanner } from './ServiceBanner';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CustomerDashboard() {
  const navigate = useNavigate();
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [todaysAppointment, setTodaysAppointment] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  // const [user] = useState<any>(null);

  const fetchDashboardData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Stats
        const statsRes = await fetch('http://localhost:5000/api/customer/stats', { headers });
        
        if (statsRes.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          navigate('/login');
          return;
        }

        const statsData = await statsRes.json();
        setDashboardStats(statsData);

        // Fetch Appointments
        const apptRes = await fetch('http://localhost:5000/api/customer/appointments', { headers });
        
        if (apptRes.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          navigate('/login');
          return;
        }

        const apptData = await apptRes.json();

        // Sort appointments by date ascending
        apptData.sort((a: any, b: any) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

        setAllAppointments(apptData);
        
        const now = new Date();
        const todayStr = now.toDateString();

        // Find today's appointment
        const todayAppt = apptData.find((a: any) => {
            const d = new Date(a.appointment_date);
            return d.toDateString() === todayStr && ['Pending', 'Confirmed', 'In Progress'].includes(a.status);
        });

        if (todayAppt) {
             setTodaysAppointment({
                id: todayAppt.appointment_id,
                service: todayAppt.service_name,
                serviceId: todayAppt.service_id,
                date: 'Today',
                rawDate: todayAppt.appointment_date,
                time: new Date(todayAppt.appointment_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                status: todayAppt.status.toLowerCase(),
                technician: todayAppt.tech_first_name ? `Tech ${todayAppt.tech_first_name} ${todayAppt.tech_last_name}` : 'Pending Assignment',
                technicianPhone: todayAppt.tech_phone || '', 
                technicianEmail: todayAppt.tech_email || '',
                address: todayAppt.service_address || 'No address provided',
                notes: todayAppt.customer_notes || 'No notes provided.',
                description: todayAppt.customer_notes || 'No notes provided.',
             });
        } else {
            setTodaysAppointment(null);
        }

        // Find next appointment (future, not today)
        const upcoming = apptData.find((a: any) => {
             const d = new Date(a.appointment_date);
             return d > now && d.toDateString() !== todayStr && ['Pending', 'Confirmed'].includes(a.status);
        });

        if (upcoming) {
          const upcomingDate = new Date(upcoming.appointment_date);
          
          // Calculate days difference based on midnight
          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const upcomingMidnight = new Date(upcomingDate.getFullYear(), upcomingDate.getMonth(), upcomingDate.getDate());
          const diffTime = upcomingMidnight.getTime() - todayMidnight.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          setNextAppointment({
            id: upcoming.appointment_id,
            service: upcoming.service_name,
            serviceId: upcoming.service_id,
            date: upcomingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            rawDate: upcoming.appointment_date,
            time: upcomingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            status: upcoming.status.toLowerCase(),
            technician: upcoming.tech_first_name ? `Tech ${upcoming.tech_first_name} ${upcoming.tech_last_name}` : 'Pending Assignment',
            technicianPhone: upcoming.tech_phone || '', 
            technicianEmail: upcoming.tech_email || '', 
            address: '123 Main St, Nasugbu, Batangas', 
            notes: upcoming.customer_notes || 'No notes provided.',
            daysUntil: diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
          });
        } else {
            setNextAppointment(null);
        }

        // Fetch Notifications
        const notifRes = await fetch('http://localhost:5000/api/customer/notifications', { headers });
        if (notifRes.ok) {
            const notifData = await notifRes.json();
            // Ensure we are not setting stale data if a delete happened concurrently
            setNotifications(() => {
                // If we just cleared them (length 0), and the fetch returns some, it might be a race condition or they are actually there.
                // But since we fetch on mount, and delete updates state locally, we should trust the fetch unless we want to be very careful.
                // However, the user says they reappear. This implies the fetch is happening AFTER the delete and getting the old data?
                // Or the delete didn't work.
                // Let's just set it.
                return notifData;
            });
        }

        // Fetch Featured Services
        const servicesRes = await fetch('http://localhost:5000/api/customer/featured-services', { headers });
        if (servicesRes.ok) {
            const servicesData = await servicesRes.json();
            setFeaturedServices(servicesData);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      // setUser(JSON.parse(storedUser));
    }
    fetchDashboardData();
  }, []);
  
  const stats = [
    {
      icon: Calendar,
      title: 'Total Appointments',
      value: dashboardStats ? (dashboardStats.pending_count + dashboardStats.completed_count).toString() : '0', // Approximation
      color: '#4DBDCC',
    },
    {
      icon: Clock,
      title: 'Pending',
      value: dashboardStats?.pending_count?.toString() || '0',
      color: '#F97316', // Orange
    },
    {
      icon: Wrench,
      title: 'In Progress',
      value: '0', // TODO: Add to API stats
      color: '#3B82F6', // Blue
    },
    {
      icon: CheckCircle2,
      title: 'Completed',
      value: dashboardStats?.completed_count?.toString() || '0',
      color: '#22C55E', // Green
    },
  ];

  const defaultNextAppointment = {
    service: 'No Upcoming Appointments',
    date: '-',
    time: '-',
    status: 'pending' as const,
    technician: '-',
    technicianPhone: '-',
    technicianEmail: '-',
    address: '-',
    notes: '-',
  };



  const handleNotificationClick = (notification: any) => {
    if (notification.related_appointment_id) {
        const appt = allAppointments.find(a => a.appointment_id === notification.related_appointment_id);
        if (appt) {
            const formattedAppt = {
                id: appt.appointment_id,
                service: appt.service_name,
                serviceId: appt.service_id,
                date: new Date(appt.appointment_date).toLocaleDateString(),
                rawDate: appt.appointment_date,
                time: new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: appt.status.toLowerCase(),
                technician: appt.tech_first_name ? `Tech ${appt.tech_first_name} ${appt.tech_last_name}` : 'Pending Assignment',
                technicianPhone: appt.tech_phone || '',
                technicianEmail: appt.tech_email || '',
                address: appt.service_address || 'No address provided',
                notes: appt.customer_notes || 'No notes provided.',
                description: appt.customer_notes,
            };
            setSelectedAppointment(formattedAppt);
            setIsViewDialogOpen(true);
        }
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
        const token = sessionStorage.getItem('token');
        await fetch(`http://localhost:5000/api/customer/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications(prev => prev.filter(n => n.notification_id !== id));
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
        const token = sessionStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/customer/notifications', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            setNotifications([]);
        } else {
            console.error('Failed to clear notifications');
        }
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
  };

  return (
    <div className="p-3 md:p-8 animate-fade-in max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
            title="Dashboard Overview"
        />
        <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[#0B4F6C] hover:bg-[#093e54] text-white shadow-md transition-all hover:shadow-lg"
        >
            <Plus className="w-4 h-4 mr-2" />
            Book Appointment
        </Button>
      </div>

      {/* Featured Services Banner */}
      <ServiceBanner services={featuredServices} />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Today's Appointment Section */}
      {todaysAppointment && (
        <div className="bg-gradient-to-r from-[#0B4F6C] to-[#4DBDCC] rounded-xl shadow-lg p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Today's Appointment
                </h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    {todaysAppointment.status.toUpperCase()}
                </span>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                <div>
                    <p className="text-white/80 text-sm mb-1">Service</p>
                    <p className="font-semibold text-lg">{todaysAppointment.service}</p>
                </div>
                <div>
                    <p className="text-white/80 text-sm mb-1">Time</p>
                    <p className="font-semibold text-lg flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {todaysAppointment.time}
                    </p>
                </div>
                <div>
                    <p className="text-white/80 text-sm mb-1">Technician</p>
                    <p className="font-semibold text-lg">{todaysAppointment.technician}</p>
                </div>
            </div>
             <div className="mt-4 pt-4 border-t border-white/20 flex justify-end">
                <Button 
                    onClick={() => {
                        setSelectedAppointment(todaysAppointment);
                        setIsViewDialogOpen(true);
                    }} 
                    variant="secondary"
                    className="bg-white text-[#0B4F6C] hover:bg-gray-100"
                >
                    View Details
                </Button>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* Next Appointment */}
        <NextAppointmentCard 
          appointment={nextAppointment || defaultNextAppointment}
          onViewDetails={() => setIsViewDialogOpen(true)}
          onReschedule={() => setIsEditDialogOpen(true)}
        />

        {/* Notifications */}
        <div className="bg-white dark:bg-card rounded-xl shadow-sm p-3 md:p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-border">
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-[#4DBDCC]" />
                <h2 className="text-[#0B4F6C] dark:text-primary font-semibold text-sm md:text-lg">Notifications</h2>
            </div>
            {notifications.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-gray-500 hover:text-red-500 h-8"
                        >
                            Clear All
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. All your notifications will be permanently deleted.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearAllNotifications} className="bg-red-500 hover:bg-red-600">
                                Yes, clear all
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
          <div className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <NotificationCard 
                    key={notif.notification_id} 
                    notification={notif} 
                    onClick={() => handleNotificationClick(notif)}
                    onDelete={(e) => handleDeleteNotification(e, notif.notification_id)}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 text-sm md:text-base py-4">
                No new notifications.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Featured Services Section - New */}
      <ViewAppointmentDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        appointment={selectedAppointment || nextAppointment}
        onEdit={() => {
          setIsViewDialogOpen(false);
          setIsEditDialogOpen(true);
        }}
        onReschedule={() => {
          setIsViewDialogOpen(false);
          setIsEditDialogOpen(true);
        }}
      />

      <EditAppointmentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        appointment={nextAppointment}
      />

      <CreateAppointmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialServiceId={selectedAppointment?.service_id}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
