import { Calendar, Clock, History, User, MapPin, Star, Search, Filter, ArrowUpDown, List } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
// import { Alert, AlertDescription } from "../../../components/ui/alert";
import { PageHeader } from "./PageHeader";
import { useState } from "react";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { TechnicianCalendar } from "./TechnicianCalendar";
import { getProfilePictureUrl } from "@/lib/utils";
import { CompleteJobDialog } from "./CompleteJobDialog";

interface TechnicianAppointmentsProps {
  appointments: any[];
  setSelectedAppointment: (apt: any) => void;
  updateAppointmentStatus: (id: string, status: any, reason?: string, category?: string, totalCost?: number, costNotes?: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

export function TechnicianAppointments({
  appointments,
  setSelectedAppointment,
  updateAppointmentStatus,
  getStatusBadge
}: TechnicianAppointmentsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "created" | "updated" | "name">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<any>(null);

  const filteredAppointments = appointments
    .filter((apt) => {
      const matchesSearch = 
        apt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.id?.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
      } else if (sortBy === "name") {
        comparison = (a.clientName || "").localeCompare(b.clientName || "");
      } else if (sortBy === "created") {
        // Assuming id is somewhat chronological or we have createdAt, falling back to rawDate if not available
        comparison = (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        if (comparison === 0) comparison = parseInt(a.id) - parseInt(b.id);
      } else if (sortBy === "updated") {
         comparison = (a.updatedAt ? new Date(a.updatedAt).getTime() : 0) - (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const completedAppointments = appointments.filter(a => a.status === "Completed");
  const completedCount = completedAppointments.length;
  
  const ratedAppointments = completedAppointments.filter(a => typeof a.rating === 'number' && a.rating > 0);
  const averageRating = ratedAppointments.length > 0 
    ? ratedAppointments.reduce((acc, curr) => acc + curr.rating, 0) / ratedAppointments.length 
    : 0;

  const recentActivity = [...appointments]
    .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.rawDate).getTime();
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.rawDate).getTime();
        return dateB - dateA;
    })
    .slice(0, 5);

  const isToday = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader 
        title="My Appointments"
        description="Manage your assigned service appointments."
        action={
          <div className="flex gap-2">
            <Button 
              className="bg-[#0B4F6C] hover:bg-[#145A75] gap-2 shadow-md hover:shadow-lg transition-all"
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            >
              {viewMode === 'list' ? <Calendar className="w-4 h-4" /> : <List className="w-4 h-4" />}
              {viewMode === 'list' ? "Calendar View" : "List View"}
            </Button>
          </div>
        }
      />

      {/* Filters & Search */}
      <div className="bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-border space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Search client, service, or ID..."
                    className="pl-10 border-gray-200 dark:border-input dark:bg-background dark:text-foreground focus:border-[#0B4F6C] dark:focus:border-primary focus:ring-[#0B4F6C] dark:focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2">
                 <Select 
                    value={sortBy}
                    onValueChange={(value: any) => setSortBy(value)}
                 >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                     <SelectItem value="created">Date Created</SelectItem>
                     <SelectItem value="updated">Date Updated</SelectItem>
                     <SelectItem value="date">Appointment Date</SelectItem>
                     <SelectItem value="name">Client Name</SelectItem>
                    </SelectContent>
                 </Select>

                 <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="shrink-0"
                 >
                     <ArrowUpDown className="w-4 h-4" />
                 </Button>
            </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <Filter className="w-4 h-4 text-gray-500 dark:text-muted-foreground shrink-0" />
          {[
              { id: "all", label: "All" },
              { id: "Confirmed", label: "Confirmed" },
              { id: "In Progress", label: "In Progress" },
              { id: "Completed", label: "Completed" },
              { id: "Cancelled", label: "Cancelled" }
          ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap capitalize transition-all font-medium border-2 ${
                  statusFilter === filter.id
                    ? "bg-[#0B4F6C] dark:bg-sky-600 text-white border-[#0B4F6C] dark:border-sky-600 shadow-md"
                    : "bg-white dark:bg-card text-gray-700 dark:text-foreground border-gray-300 dark:border-input hover:border-[#0B4F6C] dark:hover:border-primary hover:text-[#0B4F6C] dark:hover:text-primary"
                }`}
              >
                {filter.label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointment List */}
        <div className="lg:col-span-2 space-y-4">
          {viewMode === 'list' ? (
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt) => (
            <Card 
              key={apt.id}
              className="hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group"
              onClick={() => setSelectedAppointment(apt)}
            >
              <div className="flex flex-col sm:flex-row">
                <div className={`w-full sm:w-2 ${
                  apt.status === "Pending" ? "bg-orange-500" :
                  apt.status === "In Progress" ? "bg-blue-500" :
                  apt.status === "Completed" ? "bg-green-500" : "bg-red-500"
                }`} />
                <CardContent className="flex-1 p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-foreground group-hover:text-[#0B4F6C] dark:group-hover:text-primary transition-colors">{apt.service}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                        {apt.customerAvatar ? (
                          <img src={getProfilePictureUrl(apt.customerAvatar)} alt={apt.customerName} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <span>{apt.customerName}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {apt.date}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {apt.time}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{apt.address}</span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 sm:w-full hover:bg-gray-50 dark:hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(apt);
                        }}
                      >
                        View Details
                      </Button>
                      {(apt.status === "Pending" || apt.status === "Confirmed") && isToday(apt.rawDate) && (
                        <Button 
                          size="sm" 
                          className="flex-1 sm:w-full bg-blue-500 hover:bg-blue-600 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAppointmentStatus(apt.id, "In Progress");
                          }}
                        >
                          Start
                        </Button>
                      )}
                      {apt.status === "In Progress" && (
                        <Button 
                          size="sm" 
                          className="flex-1 sm:w-full bg-green-500 hover:bg-green-600 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobForCompletion(apt);
                            setCompleteDialogOpen(true);
                          }}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-card rounded-xl border border-dashed border-gray-300 dark:border-border">
                <p className="text-gray-500 dark:text-muted-foreground">No appointments found matching your criteria.</p>
            </div>
          )}
          </div>
          ) : (
            <TechnicianCalendar 
              appointments={filteredAppointments} 
              setSelectedAppointment={setSelectedAppointment} 
            />
          )}
        </div>

        {/* Quick Stats / Summary */}
        <div className="space-y-6">
          <Card className="bg-[#0B4F6C] dark:bg-sky-600 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Weekly Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Completed Jobs</span>
                  <span className="font-bold text-2xl">{completedCount}</span>
                </div>
                <Separator className="bg-white/20 dark:bg-primary-foreground/20" />
                <div className="flex justify-between items-center">
                  <span className="text-white/80 dark:text-primary-foreground/80">Total Assigned</span>
                  <span className="font-bold text-2xl">{appointments.length}</span>
                </div>
                <Separator className="bg-white/20 dark:bg-primary-foreground/20" />
                <div className="flex justify-between items-center">
                  <span className="text-white/80 dark:text-primary-foreground/80">Customer Rating</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-2xl">{averageRating.toFixed(1)}</span>
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-[#0B4F6C] dark:text-primary flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((apt, idx) => (
                  <div key={idx} className="flex gap-3 items-start pb-3 border-b border-gray-100 dark:border-border last:border-0 last:pb-0">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      apt.status === 'Completed' ? 'bg-green-500' :
                      apt.status === 'In Progress' ? 'bg-blue-500' :
                      apt.status === 'Cancelled' ? 'bg-red-500' : 'bg-orange-500'
                    }`} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                        {apt.service} - <span className="text-gray-600 dark:text-muted-foreground">{apt.status}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
                        {apt.customerName} • {apt.updatedAt ? new Date(apt.updatedAt).toLocaleDateString() : apt.date}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-muted-foreground text-center py-4">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CompleteJobDialog 
        isOpen={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        onConfirm={(cost, notes) => {
          if (selectedJobForCompletion) {
            updateAppointmentStatus(selectedJobForCompletion.id, "Completed", undefined, undefined, cost, notes);
          }
        }}
        serviceName={selectedJobForCompletion?.service}
      />
    </div>
  );
}
