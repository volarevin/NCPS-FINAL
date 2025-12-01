import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFeedback } from "@/context/FeedbackContext";
import { Calendar, CheckCircle, PlayCircle, Star, StarHalf } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { getProfilePictureUrl } from "@/lib/utils";
import { TechnicianSidebar } from "./components/TechnicianSidebar";
import { TechnicianDashboardContent } from "./components/TechnicianDashboardContent";
import { TechnicianAppointments } from "./components/TechnicianAppointments";
import ProfilePage from "../common/ProfilePage";
import { TechnicianRatings } from "./components/TechnicianRatings";
import AppointmentDetailsModal from "./components/AppointmentDetailsModal";
import { MobileHeader } from "./components/MobileHeader";
import TopBar from "../../components/TopBar";

interface Appointment {
  id: string;
  customerName: string;
  service: string;
  serviceId?: string;
  date: string;
  time: string;
  phone: string;
  email: string;
  address: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  notes: string;
  rawDate: Date;
  rating?: number;
  feedback?: string;
  cancellationReason?: string;
  cancellationCategory?: string;
  rejectionReason?: string;
  cancelledByRole?: string;
  cancelledById?: string;
  updatedAt?: Date;
  customerAvatar?: string;
}

export default function TechnicianPage() {
  const navigate = useNavigate();
  const { showPromise } = useFeedback();
  const [activeTab, setActiveTab] = useState<"dashboard" | "appointments" | "profile" | "ratings">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [technicianProfile, setTechnicianProfile] = useState<any>(null);
  const [availability, setAvailability] = useState<{ status: string, is_online: number, last_seen: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Heartbeat
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch('http://localhost:5000/api/auth/heartbeat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).catch(err => console.error('Heartbeat failed', err));
    };

    sendHeartbeat(); // Initial
    const interval = setInterval(sendHeartbeat, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch Availability
  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/technician/availability', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailability({
            status: data.availability_status,
            is_online: data.is_online,
            last_seen: data.last_seen
        });
      }
    } catch (error) {
      console.error("Error fetching availability", error);
    }
  };

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(fetchAvailability, 10000); // Poll every 10s for updates
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
      try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5000/api/technician/availability', {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ status: newStatus })
          });
          
          if (res.ok) {
              fetchAvailability();
          } else {
              const err = await res.json();
              // Show error toast?
              console.error(err.message);
          }
      } catch (error) {
          console.error("Error updating status", error);
      }
  };

  useEffect(() => {
    document.title = "Technician Dashboard";
    const init = async () => {
      await Promise.all([fetchJobs(), fetchProfile(), fetchNotifications()]);
      setIsLoading(false);
    };
    init();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:5000/api/technician/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
        const token = sessionStorage.getItem('token');
        await fetch(`http://localhost:5000/api/technician/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
        const token = sessionStorage.getItem('token');
        await fetch('http://localhost:5000/api/technician/notifications', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications([]);
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/technician/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();

      const formatted = data.map((job: any) => {
        // Normalize status
        let status = job.status;
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === 'in-progress' || lowerStatus === 'in_progress' || lowerStatus === 'in progress') {
          status = 'In Progress';
        } else {
          status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        }

        return {
          id: job.appointment_id.toString(),
          customerName: `${job.customer_first_name} ${job.customer_last_name}`,
          service: job.service_name,
          serviceId: job.service_id ? job.service_id.toString() : undefined,
          date: new Date(job.appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          time: new Date(job.appointment_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          phone: job.customer_phone || 'N/A',
          email: job.customer_email || 'N/A',
          address: job.service_address || 'N/A',
          status: status,
          notes: job.customer_notes || '',
          rawDate: new Date(job.appointment_date),
          rating: job.rating,
          feedback: job.feedback_text,
          cancellationReason: job.cancellation_reason,
          cancellationCategory: job.cancellation_category,
          cancelledByRole: job.cancelled_by_role,
          cancelledById: job.cancelled_by_id,
          updatedAt: new Date(job.updated_at),
          customerAvatar: getProfilePictureUrl(job.customer_profile_picture)
        };
      });

      setAppointments(formatted);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/technician/profile', {
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
        setTechnicianProfile({
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          phone: data.phone_number,
          address: data.address || "",
          specialization: data.specialty || "General",
          rating: parseFloat(data.average_rating) || 0,
          totalJobs: data.total_jobs_completed || 0,
          bio: data.bio || "",
          created_at: data.created_at
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const technicianRatings = appointments
    .filter(apt => typeof apt.rating === 'number' && apt.rating > 0)
    .map(apt => ({
      id: apt.id,
      customerName: apt.customerName,
      service: apt.service,
      rating: apt.rating as number,
      feedback: apt.feedback || "No written feedback provided.",
      date: apt.date,
      rawDate: apt.rawDate
    }))
    .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const updateAppointmentStatus = async (
    appointmentId: string, 
    newStatus: "Pending" | "In Progress" | "Completed" | "Cancelled", 
    reason?: string, 
    category?: string,
    totalCost?: number,
    costNotes?: string
  ) => {
    const promise = async () => {
      const body: any = { status: newStatus };
      if (reason) body.reason = reason;
      if (category) body.category = category;
      if (totalCost !== undefined) body.totalCost = totalCost;
      if (costNotes) body.costNotes = costNotes;

      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to update status');

      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
      
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus });
      }
      return `Appointment status updated to ${newStatus}`;
    };

    showPromise(promise(), {
      loading: 'Updating status...',
      success: (data) => data,
      error: 'Failed to update appointment status',
    });
  };

  // const _updateProfile = async (updatedProfile: any) => {
  //   const promise = async () => {
  //     const response = await fetch('http://localhost:5000/api/technician/profile', {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  //       },
  //       body: JSON.stringify(updatedProfile)
  //     });

  //     if (!response.ok) throw new Error('Failed to update profile');

  //     await response.json();
  //     setTechnicianProfile((prev: any) => ({ ...prev, ...updatedProfile }));
  //     return 'Profile updated successfully';
  //   };

  //   showPromise(promise(), {
  //     loading: 'Updating profile...',
  //     success: (data) => data,
  //     error: 'Failed to update profile',
  //   });
  // };

  const stats = [
    {
      title: "Total Assigned",
      value: appointments.length,
      subtitle: "Current appointments",
      icon: <Calendar className="w-5 h-5" />,
      color: "border-l-blue-500",
      iconColor: "text-blue-600"
    },
    {
      title: "In Progress",
      value: appointments.filter(a => a.status === "In Progress").length,
      subtitle: "Currently working",
      icon: <PlayCircle className="w-5 h-5" />,
      color: "border-l-blue-600",
      iconColor: "text-blue-600"
    },
    {
      title: "Completed",
      value: appointments.filter(a => a.status === "Completed").length,
      subtitle: "Successfully finished",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "border-l-green-500",
      iconColor: "text-green-600"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-orange-500 hover:bg-orange-600">{status}</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>;
      case "Completed":
        return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
      case "Cancelled":
        return <Badge className="bg-red-500 hover:bg-red-600">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get today's appointments
  const todayAppointments = appointments.filter(a => {
    const today = new Date();
    const appointmentDate = new Date(a.rawDate);
    return appointmentDate.toDateString() === today.toDateString();
  });

  // Get upcoming appointments (next 7 days)
  const upcomingAppointments = appointments.filter(a => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(a.rawDate);
    appointmentDate.setHours(0, 0, 0, 0);
    
    const diffTime = appointmentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  // const _handleDeleteAccount = () => {
  //   if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
  //     const promise = Promise.resolve("Account deletion requested. Please contact the administrator to complete this process.");
  //     showPromise(promise, {
  //       loading: 'Processing...',
  //       success: (data) => data,
  //       error: 'Error',
  //     });
  //   }
  // };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4F6C]"></div>
        </div>
      );
    }

    if (!technicianProfile) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p>Failed to load profile data.</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-[#0B4F6C] hover:underline">
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <TechnicianDashboardContent
            technicianProfile={technicianProfile}
            stats={stats}
            todayAppointments={todayAppointments}
            upcomingAppointments={upcomingAppointments}
            notifications={notifications}
            setSelectedAppointment={setSelectedAppointment}
            setActiveTab={setActiveTab}
            getStatusBadge={getStatusBadge}
            onDeleteNotification={handleDeleteNotification}
            onClearAllNotifications={handleClearAllNotifications}
          />
        );
      case "appointments":
        return (
          <TechnicianAppointments
            appointments={appointments}
            setSelectedAppointment={setSelectedAppointment}
            updateAppointmentStatus={updateAppointmentStatus}
            getStatusBadge={getStatusBadge}
          />
        );
      case "ratings":
        return (
          <TechnicianRatings
            ratings={technicianRatings}
            renderStars={renderStars}
          />
        );
      case "profile":
        return <ProfilePage />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-200">
      {/* Mobile Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <MobileHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 backdrop-blur-sm bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <TechnicianSidebar
        currentPage={activeTab}
        onNavigate={(page) => {
          setActiveTab(page);
          setSidebarOpen(false);
        }}
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-16 lg:pt-0">
        <div className="hidden lg:block">
          <TopBar onProfileClick={() => setActiveTab("profile")} />
        </div>
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdateStatus={updateAppointmentStatus}
          isTechnician={true}
        />
      )}
    </div>
  );
}
