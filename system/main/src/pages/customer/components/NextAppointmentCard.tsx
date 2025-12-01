import { Calendar, Clock, MapPin, User, Phone, Mail } from 'lucide-react';
import { Button } from "../../../components/ui/button";

interface NextAppointmentCardProps {
  appointment: {
    service: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'in_progress';
    technician: string;
    technicianPhone: string;
    technicianEmail: string;
    address: string;
    notes: string;
    daysUntil?: string;
  };
  onViewDetails?: () => void;
  onReschedule?: () => void;
}

export function NextAppointmentCard({ appointment, onViewDetails, onReschedule }: NextAppointmentCardProps) {
  const statusColors = {
    pending: 'bg-orange-500',
    confirmed: 'bg-blue-500',
    in_progress: 'bg-blue-600',
  };

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm p-3 md:p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-border">
      <div className="flex items-center justify-between mb-3 md:mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#4DBDCC]" />
          <h2 className="text-[#0B4F6C] dark:text-primary font-semibold text-base md:text-xl">Next Appointment</h2>
          {appointment.daysUntil && (
             <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
               {appointment.daysUntil}
             </span>
          )}
        </div>
        <span className={`${statusColors[appointment.status]} text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm`}>
          {statusLabels[appointment.status]}
        </span>
      </div>

      <div className="space-y-2 md:space-y-4">
        <div>
          <h3 className="text-[#0B4F6C] dark:text-primary font-medium mb-1 text-sm md:text-lg">{appointment.service}</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-gray-600 dark:text-muted-foreground text-xs md:text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 md:w-4 md:h-4 text-[#4DBDCC]" />
              <span>{appointment.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              <span>{appointment.time}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-border pt-2 md:pt-4">
          <h4 className="text-[#1A5560] dark:text-foreground text-xs md:text-sm mb-2">Technician Details</h4>
          <div className="space-y-1.5 md:space-y-2">
            <div className="flex items-center gap-2 text-xs md:text-sm text-[#1A5560]/70 dark:text-muted-foreground">
              <User className="w-3 h-3 md:w-4 md:h-4" />
              <span>{appointment.technician}</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Phone className="w-3 h-3 md:w-4 md:h-4 text-[#1A5560]/70 dark:text-muted-foreground" />
              <a
                href={`tel:${appointment.technicianPhone}`}
                className="text-[#3FA9BC] hover:text-[#2A6570] dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors duration-200"
              >
                {appointment.technicianPhone}
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Mail className="w-3 h-3 md:w-4 md:h-4 text-[#1A5560]/70 dark:text-muted-foreground" />
              <a
                href={`mailto:${appointment.technicianEmail}`}
                className="text-[#3FA9BC] hover:text-[#2A6570] dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors duration-200 break-all"
              >
                {appointment.technicianEmail}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-border pt-2 md:pt-4">
          <div className="flex items-start gap-2 text-xs md:text-sm text-[#1A5560]/70 dark:text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0" />
            <span>{appointment.address}</span>
          </div>
          {appointment.notes && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 md:p-3">
              <p className="text-xs md:text-sm text-[#1A5560]/70 dark:text-muted-foreground">{appointment.notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {onViewDetails && (
            <Button 
              variant="outline" 
              className="flex-1 border-[#1A5560] text-[#1A5560] hover:bg-[#1A5560]/10"
              onClick={onViewDetails}
            >
              View Details
            </Button>
          )}
          {onReschedule && (
            <Button 
              className="flex-1 bg-[#3FA9BC] hover:bg-[#2A6570] text-white"
              onClick={onReschedule}
            >
              Reschedule
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
