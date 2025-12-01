import { Calendar, Clock, PlayCircle, X, Bell, CheckCircle2, XCircle, AlertCircle, CheckCheck } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { PageHeader } from "./PageHeader";
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

interface TechnicianDashboardContentProps {
  technicianProfile: any;
  stats: any[];
  todayAppointments: any[];
  upcomingAppointments: any[];
  notifications: any[];
  setSelectedAppointment: (apt: any) => void;
  setActiveTab: (tab: "dashboard" | "appointments" | "profile" | "ratings") => void;
  getStatusBadge: (status: string) => JSX.Element;
  onDeleteNotification: (e: React.MouseEvent, id: number) => void;
  onClearAllNotifications: () => void;
  availability?: { status: string, is_online: number, last_seen: string } | null;
  onStatusChange?: (status: string) => void;
}

export function TechnicianDashboardContent({
  // technicianProfile,
  stats,
  todayAppointments,
  upcomingAppointments,
  notifications,
  setSelectedAppointment,
  setActiveTab,
  getStatusBadge,
  onDeleteNotification,
  onClearAllNotifications,
  availability,
  onStatusChange
}: TechnicianDashboardContentProps) {

  const getNotificationIcon = (title: string) => {
    if (title.includes('Approved')) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (title.includes('Rejected')) return <XCircle className="w-5 h-5 text-red-500" />;
    if (title.includes('Cancelled')) return <AlertCircle className="w-5 h-5 text-orange-500" />;
    if (title.includes('Completed')) return <CheckCheck className="w-5 h-5 text-blue-500" />;
    if (title.includes('Assigned')) return <Calendar className="w-5 h-5 text-blue-500" />;
    if (title.includes('Rating')) return <CheckCircle2 className="w-5 h-5 text-yellow-500" />;
    return <Bell className="w-5 h-5 text-[#4DBDCC]" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader 
        title="Dashboard Overview"
        action={
            availability && (
                <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                            availability.status === 'available' ? 'bg-green-500' :
                            availability.status === 'busy' ? 'bg-orange-500' : 'bg-gray-400'
                        }`} />
                        <select 
                            className="bg-transparent text-sm font-medium outline-none cursor-pointer dark:text-foreground"
                            value={availability.status}
                            onChange={(e) => onStatusChange?.(e.target.value)}
                            disabled={availability.status === 'busy'}
                        >
                            <option value="available">Available</option>
                            <option value="busy" disabled>Busy</option>
                            <option value="offline">Offline</option>
                        </select>
                    </div>
                </div>
            )
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className={`${stat.color} border-l-4 shadow-sm hover:shadow-md transition-all duration-200 bg-card`}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl lg:text-3xl font-bold text-[#0B4F6C] dark:text-primary mt-1">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-full bg-muted/50 ${stat.iconColor}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0B4F6C] dark:text-primary">Today's Schedule</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab("appointments")}
              className="text-[#0B4F6C] dark:text-primary border-[#0B4F6C] dark:border-primary hover:bg-[#E8F5F4] dark:hover:bg-primary/10"
            >
              View All
            </Button>
          </div>
          
          {todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <Card 
                  key={apt.id}
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-[#0B4F6C] dark:border-l-primary group bg-card"
                  onClick={() => setSelectedAppointment(apt)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#E8F5F4] dark:bg-primary/10 p-3 rounded-full text-[#0B4F6C] dark:text-primary group-hover:bg-[#0B4F6C] dark:group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{apt.time}</h3>
                        <p className="text-sm text-muted-foreground">{apt.service}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{apt.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(apt.status)}
                      <Button size="icon" variant="ghost" className="text-muted-foreground group-hover:text-[#0B4F6C] dark:group-hover:text-primary">
                        <PlayCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No appointments scheduled for today.</p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming */}
          <div className="pt-4">
            <h2 className="text-xl font-bold text-[#0B4F6C] dark:text-primary mb-4">Upcoming This Week</h2>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <Card 
                    key={apt.id}
                    className="hover:shadow-md transition-all duration-200 cursor-pointer group bg-card"
                    onClick={() => setSelectedAppointment(apt)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-muted p-3 rounded-full text-muted-foreground group-hover:bg-[#0B4F6C] dark:group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{apt.date}</h3>
                          <p className="text-sm text-muted-foreground">{apt.service}</p>
                        </div>
                      </div>
                      {getStatusBadge(apt.status)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No upcoming appointments this week.</p>
            )}
          </div>
        </div>

        {/* Recent Activity / Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0B4F6C] dark:text-primary">Notifications</h2>
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
                            <AlertDialogAction onClick={onClearAllNotifications} className="bg-red-500 hover:bg-red-600">
                                Yes, clear all
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
          <Card className="bg-transparent border-none shadow-none">
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pr-2">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                        key={notification.id} 
                        className="relative border-l-4 border-l-[#4DBDCC] bg-white dark:bg-card p-4 rounded-r-lg shadow-sm hover:shadow-md transition-all cursor-pointer mb-3 border border-gray-100 dark:border-border group"
                    >
                      <button 
                          onClick={(e) => onDeleteNotification(e, notification.id)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete notification"
                      >
                          <X className="w-4 h-4" />
                      </button>
                      <div className="flex gap-3 pr-6">
                        <div className="mt-1 flex-shrink-0">
                          {getNotificationIcon(notification.title)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-[#0B4F6C] dark:text-primary text-sm md:text-base truncate pr-2">{notification.title}</h4>
                              <span className="text-[10px] text-gray-400 dark:text-muted-foreground whitespace-nowrap flex-shrink-0">
                                  {new Date(notification.time).toLocaleString()}
                              </span>
                          </div>
                          <p className="text-gray-600 dark:text-muted-foreground text-xs md:text-sm mt-1 line-clamp-2">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-muted-foreground bg-card rounded-lg border border-dashed">
                    <p>No new notifications.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
